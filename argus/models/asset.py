from __future__ import annotations
from enum import Enum
from mongoengine import (
    UUIDField,
    StringField,
    EnumField,
    BooleanField,
    ListField,
    EmbeddedDocumentField,
    EmbeddedDocument,
    queryset_manager,
)
import uuid
import ipaddress
import requests

from .core import TDocument, MetaEnum


class OSType(Enum, metaclass=MetaEnum):
    LINUX = "linux"
    WINDOWS = "windows"
    OTHER = "other"


class AssetOS(EmbeddedDocument):
    type = EnumField(OSType, required=True)
    name = StringField(max_length=64, required=True)
    version = StringField(max_length=64, required=True)


class Asset(TDocument):
    uuid = UUIDField(default=uuid.uuid4, binary=False, required=True)
    managed = BooleanField(default=False, required=True)
    name = StringField(max_length=128)
    description = StringField(max_length=128)
    ip = ListField(StringField(required=True, max_length=128))
    mac = ListField(StringField(required=True, max_length=128))
    os = EmbeddedDocumentField(AssetOS)
    vendor = StringField(max_length=128)
    hidden = BooleanField(default=False, required=True)
    network = BooleanField(default=False, required=True)
    validated = BooleanField(default=True, required=True)

    def update_vendor(self) -> None:
        first_half = self.mac[0].replace(":", "")[0:6]
        r = requests.get(
            url="https://api.maclookup.app/v2/macs/" + first_half,
            allow_redirects=False,
            timeout=3,
        )

        if r.status_code != 200:
            return

        data = r.json()
        if data.get("success") and data.get("found"):
            self.vendor = data["company"]
            print(f"[+] Updated {self.ip} asset -> Vendor: {self.vendor}")

    def in_subnet(self, subnet: str) -> bool:
        try:
            sub = ipaddress.IPv4Network(subnet)
            return any(ip for ip in self.ip if ipaddress.ip_address(ip) in sub)
        except:
            return False

    @classmethod
    def get_by_ids(cls, ids: list[str]) -> list[Asset]:
        unique_ids = set(ids)
        result = []
        for asset_id in unique_ids:
            a = Asset.by_uuid(uuid=asset_id)
            if a:
                result.append(a)
        return result

    @queryset_manager
    def by_uuid(cls, queryset, uuid: str):
        return queryset.filter(uuid=uuid).first()
