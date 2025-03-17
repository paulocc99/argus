from flask_apscheduler import APScheduler
from datetime import datetime

from clients import ElasticClient
from utils import to_dict
from models.rule import Rule
from models.alert import AlertOrigin, AlertType, BaselineAlert
from models.asset import Asset
from models.baseline import BaselineAnalytic, BaselineSingleEvent, AnalyticType


class EngineScheduler:
    def __init__(self, es, baseline, scheduler):
        self._es: ElasticClient = es
        self._baseline: Baseline = baseline
        self._scheduler: APScheduler = scheduler

    def _job_by_id(self, job_id: str):
        return self._scheduler.get_job(job_id)

    def remove_job_by_id(self, job_id: str) -> None:
        if not self._job_by_id(job_id):
            return
        self._scheduler.remove_job(job_id)

    def load_rules(self):
        rules = Rule.periodic_rules().filter(active=True)
        print(f"[+] Loading {len(rules)} rules.")
        for rule in rules:
            self.load_rule(rule)

    def load_rule(self, rule: Rule):
        job_id = str(rule.uuid)
        if self._job_by_id(job_id):
            return

        self._scheduler.add_job(
            id=job_id,
            func=self.handle_rule_task,
            trigger="interval",
            args=[rule],
            seconds=rule.trigger.get_sleep_time(),
            misfire_grace_time=None,
        )

    def load_analytics(self):
        analytics = BaselineAnalytic.get_all().filter(active=True)
        print(f"[+] Loading {len(analytics)} baseline analytics.")
        for analytic in analytics:
            self.load_analytic(analytic)

    def load_analytic(self, analytic: BaselineAnalytic):
        self._scheduler.add_job(
            id=analytic.code,
            func=self.handle_analytic_task,
            trigger="interval",
            args=[analytic],
            seconds=analytic.get_sleep_time(),
            misfire_grace_time=None,
        )

    def handle_analytic_task(self, analytic: BaselineAnalytic, force: bool = False):
        """Handle the execution of a baseline analytic"""
        analytic.reload()
        if not (force or analytic.active):
            return

        print(f"[Analytics] Running analytic: {analytic.name}")

        if analytic.category is AnalyticType.ASSET:
            assets = Asset.get_by_ids(analytic.asset_control)
            for asset in assets:
                print(f"[{analytic.name}] Running against asset: {asset.name}")
                base = self._baseline.get_base_analytic_data(
                    analytic, latest=False, asset=asset
                )
                latest = self._baseline.get_base_analytic_data(
                    analytic, latest=True, asset=asset
                )
                deviation = [e for e in latest if e not in base]

                if len(deviation) == 0:
                    continue

                events = BaselineSingleEvent.get_events(
                    category=analytic.code,
                    fields=analytic.fields,
                    deviations=deviation,
                    asset=asset,
                )
                self._baseline.create_baseline_event(events)
                for event in events:
                    alert = BaselineAlert(
                        type=AlertType.ALERT,
                        analytic=to_dict(analytic),
                        deviation=event.deviation,
                        origin=AlertOrigin.BASELINE,
                        related_ips=event.ips,
                    )
                    alert.save()

        elif analytic.category is AnalyticType.GENERAL:
            base_data = self._baseline.get_base_analytic_data(analytic, latest=False)
            latest_data = self._baseline.get_base_analytic_data(analytic, latest=True)
            deviations = [e for e in latest_data if e not in base_data]

            if len(deviations) == 0:
                return

            events = BaselineSingleEvent.get_events(
                category=analytic.code,
                fields=analytic.fields,
                deviations=deviations,
            )
            self._baseline.create_baseline_event(events)
            for event in events:
                alert = BaselineAlert(
                    type=AlertType.ALERT,
                    analytic=to_dict(analytic),
                    deviation=event.deviation,
                    related_ips=event.ips,
                )
                alert.save()

    def handle_rule_task(self, rule: Rule, force: bool = False):
        """Handle the continuous execution of a rule"""
        rule.reload()

        if not (force or rule.active):
            return

        print(f"{datetime.now()} | Running {rule.trigger.type.value} rule: {rule.name}")
        rule.run(self._es, self)
