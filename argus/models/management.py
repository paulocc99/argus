from __future__ import annotations
from mongoengine import *
import uuid

from .core import TDocument


class SigmaRepositoryMapping(EmbeddedDocument):
    datasources = ListField(StringField(max_length=64), required=True)
    path = StringField(required=True, max_length=128)
    # rules = EmbeddedDocumentListField(SigmaRuleMetadata)


class SigmaRepository(TDocument):
    uuid = UUIDField(default=uuid.uuid4, binary=False, required=True)
    name = StringField(required=True, max_length=64)
    repository = StringField(required=True, unique=True, max_length=64)
    mappings = EmbeddedDocumentListField(SigmaRepositoryMapping)
    processed = BooleanField(default=False, required=True)

    @queryset_manager
    def by_uuid(cls, queryset, uuid):
        return queryset.filter(uuid=uuid).first()


class SigmaRuleMetadata(TDocument):
    uuid = StringField(required=True)
    original_name = StringField(required=True)
    description = StringField(required=True)
    date = DateField(required=True, binary=False)
    name = StringField(required=True)
    author = StringField()
    datasources = ListField(StringField(required=True))
    severity = StringField(required=True)
    tactics = ListField(StringField(required=True))
    techniques = ListField(StringField(required=True))
    file = FileField(required=True)
    repository = ReferenceField(SigmaRepository)

    @queryset_manager
    def by_uuid(cls, queryset, uuid):
        return queryset.filter(uuid=uuid).first()

    @queryset_manager
    def by_repository(cls, queryset, repository):
        return queryset.filter(repository=repository).first()
