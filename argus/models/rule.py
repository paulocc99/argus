from __future__ import annotations
from enum import Enum
from copy import copy
from datetime import datetime
from operator import lt, le, eq, ne, ge, gt
from mongoengine import *
import uuid

from models.core import TDocument, MetaEnum, Datasource
from models.alert import Alert, AlertType
from utils.extractor import extract_ips_from_logs
from utils.filter import filter_list_by_attr
from constants import SEARCH_LIMIT


class ConditionFunction(Enum):
    AVG = "avg"
    COUNT = "count"
    UNIQ = "unique"
    SUM = "sum"
    MIN = "min"
    MAX = "max"


class ConditionLogic(Enum):
    ALL = "AND"
    ANY = "OR"


class ConditionOperator(Enum):
    LT = "<"
    LE = "<="
    EQ = "=="
    NE = "!="
    GE = ">="
    GT = ">"


comparison_lookup = {
    ConditionOperator.LT: lt,
    ConditionOperator.LE: le,
    ConditionOperator.EQ: eq,
    ConditionOperator.NE: ne,
    ConditionOperator.GE: ge,
    ConditionOperator.GT: gt,
}


class Comparator:
    def __init__(self, conditions, ctype):
        self.type = ctype
        self.conditions = conditions
        self.result = None
        self.run()

    def run(self):
        if self.type is ConditionLogic.ALL:
            self.result = all([cond.result for cond in self.conditions])
        else:
            self.result = any([cond.result for cond in self.conditions])


class Condition(EmbeddedDocument):
    field = StringField(max_length=128, required=True)
    function = EnumField(ConditionFunction, required=True)
    limit = FloatField(required=True)
    logic = EnumField(ConditionLogic, required=True)
    operator = EnumField(ConditionOperator, required=True)
    result: bool = False

    def __str__(self):
        return (
            f"[{self.logic}] {self.function}({self.field}) {self.operator} {self.limit}"
        )

    def set_result(self, result):
        self.result = result

    def check(self, value: int):
        if comparison_lookup[self.operator](value, int(self.limit)):
            print(
                f"Condition Alert: {self.field} -> {value} {self.operator.value} {self.limit}"
            )
            self.set_result(True)
            return
        self.set_result(False)

    @classmethod
    def check_conditions(cls, cr: list[Condition]):
        current_array = []
        for index, cg in enumerate(cr):
            if len(current_array) <= 1:
                current_array.append(cg)
            if len(current_array) == 2:
                comparator = Comparator(copy(current_array), current_array[1].logic)
                current_array[0] = comparator
                del current_array[1]
        return current_array[0].result


class FilterType(Enum, metaclass=MetaEnum):
    SIMPLE = "simple"
    PAINLESS_SCRIPT = "script"


class Filter(EmbeddedDocument):
    meta = {"allow_inheritance": True}
    type = EnumField(FilterType, required=True)
    field = StringField(max_length=128)
    operator = EnumField(ConditionOperator)
    value = StringField(max_length=512, required=True)

    @classmethod
    def from_list(cls, data: list) -> list[Filter]:
        filters = []
        for f_data in data:
            f_type = f_data.get("type")

            if f_type not in FilterType:
                continue

            if FilterType(f_type) is FilterType.SIMPLE:
                f = SimpleFilter(**f_data)
            elif FilterType(f_type) is FilterType.PAINLESS_SCRIPT:
                f = PainlessFilter(**f_data)
            else:
                continue

            f.validate()
            filters.append(f)
        return filters


class SimpleFilter(Filter):
    type = EnumField(FilterType, default=FilterType.SIMPLE, required=True)
    field = StringField(max_length=128, required=True)
    operator = EnumField(ConditionOperator, required=True)
    value = StringField(max_length=512, required=True)


class PainlessFilter(Filter):
    type = EnumField(FilterType, default=FilterType.PAINLESS_SCRIPT, required=True)
    value = StringField(max_length=2048, required=True)


class ConditionList(EmbeddedDocument):
    alert = EmbeddedDocumentListField(Condition)
    alarm = EmbeddedDocumentListField(Condition)

    def get_all_conditions(self) -> list[Condition]:
        return [*self.alert, *self.alarm]

    def items(self):
        return {"alert": self.alert, "alarm": self.alarm}.items()


class ATTACKEntry(EmbeddedDocument):
    id = StringField(max_length=16, required=True)
    name = StringField(max_length=128, required=True)
    shortname = StringField(max_length=128)


class RuleATTACK(EmbeddedDocument):
    tactics = EmbeddedDocumentListField(ATTACKEntry)
    techniques = EmbeddedDocumentListField(ATTACKEntry)


class RuleIntelligence(EmbeddedDocument):
    note = StringField(max_length=128, required=True)
    action = StringField(max_length=128, required=True)


class RuleBaseline(EmbeddedDocument):
    type = StringField(max_length=128, required=True)
    args = ListField(StringField(max_length=128, required=True))


class RuleTriggerType(Enum):
    PERIODIC = "periodic"
    RULE = "rule"


class RuleTrigger(EmbeddedDocument):
    type = EnumField(RuleTriggerType, required=True)
    value = StringField(max_length=64, required=True)

    def get_sleep_time(self) -> int:
        if self.type != RuleTriggerType.PERIODIC:
            return -1

        lookup = {"s": 1, "m": 60, "h": 3600}
        value, period = self.value[:-1], self.value[-1:]

        if not (value.isnumeric() or period.isalpha()):
            return -1

        return int(value) * lookup[period]


class RuleType(Enum, metaclass=MetaEnum):
    EQL_QUERY = "eql"
    SEARCH_QUERY = "threshold"


class RuleOrigin(Enum):
    USER = "user"
    EXTERNAL = "external"
    SYSTEM = "system"


class Rule(TDocument):
    uuid = UUIDField(default=uuid.uuid4, binary=False, required=True)
    name = StringField(max_length=128, required=True)
    description = StringField(max_length=1024, required=True)
    risk = IntField(min_value=1, max_value=10, default=4, required=True)
    type = EnumField(RuleType, required=True)
    timeframe = StringField(max_length=6, required=True)
    trigger = EmbeddedDocumentField(RuleTrigger, required=True)
    datasources = ListField(
        StringField(min_length=1, max_length=128, required=True), required=True
    )
    attack = EmbeddedDocumentField(RuleATTACK)
    intelligence = EmbeddedDocumentField(RuleIntelligence)
    baseline = EmbeddedDocumentField(RuleBaseline)
    origin = EnumField(RuleOrigin, default=RuleOrigin.USER, required=True)
    last_execution = DateTimeField()
    active = BooleanField(default=True, required=True)
    meta = {"allow_inheritance": True}

    def get_datasources(self) -> list[str] | str:
        if not isinstance(self.datasources, list):
            return "*"
        datasources = Datasource.get_datasources(self.datasources)
        return [ds.get_indices() for ds in datasources]

    def get_rule_dependencies(self):
        return Rule.by_trigger_rule(str(self.uuid))

    @queryset_manager
    def periodic_rules(cls, queryset):
        return queryset.filter(trigger__type__=RuleTriggerType.PERIODIC.value)

    @queryset_manager
    def by_uuid(cls, queryset, uuid: str):
        return queryset.filter(uuid=uuid).first()

    @queryset_manager
    def by_users(cls, queryset):
        return queryset.filter(origin__ne=RuleOrigin.SYSTEM.value)

    @queryset_manager
    def by_attack_tactic(cls, queryset, tactic_id):
        return queryset.filter(attack__tactic__id=tactic_id)

    @queryset_manager
    def by_attack_technique(cls, queryset, technique_id):
        return queryset.filter(attack__techniques__id=technique_id)

    @queryset_manager
    def by_trigger_rule(cls, queryset, rule_uuid):
        return queryset.filter(trigger__value=rule_uuid)

    def to_dict(self) -> dict:
        return self.to_mongo().to_dict()


class ThresholdRule(Rule):
    type = EnumField(RuleType, default=RuleType.SEARCH_QUERY, required=True)
    group_by = ListField(StringField(max_length=128))
    filters = EmbeddedDocumentListField(Filter)
    conditions = EmbeddedDocumentField(ConditionList, required=True)

    def search(self, elastic):
        from builder import (
            build_search_query,
            set_groupby,
            set_filters,
            set_timeframe,
            set_painless_filter,
            get_base_query,
        )

        query = get_base_query()

        # Set query filters
        if len(self.filters) > 0:
            set_filters(query, [f for f in self.filters if f.type is FilterType.SIMPLE])
            set_painless_filter(
                query, [f for f in self.filters if f.type is FilterType.PAINLESS_SCRIPT]
            )

        # Set group by aggregation
        if len(self.group_by) > 0:
            set_groupby(query, self.group_by)

        # Set condition parameters
        for cond in self.conditions.get_all_conditions():
            if cond.field == "ALL":
                cond.field = "@timestamp"
            # if is_operation_valid(cond.function):
            build_search_query(query, cond)

        # Query time-frame range
        set_timeframe(query, self.timeframe)

        return elastic.search(
            index=self.get_datasources(), body=query, size=SEARCH_LIMIT
        )

    def run(self, elastic, scheduler, preview=False):
        preview_alerts = {"alert": [], "alarm": []}
        cond_res = {"alert": [], "alarm": []}
        result = self.search(elastic)

        # TODO - Simply this part, to much repetive code
        # Only differs the metric value key ->
        #   result['aggregations'][cond_key]['value']
        #   r[cond_key]['value']
        if len(self.group_by) == 0:
            for cond_type, cond_list in self.conditions.items():
                preview_result = ""
                for cond in cond_list:
                    cond_key = f"{cond.function.value}-{cond.field}"
                    metric_value = result["aggregations"][cond_key]["value"]
                    cond.check(metric_value)
                    cond_res[cond_type].append(cond)
                    if preview:
                        preview_result += f"{cond.function.value}({cond.field}) => {metric_value} {cond.operator.value} {cond.limit}"

                if len(cond_res[cond_type]) > 0 and Condition.check_conditions(
                    cond_res[cond_type]
                ):
                    if preview:
                        preview_alerts[cond_type].append(
                            {"groupby": "none", "result": preview_result}
                        )
                        break
                    log_sel = [log.get("_source") for log in result["hits"]["hits"]]
                    ips = extract_ips_from_logs(log_sel)
                    alert = Alert(
                        type=AlertType(cond_type),
                        rule=self.to_dict(),
                        logs=log_sel,
                        related_ips=ips,
                    )
                    alert.save()
        else:
            buckets = result["aggregations"]["groupby"]["buckets"]
            for r in buckets:
                for cond_type, cond_list in self.conditions.items():
                    preview_result = ""
                    for cond in cond_list:
                        cond_key = f"{cond.function.value}-{cond.field}"
                        metric_value = r[cond_key]["value"]
                        cond.check(metric_value)
                        cond_res[cond_type].append(cond)
                        if preview:
                            preview_result += f"{cond.function.value}({cond.field}) => {metric_value} {cond.operator.value} {cond.limit}"

                    if len(cond_res[cond_type]) > 0 and Condition.check_conditions(
                        cond_res[cond_type]
                    ):
                        if preview:
                            preview_alerts[cond_type].append(
                                {"groupby": r["key"], "result": preview_result}
                            )
                            break

                        f = {}
                        if len(self.group_by) == 1:
                            f[self.group_by[0]] = r["key"]
                        elif len(self.group_by) > 1:
                            for attr, value in zip(self.group_by, r["key"]):
                                f[attr] = value

                        log_sel = filter_list_by_attr(result["hits"]["hits"], f)
                        ips = extract_ips_from_logs(log_sel)
                        alert = Alert(
                            type=AlertType(cond_type),
                            rule=self.to_dict(),
                            logs=log_sel,
                            context=f,
                            related_ips=ips,
                        )
                        alert.save()

        if preview:
            return result["aggregations"], preview_alerts

        self.update(last_execution=datetime.utcnow())
        rules = self.get_rule_dependencies()
        if not rules:
            return
        for rule in rules:
            scheduler.handle_rule_task(rule)


class EQLRule(Rule):
    type = EnumField(RuleType, default=RuleType.EQL_QUERY, required=True)
    query = StringField(max_length=24576, required=True)
    alert_type = EnumField(AlertType, required=True)

    def search(self, elastic):
        time_range = {
            "range": {
                "@timestamp": {
                    "gte": (
                        f"now-{self.timeframe}" if self.timeframe != "always" else "0"
                    ),
                    "lte": "now",
                }
            }
        }
        return elastic.eql_search(
            index=self.get_datasources(),
            query=self.query,
            size=10000,
            filter=time_range,
        )

    def run(self, elastic, scheduler, preview=False, lookup=False):
        result = self.search(elastic)
        if not result:
            return None
        result_number = result["hits"]["total"]["value"]
        preview_alerts = {self.alert_type.value: []}

        if lookup:
            prev_alerts = []
            if "events" in result["hits"].keys():
                prev_alerts = [
                    e["_source"]["@timestamp"] for e in result["hits"]["events"]
                ]
            if "sequences" in result["hits"].keys():
                prev_alerts = [
                    e["events"][0]["_source"]["@timestamp"]
                    for e in result["hits"]["sequences"]
                ]
            return prev_alerts

        if result_number > 0:
            if "events" in result["hits"].keys():
                sel_log = result["hits"]["events"][0]["_source"]
            if "sequences" in result["hits"].keys():
                sel_log = result["hits"]["sequences"][0]["events"][0]["_source"]

            if preview:
                preview_alerts[self.alert_type.value].append(
                    {"result": f"{str(self.alert_type)} Triggered"}
                )
            else:
                alert = Alert(type=AlertType.ALERT, rule=self.to_dict(), logs=[sel_log])
                alert.save()

        if preview:
            return result["hits"], preview_alerts

        self.update(last_execution=datetime.utcnow())
        dependencies = self.get_rule_dependencies()
        if not dependencies:
            return
        for rule in dependencies:
            scheduler.handle_rule_task(rule)
