from mongoengine import EmbeddedDocument, Document
from typing import Optional
import os

from .handlers import handle_custom_types
from .filter import remove_nested_attrs


def get_config_path() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "..", "data")


def get_analytics_path() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "..", "data", "analytics")


def dict_same_attrs_class(c, data) -> bool:
    attrs = c.__annotations__
    return data.keys() == attrs.keys()


def to_dict(data) -> list[dict[str, object]] | dict[str, object]:
    exclude = ["_id", "_cls"]
    if isinstance(data, Document) or isinstance(data, EmbeddedDocument):
        data = data.to_mongo().to_dict()
        remove_nested_attrs(exclude, data)
        handle_custom_types(data)
        return data

    result = []
    for entry in data:
        value = entry.to_mongo().to_dict()
        remove_nested_attrs(exclude, value)
        handle_custom_types(value)
        result.append(value)
    return result


def parse_str_bool(data: Optional[str]) -> bool:
    if not data:
        return False
    return bool(data) if data.lower() != "false" else False
