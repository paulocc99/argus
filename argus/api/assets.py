from flask import request, jsonify
from flask import current_app as app
from http import HTTPStatus
from mongoengine.errors import InvalidQueryError
import math

from api import response
from api.routes import api
from constants import MAX_PER_PAGE, EVENTS_PER_PAGE
from models.core import Datasource, AssetMonitoringSetting
from models.alert import BaseAlert, AlertType
from models.asset import Asset
from utils import parse_str_bool, to_dict
from utils.filter import clean_attrs


@api.route("/assets")
def get_assets():
    result = []
    page = request.args.get("page", type=int, default=None)
    datasource = request.args.get("datasource")
    subnet = request.args.get("subnet")
    managed = request.args.get("managed")
    name_only = parse_str_bool(request.args.get("nameOnly"))

    if page and page < 0:
        return response("Invalid page value"), HTTPStatus.BAD_REQUEST

    assets = Asset.objects.all()

    if managed:
        assets = assets.filter(managed=parse_str_bool(managed))
    if page:
        assets_count = assets.count()
        pages = math.ceil(assets_count / MAX_PER_PAGE)
        assets = assets.skip((page - 1) * MAX_PER_PAGE)
        assets = assets.limit(MAX_PER_PAGE)

    for asset in assets:
        if subnet and not asset.in_subnet(subnet):
            continue

        if name_only:
            result.append(to_dict(asset))
            continue

        alert_list = []
        protocols = []
        datasources = []

        events_count = app.elastic.events_by_ips(ips=asset.ip, network=asset.network)
        alert_list = BaseAlert.by_asset(asset)

        # asset_filter = SimpleFilter(field="related.ip",
        #                             operator=ConditionOperator.EQ,
        #                             value=','.join(asset.ip))

        # transform this simple filter in a specific builder function
        # asset_query = "("
        # for index, ip in enumerate(asset.ip):
        #     asset_query += f"host.ip:{ip}"
        #     if (index + 1) < len(asset.ip):
        #         asset_query += " or "
        # asset_query += ")"

        ## PROTOCOLS RETRIEVAL
        # r = app.elastic.search_by_field(field="network.protocol", cfilter=asset_query)
        # print(r['aggregations']['values']['buckets'])

        ## DATASOURCE RETRIEVAL
        # ds = Datasource.objects.all()
        # for d in ds:
        #     count = app.elastic.indice_count(index=d.get_indices(), q=asset_query)
        #     if count > 0:
        #         datasources.append(d.name)

        #  FILTER: Skip if datasource filter doesn't correspond to asset datasources
        if datasource and not datasource in datasources:
            continue

        alarms_count = len([a for a in alert_list if a.type == AlertType.ALARM])
        alerts_count = len([a for a in alert_list if a.type == AlertType.ALERT])

        r_asset = to_dict(asset)
        r_asset["stats"] = {
            "events": events_count,
            "alarms": alarms_count,
            "alerts": alerts_count,
        }
        r_asset["protocols"] = protocols
        r_asset["datasource"] = datasources
        result.append(r_asset)

    if name_only:
        minified = []
        for asset in result:
            clean_attrs(["uuid", "name", "ip", "mac"], asset)
            minified.append(asset)
        return jsonify(minified)

    if page:
        return jsonify({"assets": result, "size": assets_count, "pages": pages})

    return jsonify(result)


@api.route("/assets/<uuid>/alerts")
def get_asset_alerts(uuid):
    page = request.args.get("page", type=int, default=None)

    if page and page < 0:
        return response("Invalid page value"), HTTPStatus.BAD_REQUEST

    asset = Asset.by_uuid(uuid)
    if not asset:
        return response("Asset not found."), HTTPStatus.NOT_FOUND

    alerts = BaseAlert.by_asset(asset)

    if page:
        alerts_count = alerts.count()
        pages = math.ceil(alerts_count / MAX_PER_PAGE)
        alerts = alerts.skip((page - 1) * MAX_PER_PAGE)
        alerts = alerts.limit(MAX_PER_PAGE)

        return jsonify(
            {"alerts": to_dict(alerts), "size": alerts_count, "pages": pages}
        )
    else:
        return jsonify(to_dict(alerts))


@api.route("/assets/<uuid>/events")
def get_asset_events(uuid):
    page = request.args.get("page", type=int, default=None)
    user_query = request.args.get("q")

    if not page:
        return response("Missing 'page' query parameter."), HTTPStatus.BAD_REQUEST
    elif page < 0:
        return response("Invalid page value"), HTTPStatus.BAD_REQUEST

    asset = Asset.by_uuid(uuid)
    if not asset:
        return response("Asset not found."), HTTPStatus.NOT_FOUND

    # Lucene query for asset ip filtering
    query = "("
    for index, ip in enumerate(asset.ip):
        query += f"(destination.ip:{ip} or source.ip:{ip}"
        if not asset.network:
            query += f" or host.ip: {ip}"
        query += ")"
        if (index + 1) < len(asset.ip):
            query += " or "
        else:
            query += ")"

    if user_query:
        query += " AND "
        query += user_query

    print(query)

    all_indices = Datasource.get_all_indices()
    events_count = app.elastic.indice_count(index=all_indices, q=query)

    result = app.elastic.search_pagination(
        index=all_indices,
        q=query,
        sort=[{"@timestamp": "desc"}],
        page=page,
        size=EVENTS_PER_PAGE,
    )
    events = [event.get("_source") for event in result["hits"]["hits"]]

    return jsonify(
        {"events": events, "pages": math.ceil(events_count / EVENTS_PER_PAGE)}
    )


@api.route("/assets/<uuid>", methods=["PUT"])
def update_asset(uuid):
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST
    data = request.get_json()

    asset = Asset.by_uuid(uuid)
    if not asset:
        return response("Asset not found."), HTTPStatus.NOT_FOUND

    try:
        asset.update(
            name=data.get("name"),
            description=data.get("description"),
            vendor=data.get("vendor"),
            network=data.get("network"),
        )
        if data.get("validated"):
            validated = data.get("validated")
            asset.update(validated=validated)
    except InvalidQueryError:
        return response("Invalid parameters"), HTTPStatus.BAD_REQUEST
    except Exception as e:
        print(e)
        return response("An error occured"), HTTPStatus.BAD_REQUEST

    return response("Asset updated.")


@api.route("/assets/settings")
def get_asset_settings():
    app.settings.reload()
    setting = to_dict(app.settings.monitoring)
    return jsonify(setting)


@api.route("/assets/settings", methods=["POST"])
def update_asset_settings():
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()
    subnets = data.get("subnets", [])

    if any(sub for sub in subnets if not AssetMonitoringSetting.verify(sub)):
        return response("Invalid subnet provided"), HTTPStatus.BAD_REQUEST

    asset_setting = AssetMonitoringSetting(subnets=subnets)
    try:
        app.settings.update(monitoring=asset_setting)
    except:
        return response("An error occured"), HTTPStatus.BAD_REQUEST

    return response("Settings updated.")
