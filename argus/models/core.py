from __future__ import annotations
from flask_security.core import UserMixin, RoleMixin
from enum import EnumMeta, Enum
from datetime import datetime, timedelta, timezone
from ipaddress import IPv4Network
from mongoengine import (
    Document,
    EmbeddedDocument,
    StringField,
    IntField,
    BooleanField,
    DateTimeField,
    ListField,
    ReferenceField,
    EmbeddedDocumentField,
    queryset_manager,
)
from mongoengine.errors import ValidationError


class TDocument(Document):
    created_at = DateTimeField(required=True, default=datetime.utcnow)
    updated_at = DateTimeField(required=True, default=datetime.utcnow)
    meta = {"abstract": True}

    def update(self, **kwargs):
        current_time = datetime.now(timezone.utc)
        return super().update(updated_at=current_time, **kwargs)


class MetaEnum(EnumMeta):
    def __contains__(cls, value: object) -> bool:
        try:
            cls(value)
        except:
            return False
        return True


class Roles(Enum):
    ADMINISTRATOR = "administrator"
    ANALYST = "analyst"

    def __get__(self, obj, objtype):
        return self.value


class Role(Document, RoleMixin):
    name = StringField(max_length=64, unique=True)
    description = StringField(max_length=255)
    permissions = ListField(required=False)


class User(Document, UserMixin):
    username = StringField(max_length=255, unique=True)
    email = StringField(max_length=255, unique=True)
    password = StringField(max_length=255)
    active = BooleanField(default=True)
    fs_uniquifier = StringField(max_length=64, unique=True)
    confirmed_at = DateTimeField()
    roles = ListField(ReferenceField(Role), default=[])


class TimeRange(EmbeddedDocument):
    start = DateTimeField(
        default=datetime.utcnow() - timedelta(weeks=54), required=True
    )
    end = DateTimeField(default=datetime.utcnow, required=True)


class BaselineSettings(EmbeddedDocument):
    baseline_time_range = EmbeddedDocumentField(
        TimeRange, default=TimeRange, required=True
    )
    new_asset = BooleanField(default=False, required=True)
    new_asset_connections = BooleanField(default=False, required=True)
    new_asset_protocols = BooleanField(default=False, required=True)
    new_asset_protocols_ports = BooleanField(default=False, required=True)
    new_asset_modbus_func = BooleanField(default=False, required=True)
    high_asset_connections = BooleanField(default=False, required=True)
    high_asset_connections_pct = IntField(default=30, required=True)
    high_asset_connections_intervals = ListField(
        StringField(), default=["1d"], required=True
    )


class AssetMonitoringSetting(EmbeddedDocument):
    subnets = ListField(StringField(required=True))

    def validate(self, clean=True):
        super().validate(clean)
        try:
            for sub in self.subnets:
                network = IPv4Network(sub)
                if not network.is_private:
                    raise ValidationError("CIDR is not private")
        except ValueError:          
            raise ValidationError("Malformed CIDR")
        except Exception:
            raise ValidationError("Other CIDR problem")


class Setting(Document):
    baseline = EmbeddedDocumentField(
        BaselineSettings, default=BaselineSettings, required=True
    )
    monitoring = EmbeddedDocumentField(
        AssetMonitoringSetting, default=AssetMonitoringSetting, required=True
    )
    meta = {"allow_inheritance": True}


class Datasource(TDocument):
    name = StringField(required=True, unique=True, min_length=1, max_length=64)
    indices = ListField(
        StringField(required=True, min_length=1, max_length=64), required=True
    )
    module = StringField(max_length=64)
    lock = BooleanField(default=False, required=True)

    def get_indices(self) -> str:
        return ",".join(self.indices)

    def validate(self, clean=True):
        super().validate(clean)
        for indice in self.indices:
            # Verify if selected indices are not locked
            if any(d.lock for d in Datasource.by_indice(indice).filter(pk__ne=self.pk)):
                raise ValidationError(
                    f"The {indice} indice is already locked", field_name="indices"
                )
            # Verify when locking is requested if the indice is also being used
            if self.lock and Datasource.by_indice(indice).filter(pk__ne=self.pk):
                raise ValidationError(
                    f"The {indice} indice can't be locked as it is already in use"
                )
            # Verify if module is already used in the selected indices
            if Datasource.objects(
                module=self.module, indices=indice, pk__ne=self.pk
            ).count():
                raise ValidationError(
                    f"The {self.module} module is already in use in the {indice} indice"
                )

    @classmethod
    def validate_datasources(cls, sources: list[str]) -> list[str]:
        if "ALL" in sources:
            return ["ALL"]
        valid_ds = [ds for ds in sources if Datasource.by_name(name=ds)]
        return valid_ds

    @classmethod
    def get_datasources(cls, sources: list[str]) -> list[Datasource]:
        result = []
        if "ALL" in sources:
            return Datasource.objects.all()
        for source in sources:
            ds = Datasource.by_name(name=source)
            if ds:
                result.append(ds)
        return result

    @classmethod
    def get_datasources_indices(cls, sources: list[str]) -> list[str]:
        result = set()
        datasources = cls.get_datasources(sources)
        for ds in datasources:
            result.update([ds.get_indices()])
        return list(result)

    @classmethod
    def get_all_indices(cls) -> list[str]:
        datasources = Datasource.objects.all()
        indices = [val for d in datasources for val in d.indices]
        return list(set(indices))

    @queryset_manager
    def by_name(cls, queryset, name):
        return queryset.filter(name=name).first()

    @queryset_manager
    def by_indice(cls, queryset, indice):
        return queryset.filter(indices=indice)

    @queryset_manager
    def by_module(cls, queryset, module):
        return queryset.filter(module=module)

    @queryset_manager
    def locked(cls, queryset):
        return queryset.filter(lock=True)
