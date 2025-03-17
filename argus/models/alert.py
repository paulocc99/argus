from __future__ import annotations
from enum import Enum
from mongoengine import (
    UUIDField,
    EnumField,
    ListField,
    DictField,
    StringField,
    queryset_manager,
)
import uuid

from models.asset import Asset

from .core import TDocument, MetaEnum


class AlertStatus(Enum, metaclass=MetaEnum):
    OPEN = "open"
    PROCESSING = "processing"
    RESOLVED = "resolved"


class AlertType(Enum):
    ALERT = "alert"
    ALARM = "alarm"


class AlertOrigin(Enum):
    SYSTEM = "system"
    BASELINE = "baseline"


class BaseAlert(TDocument):
    uuid = UUIDField(default=uuid.uuid4, binary=False, required=True)
    type = EnumField(AlertType, required=True)
    status = EnumField(AlertStatus, default=AlertStatus.OPEN, required=True)
    origin = EnumField(AlertOrigin, default=AlertOrigin.SYSTEM, required=True)
    related_ips = ListField(StringField())
    context = DictField()
    meta = {"allow_inheritance": True, "collection": "alert"}

    @queryset_manager
    def by_uuid(cls, queryset, uuid: str):
        return queryset.filter(uuid=uuid).first()

    @queryset_manager
    def by_asset(cls, queryset, asset: Asset):
        return queryset.filter(related_ips__in=asset.ip)

    def get_asset_names(self, assets: list[Asset]) -> list[str]:
        return [
            a.name for a in assets if any(ip for ip in a.ip if ip in self.related_ips)
        ]


class Alert(BaseAlert):
    rule = DictField(required=True)
    logs = ListField(DictField(required=True))


class BaselineAlert(BaseAlert):
    analytic = DictField()
    deviation = DictField()
    custom_msg = StringField(max_length=512)
    origin = EnumField(AlertOrigin, default=AlertOrigin.BASELINE)
