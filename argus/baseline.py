from __future__ import annotations
from dataclasses import dataclass
from statistics import mean
from typing import Optional
import ipaddress

from models.core import Datasource, Setting, TimeRange
from models.baseline import AnalyticType, BaselineAnalytic, BaselineSingleEvent
from models.asset import Asset
from models.rule import *
from clients import ElasticClient


@dataclass
class Baseline:
    es: ElasticClient
    settings: Setting

    def get_baseline_channels(self, time_range: TimeRange):
        """ """
        fields = ["source.ip", "destination.ip"]
        channels = []

        query = None
        if time_range:
            query = f"@timestamp:[{time_range.start.strftime('%Y-%m-%d')} TO {time_range.end.strftime('%Y-%m-%d')}]"

        indices = Datasource.get_all_indices()
        r = self.es.search_by_fields(fields, index=indices, cfilter=query)

        if not r:
            print("[x] No network data")
            return channels

        subnets = self.settings.monitoring.subnets

        for channel in r["aggregations"]["values"]["buckets"]:
            ips = channel["key"]
            if any(
                ip
                for ip in ips
                if not isinstance(ipaddress.ip_address(ip), ipaddress.IPv4Address)
                or ipaddress.ip_address(ip).is_global
                # or ipaddress.ip_address(ip) not in [ipaddress.IPv4Network(sub) for sub in subnets]
                or not any(
                    sub
                    for sub in subnets
                    if ipaddress.ip_address(ip) in ipaddress.IPv4Network(sub)
                )
            ):
                continue

            # Increments the count of the existing ips channels
            ch = next(filter(lambda c: set(c["ips"]) == set(ips), channels), None)
            if ch:
                ch["count"] += channel["doc_count"]
            else:
                channels.append({"ips": ips, "count": channel["doc_count"]})

        return channels

    def _data_flow_info(
        self, ips: list[str], intervals: list[str], time_range: TimeRange | None
    ) -> list[dict]:
        data_flow_averages = []
        query = f"((destination.ip:{ips[0]} AND source.ip:{ips[1]}) OR (destination.ip:{ips[1]} AND source.ip:{ips[0]}))"

        if time_range:
            query += f" AND (@timestamp:[{time_range.start.strftime('%Y-%m-%d')} TO {time_range.end.strftime('%Y-%m-%d')}])"

        for interval in intervals:
            indices = Datasource.get_all_indices()
            r = self.es.data_flows_by_day(
                index=indices, interval=interval, cfilter=query
            )
            flows_by_interval = [day.get("doc_count") for day in r]

            if len(flows_by_interval) > 0:
                if time_range:
                    flow_average = mean(flows_by_interval)
                else:
                    flow_average = flows_by_interval[-1]
            else:
                flow_average = 0
            data_flow_averages.append({"interval": interval, "average": flow_average})

        return data_flow_averages

    def create_high_dataflows_rules(self) -> None:
        """
        Retrieves all recorded communication channels and their average flow count
        for each interval, which are then used to create Threshold rules based on
        the settings percentage.
        """
        channels = self.get_baseline_channels(
            self.settings.baseline.baseline_time_range
        )
        for ch in channels:
            ips = ch["ips"]
            base_avg = self._data_flow_info(
                ips,
                self.settings.baseline.high_asset_connections_intervals,
                self.settings.baseline.baseline_time_range,
            )
            for i, interval in enumerate(
                self.settings.baseline.high_asset_connections_intervals
            ):
                int_base_avg = base_avg[i]["average"]
                print(f"[{','.join(ips)}] [{interval}] Base avg: {int_base_avg}")

                filters = [
                    SimpleFilter(
                        field="source.ip",
                        operator=ConditionOperator.EQ,
                        value=",".join(ips),
                    ),
                    SimpleFilter(
                        field="destination.ip",
                        operator=ConditionOperator.EQ,
                        value=",".join(ips),
                    ),
                ]
                threshold = int_base_avg * (
                    1 + (self.settings.baseline.high_asset_connections_pct / 100)
                )
                conditions = ConditionList()
                conditions.alarm = [
                    Condition(
                        field="ALL",
                        function=ConditionFunction.COUNT,
                        operator=ConditionOperator.GT,
                        limit=threshold,
                        logic=ConditionLogic.ALL,
                    )
                ]

                baseline = RuleBaseline(type="high_asset_connections", args=ips)
                rule_trigger = RuleTrigger(type=RuleTriggerType.PERIODIC, value="5m")
                rule = ThresholdRule(
                    name=f"Abnormal Data Flows between {' and '.join(ips)}",
                    description="Rule created automatically by the baseline module.",
                    risk=6,
                    timeframe=interval,
                    datasources=["zeek", "windows"],
                    trigger=rule_trigger,
                    filters=filters,
                    group_by=[],
                    conditions=conditions,
                    baseline=baseline,
                    origin=RuleOrigin.SYSTEM,
                )
                rule.save()

    def delete_high_dataflows_rules(self):
        """Deletes all communication channel based Threshold rules"""
        rules = ThresholdRule.objects(baseline__type__="high_asset_connections")
        for rule in rules:
            rule.delete()

    def update_high_dataflows_rules(
        self, intervals: list, pct: int, time_range: TimeRange
    ):
        """
        Updates all communication channel based Threshold rules with new values
        """
        rules = ThresholdRule.objects(baseline__type__="high_asset_connections")
        for rule in rules:
            base_avg = self._data_flow_info(rule.baseline.args, intervals, time_range)
            for i, interval in enumerate(intervals):
                interval_base_avg = int(base_avg[i]["average"])
                threshold = interval_base_avg * (1 + (pct / 100))
                print(
                    f"[{','.join(rule.baseline.args)}] [{interval}] Update Base avg: {interval_base_avg} | New Threshold: {threshold}"
                )
                rule.conditions.alarm[0].limit = threshold
                rule.save()

    def create_baseline_event(self, events: list[BaselineSingleEvent]):
        events_data = [e.get_raw_event() for e in events]
        self.es.bulk_insert(index="baseline", docs=events_data)

    def get_base_analytic_data(
        self,
        analytic: BaselineAnalytic,
        latest: bool = True,
        asset: Optional[Asset] = None,
        assets: list[Asset] = [],
    ):
        r = []
        self.settings.reload()
        time_filter = (
            {"rel_range": analytic.timeframe}
            if latest
            else {"time_range": self.settings.baseline.baseline_time_range}
        )

        if analytic.category is AnalyticType.GENERAL:
            return self.es.search_by_fields2(
                fields=analytic.fields,
                filters=analytic.filters,
                index=analytic.get_datasources(),
                **time_filter,
            )

        if analytic.category is AnalyticType.ASSET:
            if asset:
                assets = [asset]

            if not len(assets) > 0:
                return r

            for a in assets:
                asset_filter = SimpleFilter(
                    field="related.ip",
                    operator=ConditionOperator.EQ,
                    value=",".join(a.ip),
                )
                asset_search = self.es.search_by_fields2(
                    fields=analytic.fields,
                    filters=analytic.filters + [asset_filter],
                    index=analytic.get_datasources(),
                    **time_filter,
                )
                if asset:
                    r = asset_search
                else:
                    r.extend([f"{a.name}|{e}" for e in asset_search])

        return r
