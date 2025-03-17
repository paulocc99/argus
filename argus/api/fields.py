from flask import request, jsonify
from flask import current_app as app
from http import HTTPStatus
from mongoengine.errors import ValidationError

from api.routes import api
from api import response
from models.core import Datasource
from models.rule import Filter
from utils.time import gen_date_from_now

timeframe_lookup = {"day": "hour", "week": "day", "month": "day"}

operation_lookup = {
    "avg": "avg",
    "sum": "sum",
    "max": "max",
    "min": "min",
    "count": "value_count",
    "unique": "cardinality",
}

day_lookup = {"day": 24, "week": 7, "month": 31}


@api.route("/fields")
def get_datasource_fields():
    """
    Returns fields mappings from a datasource indice
    """
    datasource = request.args.get("datasource")
    if datasource == "ALL":
        datasource_indices = Datasource.get_all_indices()
    else:
        ds = Datasource.objects(name=datasource).first()
        if not ds:
            return response("Datasource doesn't exist."), HTTPStatus.NOT_FOUND
        datasource_indices = ds.get_indices()

    fields = []
    result = app.elastic.indice_field_mapping(index=datasource_indices)

    for inner_key in result.keys():
        for key, value in result[inner_key]["mappings"].items():
            if key[:1] == "_":
                continue
            fields.append(
                {"field": key, "type": value["mapping"][key.split(".")[-1]]["type"]}
            )

    return jsonify(sorted(fields, key=lambda x: x.get("field")))


@api.route("/fields/suggestion")
def get_datasource_field_suggested_values():
    field = request.args.get("field")
    datasource = request.args.get("datasource", "ALL")

    if datasource == "ALL":
        indices = Datasource.get_all_indices()
    else:
        ds = Datasource.objects(name=datasource).first()
        if not ds:
            return response("Datasource doesn't exist."), HTTPStatus.NOT_FOUND
        indices = ds.get_indices()

    indices = Datasource.get_all_indices()
    suggestions = app.elastic.search_by_fields2(fields=[field], index=indices)
    return jsonify(suggestions)


@api.route("/fields/profiler", methods=["POST"])
def perform_field_profilling():
    """
    Executes a datasource field profilling operation.
    Returns metrics through a supporting field function over a defined
    time-frame.
    """
    if not request.is_json:
        return response("Invalid JSON!"), HTTPStatus.BAD_REQUEST

    data = request.get_json()

    raw_filters = data.get("filters", [])
    datasources = data.get("datasources")
    field = data.get("field")
    func = data.get("func")
    timeframe = data.get("ts")

    if not (field and datasources and func and timeframe):
        return response("Missing parameters."), HTTPStatus.BAD_REQUEST

    if not (
        isinstance(raw_filters, list)
        and isinstance(datasources, list)
        and timeframe in timeframe_lookup.keys()
        and func in operation_lookup.keys()
    ):
        return response("Invalid parameters."), HTTPStatus.BAD_REQUEST

    valid_ds = Datasource.get_datasources(sources=datasources)
    if not valid_ds:
        return response("No valid datasources were supplied."), HTTPStatus.BAD_REQUEST

    try:
        filters = Filter.from_list(raw_filters)
    except ValidationError:
        return response("Invalid filter parameters."), HTTPStatus.BAD_REQUEST

    field = "@timestamp" if field == "ALL" else field
    interval = "hour" if timeframe == "day" else "day"

    stats_by_day = gen_date_from_now(day_lookup[timeframe], interval=interval)
    result = app.elastic.profile_field_by_day(
        index=[d.get_indices() for d in valid_ds],
        field=field,
        func=operation_lookup[func],
        interval=timeframe_lookup[timeframe],
        filters=filters,
    )

    for group in result:
        if group["key_as_string"] in [d["date"] for d in stats_by_day]:
            # stats_by_day.append({
            #     "date": group['key_as_string'],
            #     "value": group[data['field']]['value'] if group[data['field']]['value'] else 0
            # })
            sel_date = next(
                d for d in stats_by_day if d["date"] == group["key_as_string"]
            )
            sel_date["value"] = group[field]["value"]  # group[data['field']]['value']

    return jsonify(stats_by_day)
