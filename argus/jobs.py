from flask import current_app as app
import ipaddress

from extensions import scheduler
from models.core import Datasource
from models.asset import Asset, AssetOS, OSType
from models.alert import AlertType, BaselineAlert
from utils.filter import filter_ips_by_subnets
from utils.extractor import get_all_ipv4_mac


@scheduler.task("interval", seconds=60 * 10)
def asset_discovery() -> None:
    """
    Searches for new internal network devices and adds them
    as an asset.
    Only assets within white-listed network subnets are added.
    """
    with scheduler.app.app_context():
        print("[*] Running asset discovery...")
        app.settings.reload()

        assets = Asset.objects.all()
        used_ips = [e for asset in assets for e in asset.ip]

        subnets = app.settings.monitoring.subnets
        indices = Datasource.get_all_indices()

        # Search first for managed assets with the "host" attribute in all indices
        # replace with 'host.id'
        ids = app.elastic.search_by_fields2(["host.hostname"], index=indices)

        for i in ids:
            r = app.elastic.search(index=indices, query={"match": {"host.hostname": i}})
            info = r["hits"]["hits"][0]["_source"]["host"]

            ips, macs = get_all_ipv4_mac(ips=info["ip"], macs=info["mac"])
            ips, macs = filter_ips_by_subnets(ips=ips, macs=macs, subnets=subnets)

            if not len(ips) > 0:
                continue

            if len([ip for ip in ips if ip in used_ips]) > 0:
                continue

            asset_os = AssetOS(
                type=OSType(info["os"]["type"]),
                name=info["os"]["name"],
                version=info["os"]["version"],
            )
            asset = Asset(
                managed=True, name=info["hostname"], os=asset_os, ip=ips, mac=macs
            )
            asset.update_vendor()
            asset.save()
            used_ips.extend(asset.ip)

            if not app.settings.baseline.new_asset:
                continue

            asset.update(validated=False)
            alert_msg = f"New Asset discovered at: {', '.join(asset.ip)}"
            alert = BaselineAlert(
                type=AlertType.ALERT, custom_msg=alert_msg, related_ips=asset.ip
            )
            alert.save()

        # agentless hosts - source and destination IP and MAC attributes
        fields = [("source.ip", "source.mac"), ("server.ip", "server.mac")]
        for field in fields:
            result = app.elastic.search_by_fields([field[0], field[1]], index=indices)

            if not result:
                continue

            for doc in result["aggregations"]["values"]["buckets"]:
                ip = ipaddress.ip_address(doc["key"][0])
                if not isinstance(ip, ipaddress.IPv4Address):
                    continue

                if not any(sub for sub in subnets if ip in ipaddress.IPv4Network(sub)):
                    continue

                if not doc["key"][0] in used_ips:
                    at = Asset(ip=[doc["key"][0]], mac=[doc["key"][1]])
                    at.update_vendor()
                    at.save()
                    used_ips.extend(at.ip)

                    if not app.settings.baseline.new_asset:
                        continue

                    at.update(validated=False)

                    alert_msg = f"New Asset discovered at: {', '.join(at.ip)}"
                    alert = BaselineAlert(
                        type=AlertType.ALERT, custom_msg=alert_msg, related_ips=at.ip
                    )
                    alert.save()


@scheduler.task("interval", seconds=60 * 10)
def baseline_communication_channels() -> None:
    """
    Baselines all network communication channels in order to detect new
    asset interactions.
    Execution depends on the "new_asset_connections" setting
    """
    with scheduler.app.app_context():
        app.settings.reload()
        if not app.settings.baseline.new_asset_connections:
            return

        baseline_channels = app.baseline.get_baseline_channels(
            app.settings.baseline.baseline_time_range
        )
        latest_channels = app.baseline.get_baseline_channels(None)

        for channel in latest_channels:
            if not next(
                filter(
                    lambda c: set(c["ips"]) == set(channel["ips"]), baseline_channels
                ),
                None,
            ):
                alert_msg = (
                    f"New Asset interaction between: {', '.join(channel['ips'])}"
                )
                alert = BaselineAlert(
                    type=AlertType.ALERT,
                    custom_msg=alert_msg,
                    related_ips=channel["ips"],
                )
                alert.save()
