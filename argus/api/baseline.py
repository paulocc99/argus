from mongoengine import ValidationError
from mongoengine.errors import FieldDoesNotExist, InvalidQueryError, NotUniqueError
from flask import request, jsonify
from flask import current_app as app
from http import HTTPStatus
import math

from api import response
from api.routes import api
from constants import MAX_PER_PAGE
from models.core import BaselineSettings, Datasource
from models.asset import Asset
from models.alert import BaselineAlert
from models.baseline import AnalyticOrigin, BaselineAnalytic, AnalyticType
from utils import to_dict


@api.route("/baseline")
def get_baseline_data():
    """
    Returns summary baseline data according to the selected timeframe, including:
    settings - current baseline settings
    flows - iteractions between asset ips and their count
    assets - asset information data, includes the used network protocols
    """
    app.settings.reload()
    settings = app.settings.baseline
    data_flows = app.baseline.get_baseline_channels(settings.baseline_time_range)

    asset_info = []
    net_prt_analytic = BaselineAnalytic.objects(code="network.protocol").first()
    net_prt_port_analytic = BaselineAnalytic.objects(
        code="network.protocol.ports"
    ).first()

    assets = Asset.objects.all()
    for asset in assets:
        protocols = []
        if settings.new_asset_protocols_ports:
            data = app.baseline.get_base_analytic_data(
                net_prt_port_analytic, latest=False, asset=asset
            )
            protocols = dict[str, list]()

            for p in data:
                values = p.split("|")
                if values[0] in protocols.keys():
                    protocols[values[0]].append(values[1])
                else:
                    protocols[values[0]] = [values[1]]

        elif settings.new_asset_protocols:
            protocols = app.baseline.get_base_analytic_data(
                net_prt_analytic, latest=False, asset=asset
            )
            protocols = list({p for p in protocols})

        asset_info.append(
            {
                "name": asset.name,
                "ip": asset.ip,
                "mac": asset.mac,
                "validated": asset.validated,
                "active": net_prt_analytic.is_asset_active(asset),
                "protocols": protocols,
            }
        )

    return jsonify(
        {"settings": to_dict(settings), "flows": data_flows, "assets": asset_info}
    )


@api.route("/baseline", methods=["POST"])
def baseline_update():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST
    data = request.get_json()

    try:
        new_settings = BaselineSettings(**data)
    except FieldDoesNotExist:
        return response("Invalid parameters"), HTTPStatus.BAD_REQUEST

    high_asset_ch = (
        new_settings.high_asset_connections
        != app.settings.baseline.high_asset_connections
    )
    high_asset_pct_ch = (
        new_settings.high_asset_connections_pct
        != app.settings.baseline.high_asset_connections_pct
    )

    # create/delete rules
    if high_asset_ch:
        if new_settings.high_asset_connections:
            app.baseline.create_high_dataflows_rules()
        else:
            app.baseline.delete_high_dataflows_rules()
    # update rules thresholds
    elif high_asset_pct_ch:
        app.baseline.update_high_dataflows_rules(
            intervals=new_settings.high_asset_connections_intervals,
            pct=new_settings.high_asset_connections_pct,
            time_range=app.settings.baseline.baseline_time_range,
        )

    try:
        app.settings.update(baseline=new_settings)
    except InvalidQueryError:
        return response("Invalid parameters"), 403

    return response("Baseline settings updated.")


@api.route("/baseline/daterange", methods=["POST"])
def baseline_daterange_update():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST
    data = request.get_json()

    start = data.get("from", None)
    end = data.get("to", None)

    if not (start or end):
        return response("Invalid date range"), HTTPStatus.BAD_REQUEST

    baseline_settings = BaselineSettings.objects(name="baseline").first()
    baseline_settings.baseline_time_range.start = start
    baseline_settings.baseline_time_range.end = end
    baseline_settings.update()

    return response("Baseline date range updated.")


@api.route("/baseline/alerts")
def get_baseline_alerts():
    page = request.args.get("page")

    alerts = BaselineAlert.objects.all()
    assets = Asset.objects.all()
    result = []

    for e in alerts:
        alert = to_dict(e)
        alert["assets"] = [
            a.name for a in assets if any(ip for ip in a.ip if ip in e.related_ips)
        ]
        result.append(alert)

    return jsonify({"alerts": result})


## Analytics
@api.route("/baseline/analytics")
def get_analytics():
    page = request.args.get("page")
    analytics = BaselineAnalytic.get_all()

    return jsonify({"analytics": to_dict(analytics)})


@api.route("/baseline/analytics", methods=["POST"])
def create_analytic():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST
    data = request.get_json()

    datasources = Datasource.validate_datasources(data.get("datasources"))
    try:
        analytic = BaselineAnalytic(
            code=data.get("code"),
            name=data.get("name"),
            description=data.get("description"),
            category=data.get("category"),
            datasources=datasources,
            timeframe=data.get("timeframe"),
            filters=data.get("filters"),
            fields=data.get("fields"),
            asset_control=data.get("asset_control"),
            issue_alert=data.get("issue_alert"),
        )
        if analytic.category is AnalyticType.ASSET:
            if data.get("asset_control") and isinstance(
                data.get("asset_control"), list
            ):
                active_assets = Asset.get_by_ids(data.get("asset_control"))
                analytic.asset_control = active_assets
        analytic.validate()
        analytic.save()
    except FieldDoesNotExist:
        return response("Invalid parameters"), HTTPStatus.BAD_REQUEST
    except NotUniqueError:
        return response("This analytic already exists"), HTTPStatus.BAD_REQUEST
    except Exception:
        return response("An error occured"), HTTPStatus.BAD_REQUEST

    return response("Analytic created.")


@api.route("/baseline/analytics/<code>", methods=["PUT"])
def update_analytic(code):
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    analytic = BaselineAnalytic.by_code(code=code)
    if not analytic:
        return response("Analytic not found."), HTTPStatus.NOT_FOUND

    datasources = Datasource.validate_datasources(data.get("datasources", []))

    try:
        analytic.update(
            name=data.get("name"),
            description=data.get("description"),
            category=data.get("category"),
            datasources=datasources,
            timeframe=data.get("timeframe"),
            filters=data.get("filters"),
            fields=data.get("fields"),
            issue_alert=data.get("issue_alert"),
        )

        if analytic.category is AnalyticType.ASSET:
            active_assets = []
            if data.get("asset_control") and isinstance(
                data.get("asset_control"), list
            ):
                assets = Asset.get_by_ids(data.get("asset_control"))
                active_assets = [str(a.uuid) for a in assets]
                analytic.modify(asset_control=active_assets)

    except (InvalidQueryError, ValidationError):
        return response("Invalid parameters"), HTTPStatus.BAD_REQUEST
    except Exception:
        return response("An error occured"), HTTPStatus.BAD_REQUEST

    return response("Analytic updated.")


@api.route("/baseline/analytics/<code>/status", methods=["PUT"])
def update_analytic_status(code):
    analytic = BaselineAnalytic.by_code(code=code)
    if not analytic:
        return response("Analytic not found."), HTTPStatus.NOT_FOUND

    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    active_status = data.get("active", None)

    if not isinstance(active_status, bool):
        return response("Invalid status parameter type."), HTTPStatus.BAD_REQUEST

    try:
        analytic.update(active=active_status)
    except:
        return response("Error on state update"), HTTPStatus.BAD_REQUEST

    if active_status:
        app.scheduler.load_analytic(analytic)
    else:
        app.scheduler.remove_job_by_id(analytic.code)

    return response("Analytic status updated.")


@api.route("/baseline/analytics/<code>", methods=["DELETE"])
def delete_analytic(code):
    analytic = BaselineAnalytic.by_code(code)
    if not analytic:
        return response("Analytic not found."), HTTPStatus.NOT_FOUND

    try:
        if analytic.origin is AnalyticOrigin.NATIVE:
            analytic.update(imported=False, active=False)
        else:
            analytic.delete()
    except:
        return response("Error on deletion"), HTTPStatus.BAD_REQUEST

    return response("Analytic deleted.")


@api.route("/baseline/analytics/profile", methods=["POST"])
def profile_analytic():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST
    data = request.get_json()

    try:
        analytic = BaselineAnalytic(**data)
    except FieldDoesNotExist:
        return response("Invalid parameters"), HTTPStatus.BAD_REQUEST

    assets = []
    if analytic.category is AnalyticType.ASSET:
        assets = Asset.objects.all()

    base_data = app.baseline.get_base_analytic_data(
        analytic, latest=False, assets=assets
    )
    latest_data = []
    latest_data = app.baseline.get_base_analytic_data(
        analytic, latest=True, assets=assets
    )
    deviation_data = [e for e in latest_data if e not in base_data]
    base = [e.split("|") for e in base_data]
    latest = [e.split("|") for e in latest_data]
    deviations = [e.split("|") for e in deviation_data]

    return jsonify({"base": base, "latest": latest, "deviations": deviations})


@api.route("/baseline/analytics/<code>/run", methods=["POST"])
def run_analytic(code):
    analytic = BaselineAnalytic.by_code(code)
    if not analytic:
        return response("Analytic not found."), HTTPStatus.NOT_FOUND

    app.scheduler.handle_analytic_task(analytic, force=True)

    return response("Analytic executed.")


############## Local Analytics ##############
@api.route("/baseline/analytics/native")
def get_native_analytics():
    page = request.args.get("page", type=int, default=None)

    analytics = BaselineAnalytic.available_for_import()
    if page:
        analytics_count = analytics.count()
        pages = math.ceil(analytics_count / MAX_PER_PAGE)
        alerts = analytics.skip((page - 1) * MAX_PER_PAGE)
        alerts = alerts.limit(MAX_PER_PAGE)

        return jsonify(
            {"analytics": to_dict(analytics), "size": analytics.count(), "pages": pages}
        )
    return to_dict(analytics)


@api.route("/baseline/analytics/import", methods=["POST"])
def import_native_analytics():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    codes = data.get("codes")
    if not (codes and isinstance(codes, list)):
        return response("No code analytics were provided."), HTTPStatus.NOT_FOUND

    codes = list(set(codes))
    if codes == ["ALL"]:
        analytics = BaselineAnalytic.available_for_import()
        for analytic in analytics:
            try:
                analytic.validate()
                analytic.do_import()
                app.scheduler.load_analytic(analytic)
            except:
                pass
        return response("Imported all analytics.")

    for code in codes:
        try:
            analytic = BaselineAnalytic.by_code(code)
            analytic.validate()
            analytic.do_import()
            app.scheduler.load_analytic(analytic)
            print(f"Imported native baseline analytic: {analytic.name}")
        except:
            print("Error on native analytic import.")

    return response("Import completed.")
