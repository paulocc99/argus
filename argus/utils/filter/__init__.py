from ipaddress import IPv4Address, IPv4Network
from benedict import benedict


def filter_list_by_attr(data: list, filters: dict):
    result = []
    for log in data:
        e = benedict(log["_source"])
        if all([e.get(attr) == value for attr, value in filters.items()]):
            result.append(e)
    return result


def filter_ips_by_subnets(ips: list[str], macs: list[str], subnets: list[IPv4Network]):
    result = [[], []]
    for sub in subnets:
        for ip, mac in zip(ips, macs):
            if IPv4Address(ip) in IPv4Network(sub):
                result[0].append(ip)
                result[1].append(mac)
    return result[0], result[1]


def clean_attrs(allowed_attrs: list[str], data: dict):
    for key in list(data.keys()):
        if key in allowed_attrs:
            continue
        data.pop(key, None)


def remove_attrs(attrs: list[str], data: dict):
    for key in attrs:
        data.pop(key, None)


def remove_nested_attrs(attrs: list[str], data: dict):
    for key in attrs:
        data.pop(key, None)
    for key, value in data.items():
        if isinstance(value, dict):
            remove_nested_attrs(attrs, value)
        if isinstance(value, list):
            for v in value:
                if not isinstance(v, dict):
                    continue
                remove_nested_attrs(attrs, v)
