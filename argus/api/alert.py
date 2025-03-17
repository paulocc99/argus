from http import HTTPStatus
from flask import request, jsonify
import math

from api import response
from api.routes import api
from constants import MAX_PER_PAGE, RISK_LOOKUP
from models.alert import Alert, AlertStatus, BaseAlert, BaselineAlert
from models.asset import Asset
from utils import to_dict


@api.route("/alerts")
def get_alerts():
    result = []
    status = request.args.get("status")
    asset = request.args.get("asset")
    risk = request.args.get("risk")
    rule = request.args.get("rule")
    source = request.args.get("source")
    alert_type = request.args.get("type")
    is_summary = request.args.get("summary")

    page = request.args.get("page", type=int, default=None)
    if page and page < 0:
        return response("Invalid page value"), HTTPStatus.BAD_REQUEST

    if source == "rule":
        alerts = Alert.objects.exclude("logs").order_by("-created_at")
    elif source == "baseline":
        alerts = BaselineAlert.objects.all().order_by("-created_at")
    else:
        alerts = BaseAlert.objects.exclude("logs").order_by("-created_at")

    if status:
        alerts = alerts.filter(status=status)
    if asset:
        sel_asset = Asset.by_uuid(uuid=asset)
        if not sel_asset:
            return response("Invalid asset"), HTTPStatus.NOT_FOUND
        alerts = alerts.filter(related_ips__in=sel_asset.ip)
    if risk:
        alerts = alerts.filter(
            rule__risk__gte=RISK_LOOKUP[risk][0], rule__risk__lte=RISK_LOOKUP[risk][1]
        )
    if rule:
        alerts = alerts.filter(rule__uuid=rule)
    if alert_type:
        alerts = alerts.filter(type=alert_type)

    if page:
        alerts_count = alerts.count()
        pages = math.ceil(alerts_count / MAX_PER_PAGE)
        alerts = alerts.skip((page - 1) * MAX_PER_PAGE)
        alerts = alerts.limit(MAX_PER_PAGE)
    elif is_summary:
        alerts = alerts.limit(5)

    assets = Asset.objects.all()
    for alert in alerts:
        asset_names = alert.get_asset_names(assets)
        alert = to_dict(alert)
        alert["assets"] = asset_names
        result.append(alert)

    if page:
        return jsonify({"alerts": result, "size": alerts_count, "pages": pages})
    elif is_summary:
        return jsonify(result)

    return jsonify(result)


@api.route("/alerts/<uuid>")
def get_alert(uuid):
    alert = BaseAlert.by_uuid(uuid)
    if not alert:
        return response("Alert not found."), HTTPStatus.NOT_FOUND

    result = to_dict(alert)
    return jsonify(result)


@api.route("/alerts/<uuid>/events")
def get_alert_events(uuid):
    alert = Alert.by_uuid(uuid)
    if not alert:
        return response("Alert not found."), HTTPStatus.NOT_FOUND

    return jsonify(alert.logs)


@api.route("/alerts/<uuid>/state", methods=["PUT"])
def update_alert_status(uuid):
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    status = data.get("status")

    if not status in AlertStatus:
        return response("The provided status is invalid"), HTTPStatus.BAD_REQUEST

    alert = BaseAlert.by_uuid(uuid)
    if not alert:
        return response("Alert not found"), HTTPStatus.NOT_FOUND

    if alert.status == AlertStatus.RESOLVED:
        return (
            response("The current alert status can't be modified"),
            HTTPStatus.BAD_REQUEST,
        )
    elif alert.status == AlertStatus(status):
        return (
            response("The provided state is the same as the current alert"),
            HTTPStatus.BAD_REQUEST,
        )

    try:
        alert.update(status=status)
    except:
        return response("Couldn't update alert status"), HTTPStatus.BAD_REQUEST
    return response("Alert status updated.")
