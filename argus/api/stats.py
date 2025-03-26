from flask import jsonify, current_app as app
from datetime import datetime, timedelta

from api.routes import api
from builder import get_attr_count_agg, get_date_count_agg
from models.core import Datasource
from models.rule import Rule
from models.alert import Alert, BaseAlert
from models.asset import Asset


@api.route("/stats")
def get_global_statistics():
    all_indices = Datasource.get_all_indices()
    events_count = app.elastic.indice_count(index=all_indices)
    rules_count = Rule.objects.count()
    alerts_count = Alert.objects.count()
    assets_count = Asset.objects.count()

    alerts_last_30_days = {}
    events_last_30_days = {}

    start = datetime.now()
    for day in range(0, 30):
        d = start - timedelta(days=day)
        alerts_last_30_days[d.strftime("%Y-%m-%d")] = 0
        events_last_30_days[d.strftime("%Y-%m-%d")] = 0

    alerts_by_day = Alert.objects().aggregate(get_date_count_agg("$created_at"))
    for day in alerts_by_day:
        day_date = day["_id"]["date"]
        if day_date in alerts_last_30_days.keys():
            alerts_last_30_days[day_date] = day["count"]

    # ELASTIC COUNT BY DAY
    events_by_day = app.elastic.indice_count_by_day(index=all_indices)
    for day in events_by_day:
        day_date = day["key_as_string"].split("T")[0]
        if day_date in events_last_30_days.keys():
            events_last_30_days[day_date] = day["doc_count"]

    stats = {
        "counts": {
            "events": events_count,
            "rules": rules_count,
            "alerts": alerts_count,
            "hosts": assets_count,
        },
        "ocurrence_by_month": {
            "alerts": alerts_last_30_days,
            "events": events_last_30_days,
        },
    }
    return jsonify(stats)


@api.route("/stats/alerts")
def get_alert_statistics():
    """
    Returns the alert/alarm count by grouping by the rule tactic or technique
    """
    ta_path = "$rule.attack.tactics.name"
    te_path = "$rule.attack.techniques.name"
    alarm_count_by_tactic = list(
        Alert.objects().aggregate(get_attr_count_agg(ta_path, "alarm"))
    )
    alert_count_by_tactic = list(
        Alert.objects().aggregate(get_attr_count_agg(ta_path, "alert"))
    )
    alarm_count_by_technique = list(
        Alert.objects().aggregate(get_attr_count_agg(te_path, "alarm"))
    )
    alert_count_by_technique = list(
        Alert.objects().aggregate(get_attr_count_agg(te_path, "alert"))
    )

    for a in [x for n in (alert_count_by_tactic, alarm_count_by_tactic) for x in n]:
        a["tactic"] = a.pop("_id")
        if not a["tactic"]:
            a["tactic"] = "Unknown"
    for a in [
        x for n in (alarm_count_by_technique, alert_count_by_technique) for x in n
    ]:
        a["technique"] = a.pop("_id")
        if not a["technique"]:
            a["technique"] = "Unknown"

    # unknown = [a for a in alert_count_by_technique if a.get('technique') == 'Unknown']
    # sum_u = sum(a['count'] for a in unknown)
    # t1 = [a for a in alert_count_by_technique if a.get('technique') != 'Unknown']
    # t1.append({"technique": "Unknown", "count": sum_u})

    # Count alerts/alarm for each available asset
    alert_count_by_asset = []
    alarm_count_by_asset = []

    assets = Asset.objects.all()
    for asset in assets:
        alerts = BaseAlert.by_asset(asset)
        alert_count = len(alerts.filter(type="alert"))
        alarm_count = len(alerts.filter(type="alarm"))

        if alert_count > 0:
            alert_count_by_asset.append({"name": asset.name, "count": alert_count})
        if alarm_count > 0:
            alarm_count_by_asset.append(
                {"name": asset.name, "count": len(alerts.filter(type="alarm"))}
            )

    return jsonify(
        {
            "tactic": {"alarm": alarm_count_by_tactic, "alert": alert_count_by_tactic},
            "technique": {
                "alarm": alarm_count_by_technique,
                "alert": alert_count_by_technique,
            },
            "asset": {"alarm": alarm_count_by_asset, "alert": alert_count_by_asset},
        }
    )
