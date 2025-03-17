from __future__ import annotations
from enum import Enum
from typing import Optional
from datetime import datetime
from dataclasses import dataclass
from mongoengine import *

from .core import TDocument, MetaEnum, Datasource
from .rule import Filter
from .asset import Asset


class AnalyticType(Enum, metaclass=MetaEnum):
    GENERAL = "general"
    ASSET = "asset"


class AnalyticOrigin(Enum, metaclass=MetaEnum):
    NATIVE = "native"
    USER = "user"


class BaselineAnalytic(TDocument):
    code = StringField(max_length=128, required=True, unique=True)
    name = StringField(max_length=128, required=True, unique=True)
    description = StringField(max_length=1024, required=True)
    category = EnumField(AnalyticType, default=AnalyticType.GENERAL, required=True)
    datasources = ListField(StringField(max_length=128, required=True), required=True)
    timeframe = StringField(max_length=6, required=True)
    filters = EmbeddedDocumentListField(Filter)
    fields = ListField(StringField(max_length=128, required=True), required=True)
    # asset_control = ListField(ReferenceField(Asset, required=True, unique=True))
    asset_control = ListField(StringField(max_length=128, required=True))
    origin = EnumField(AnalyticOrigin, default=AnalyticOrigin.USER, required=True)
    active = BooleanField(default=True, required=True)
    imported = BooleanField(default=False)
    issue_alert = BooleanField(default=True, required=True)

    @queryset_manager
    def get_all(cls, queryset):
        return queryset.filter(imported__ne=False)

    @queryset_manager
    def by_code(cls, queryset, code):
        return queryset.filter(code=code).first()

    @queryset_manager
    def available_for_import(cls, queryset):
        return queryset.filter(origin=AnalyticOrigin.NATIVE, imported=False)

    @classmethod
    def from_dict(cls, data: dict) -> Optional[BaselineAnalytic]:
        try:
            filters = []
            filters_data = data.get("filters")
            if filters_data and isinstance(filters_data, dict):
                filters = Filter.from_list(list(filters_data.values()))

            analytic = BaselineAnalytic(
                code=data.get("code"),
                name=data.get("title"),
                description=data.get("description"),
                category=AnalyticType(data.get("category")),
                datasources=data.get("datasources", []),
                filters=filters,
                fields=data.get("fields"),
                timeframe=data.get("timeframe", "10m"),
                origin=AnalyticOrigin.NATIVE,
                issue_alert=data.get("issue_alert", True),
            )
            analytic.validate()
            return analytic
        except:
            return None

    def do_import(self):
        if self.origin is not AnalyticOrigin.NATIVE:
            return
        self.update(active=True, imported=True)

    def get_datasources(self):
        if not isinstance(self.datasources, list):
            return ""
        indices = Datasource.get_datasources_indices(self.datasources)
        return indices

    def get_sleep_time(self) -> int:
        lookup = {"s": 1, "m": 60, "h": 3600, "d": 86400, "M": 60}
        value, period = self.timeframe[:-1], self.timeframe[-1:]

        if not (value.isnumeric() or period.isalpha()):
            # In case of a invalid timeframe, return default 5min
            return 60 * 5

        return int(value) * lookup[period]

    def is_asset_active(self, asset: Asset) -> bool:
        for e in self.asset_control:
            if e != str(asset.uuid):
                continue
            return True
        return False


@dataclass
class BaselineSingleEvent:
    category: str
    fields: list[str]
    deviation: dict
    ips: list[str]
    timestamp: datetime

    @classmethod
    def get_events(
        cls,
        category: str,
        fields: list[str],
        deviations: list,
        asset: Optional[Asset] = None,
    ) -> list[BaselineSingleEvent]:
        events = []
        for outlier in deviations:
            ips = set()
            field_list = set(fields)
            deviation = {}

            for key, value in zip(fields, outlier.split("|")):
                deviation[key] = value
                # insert IP related fields in the generic "related.ip" attr
                if key in ["source.ip", "destination.ip", "host.ip"]:
                    ips.add(value)

            # If asset is supplied attach asset ip information
            if asset:
                field_list.add("related.ip")
                ips.update(asset.ip)

            e = BaselineSingleEvent(
                category=category,
                fields=list(field_list),
                deviation=deviation,
                ips=list(ips),
                timestamp=datetime.utcnow(),
            )
            events.append(e)
        return events

    def get_raw_event(self) -> dict:
        event = {
            "@timestamp": datetime.utcnow().isoformat(),
            "event.category": "baseline",
            "baseline.category": self.category,
            "baseline.fields": self.fields,
            "related.ip": self.ips,
        }
        event.update(self.deviation)
        return event
