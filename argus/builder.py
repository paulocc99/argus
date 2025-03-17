from typing import Any, Optional

from models.core import TimeRange
from models.rule import Condition, ConditionOperator, ConditionFunction


operation_lookup = {
    ConditionFunction.AVG: "avg",
    ConditionFunction.COUNT: "value_count",
    ConditionFunction.UNIQ: "cardinality",
    ConditionFunction.SUM: "sum",
    ConditionFunction.MIN: "min",
    ConditionFunction.MAX: "max",
}


class Query:
    def __init__(self, data: Optional[dict]):
        if data and (data.get("query", None) or data["query"].get("bool", None)):
            self.query = data
        else:
            self.query = {"query": {"bool": {"must": []}}}


def is_operation_valid(op):
    """Validates the conditional operation native function"""
    return operation_lookup[op] if op in operation_lookup.keys() else None


def init_bool_query(query: dict):
    if not query.get("query", None) or not query["query"].get("bool", None):
        query["query"] = {"bool": {"must": []}}


def build_search_query(query: dict, cond: Condition):
    if not "aggs" in query.keys():
        query["aggs"] = {}

    if "aggs" in query.keys() and "groupby" in query["aggs"].keys():
        if not "aggs" in query["aggs"]["groupby"].keys():
            query["aggs"]["groupby"]["aggs"] = {}
        query["aggs"]["groupby"]["aggs"][f"{cond.function.value}-{cond.field}"] = {
            operation_lookup[cond.function]: {"field": cond.field}
        }
    elif "aggs" in query.keys():
        query["aggs"][f"{cond.function.value}-{cond.field}"] = {
            operation_lookup[cond.function]: {"field": cond.field}
        }
    # else:
    #    query["aggs"] = {
    #        f"{agg.function}-{agg.field}": {operation_lookup[agg.function].value: {"field": agg.field}}}


def set_groupby(query, groupings):
    if len(groupings) > 1:
        query["aggs"] = {"groupby": {"multi_terms": {"terms": []}}}
        for field in groupings:
            query["aggs"]["groupby"]["multi_terms"]["terms"].append({"field": field})
    else:
        query["aggs"] = {"groupby": {"terms": {"field": groupings[0]}}}


def get_base_query() -> dict[str, Any]:
    return {"query": {"bool": {"must": []}}}


def set_filters(query, filters):
    if len(filters) <= 0:
        return

    init_bool_query(query)
    search_query = ""
    for index, mFilter in enumerate(filters):
        # if not all(attr in mFilter.keys() for attr in ['field', 'value', 'type']):
        #     continue

        # Check if field has multiple alterative values
        if "," in mFilter.value:
            search_query += f"{'-' if mFilter.operator is ConditionOperator.NE else ''}({mFilter.field} : ({' OR '.join([val for val in mFilter.value.split(',')])}))"
        else:
            search_query += f"{'-' if mFilter.operator is ConditionOperator.NE else ''}({mFilter.field}: {mFilter.value})"

        if index < (len(filters) - 1):
            search_query += " AND "

    query["query"]["bool"]["must"].append({"query_string": {"query": search_query}})


def set_painless_filter(query, filters):
    if len(filters) <= 0:
        return
    init_bool_query(query)

    if not "filter" in query.get("query", {}).get("bool", {}).keys():
        query["query"]["bool"]["filter"] = []

    for f in filters:
        p_filter = {"script": {"script": {"source": f.value}}}
        query["query"]["bool"]["filter"].append(p_filter)


def set_timeframe(query, timeframe):
    init_bool_query(query)
    query["query"]["bool"]["must"].append(
        {
            "range": {
                "@timestamp": {
                    "gte": (f"now-{timeframe}" if timeframe != "always" else "0"),
                    "lte": "now",
                }
            }
        }
    )


def set_abs_timeframe(query: dict, time_range: TimeRange):
    init_bool_query(query)
    query["query"]["bool"]["must"].append(
        {
            "range": {
                "@timestamp": {
                    "time_zone": "+01:00",
                    "gte": time_range.start.strftime("%Y-%m-%dT00:00:00"),
                    "lte": time_range.end.strftime("%Y-%m-%dT00:00:00"),
                }
            }
        }
    )


def get_date_count_agg(field: str):
    """Returns date count pipeline aggregation"""
    return [
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": field}}
                },
                "count": {"$sum": 1},
            }
        }
    ]


def get_attr_count_agg(field: str, value: str):
    return [
        {"$match": {"type": value}},
        {"$unwind": {"path": field, "preserveNullAndEmptyArrays": True}},
        {"$group": {"_id": field, "count": {"$sum": 1}}},
    ]
