from sigma.backends.elasticsearch import EqlBackend
from sigma.pipelines.elasticsearch.zeek import ecs_zeek_beats
from sigma.pipelines.elasticsearch.windows import ecs_windows
from sigma.rule import SigmaRule
from benedict import benedict
from collections import Counter
import ipaddress
import yaml

from utils.time import gen_day_from_date


def extract_ips_from_logs(logs: list[dict]) -> list[str]:
    ip_attrs = ["source.ip", "destination.ip", "host.ip"]
    ips = []

    for log in logs:
        e = benedict(log)
        r_ips = [e.get(attr) for attr in ip_attrs if e.get(attr)]
        for r_ip in r_ips:
            if (
                isinstance(r_ip, str)
                and not r_ip in ips
                and isinstance(ipaddress.ip_address(r_ip), ipaddress.IPv4Address)
            ):
                ips.append(r_ip)
            if isinstance(r_ip, list):
                ips = list(
                    set(
                        [
                            i
                            for i in r_ip
                            if i not in ips
                            and isinstance(
                                ipaddress.ip_address(i), ipaddress.IPv4Address
                            )
                        ]
                        + ips
                    )
                )

    return ips


def get_ipv4_from_list(ips):
    for ip in ips:
        if not isinstance(ipaddress.ip_address(ip), ipaddress.IPv4Address):
            continue
        return ip


def get_all_ipv4_mac2(ips: list[str], macs: list[str]):
    r_ips = []
    r_macs = []

    for src_ip, mac in zip(ips, macs):
        ip = ipaddress.ip_address(src_ip)
        if not isinstance(ip, ipaddress.IPv4Address):
            continue
        if not ip.is_private:
            continue
        r_ips.append(str(ip))
        r_macs.append(mac.replace("-", ":"))

    return r_ips, r_macs


def get_all_ipv4_mac(ips: list[str], macs: list[str]):
    r_ips = []
    r_private_ips = []
    r_macs = []

    # remove ipv6 addresses
    for ip in ips:
        i = ipaddress.ip_address(ip)
        if not isinstance(i, ipaddress.IPv4Address):
            continue
        r_ips.append(i)

    for index, ip in enumerate(r_ips):
        if not ip.is_private:
            continue
        r_private_ips.append(str(ip))
        r_macs.append(macs[index].replace("-", ":"))

    return r_private_ips, r_macs


def get_event_day_count(events: list):
    day_occurrence = [e.split("T")[0] for e in events]
    count_by_day = Counter(day_occurrence)

    r = gen_day_from_date(day_occurrence[0])
    for k, v in count_by_day.items():
        for d in r:
            if d["date"] == k:
                d["value"] = v

    return r


def extract_sigma_rule_data(data):
    """
    Converts a Sigma rule to the expected EQL rule format
    """
    mappings = {
        "id": "id",
        "date": "date",
        "name": "title",
        "author": "author",
        "description": "description",
        "datasources": "logsource:product",
        "severity": "level",
    }
    r = {"type": "eql"}
    y_data = yaml.safe_load(data)
    y_data = benedict(y_data, keypath_separator=":")

    # Field conversion
    for k, v in mappings.items():
        if k == "datasources":
            r[k] = []
            r[k].append(y_data[v])
        else:
            r[k] = y_data[v]

    # Parse ATT&CK Tags
    r["attack"] = {"tactics": [], "techniques": []}
    for tag in y_data["tags"]:
        sp_tag = tag.split(".")
        if sp_tag[0] != "attack":
            continue

        if re.search("^([a-z](_[a-z])?)+$", sp_tag[1]):
            r["attack"]["tactics"].append(sp_tag[1].replace("_", " "))
        elif len(sp_tag) == 3:
            r["attack"]["techniques"].append(".".join([sp_tag[1], sp_tag[2]]))
        elif re.search("^t([0-9])+", sp_tag[1]):
            r["attack"]["techniques"].append(sp_tag[1])

    return r


def convert_sigma_to_eql_query(rule_data: str, datasource: str) -> str:
    rule = SigmaRule.from_yaml(rule_data)
    backend = EqlBackend(ecs_windows() + ecs_zeek_beats())

    query = backend.convert_rule(rule)
    return query[0]
