from elasticsearch import Elasticsearch
from elasticsearch.client import IngestClient
from elasticsearch.exceptions import ConnectionError
from typing import Optional

from constants import SEARCH_LIMIT, WINDOW_SIZE
from config import Config
from models.core import Datasource, TimeRange
from models.rule import Filter, FilterType
import builder


class ElasticClient:
    def __init__(self, config: Config):
        if config.ELASTIC_API_KEY:
            self._es = Elasticsearch(
                config.ELASTIC_HOST, api_key=config.ELASTIC_API_KEY
            )
        elif config.ELASTIC_USER and config.ELASTIC_PASS:
            basic_auth = (config.ELASTIC_USER, config.ELASTIC_PASS)
            self._es = Elasticsearch(
                config.ELASTIC_HOST, basic_auth=basic_auth, timeout=20
            )
        else:
            raise ConnectionError("Invalid authentication information.")
        self._pipelines: IngestClient = IngestClient(client=self._es)
        self.check_indices()

    def get_all_data_streams(self):
        result = self._es.indices.get_data_stream()
        streams = [s["name"] for s in result["data_streams"]]
        return streams

    def get_all_indices(self):
        indices = self._es.indices.get_alias(index="*").keys()
        return indices

    def indice_exists(self, indice: str) -> bool:
        return self._es.indices.exists(index=indice)

    def check_indices(self):
        """
        Checks if custom application indices were already initialized
        """
        if not self._es.indices.exists(index="baseline"):
            self._es.indices.create(index="baseline")

    def search_index_all(self, index: str):
        result = self._es.search(index=index)
        return result

    def search_index_query(self, index: str, query: str, timeframe: str = "0"):
        q = {
            "bool": {
                "must": [
                    {"query_string": {"query": query}},
                    {
                        "range": {
                            "@timestamp": {"lte": "now", "gte": f"now-{timeframe}"}
                        }
                    },
                ]
            }
        }
        result = self._es.search(index=index, query=q)
        return result

    def search_simple_query(self, index: str, query: str):
        return self._es.search(index=index, q=query)

    def search(self, *args, **kwargs):
        return self._es.search(*args, **kwargs)

    # TODO - move to utils
    def cal_iter(self, page, size):
        import math

        window_div = (page * size) / WINDOW_SIZE
        decimal = window_div % 1

        return math.floor(window_div), math.ceil(decimal * size)

    # TEST TODO - throws a lot of circuit_breaking_exception exceptions
    def search_pagination(self, index, sort, q, page: int, size: int):
        if (page * size) > WINDOW_SIZE:
            window_iter, normal_iter = self.cal_iter(page, size)
            print(f"WINDOW Iter: {window_iter}, Normal Iter: {normal_iter}")

            sort.append({"event.id": "desc"})
            current_id = None
            r = None

            for i in range(window_iter + normal_iter - 1):
                search_size = WINDOW_SIZE if i < window_iter else size
                r = self._es.search(
                    index=index,
                    sort=sort,
                    q=q,
                    search_after=current_id,
                    size=search_size,
                )
                if len(r["hits"]["hits"]) == 0:
                    return r
                current_id = r["hits"]["hits"][-1]["sort"]
            return r

        else:
            return self._es.search(
                index=index, sort=sort, q=q, from_=((page - 1) * size), size=size
            )

    def search_by_fields(
        self, fields: list[str], index: str | list[str] = "*", cfilter=None
    ):
        try:
            term_list = [{"field": field} for field in fields]
            query = {"aggs": {"values": {"multi_terms": {"terms": term_list}}}}
            return self._es.search(
                index=index, body=query, size=0, q=cfilter, request_timeout=60
            )
        except:
            return None

    def search_by_fields2(
        self,
        fields: list[str],
        index: Optional[str | list[str]] = "*",
        filters: Optional[list[Filter]] = None,
        rel_range: Optional[str] = None,
        time_range: Optional[TimeRange] = None,
    ):
        if len(fields) == 1:
            terms = {"terms": {"field": fields[0], "size": SEARCH_LIMIT}}
        else:
            terms = {
                "multi_terms": {
                    "terms": [{"field": field} for field in fields],
                    "size": SEARCH_LIMIT,
                }
            }
            ###### composite aggreation
            # sources = []
            # for field in fields:
            #     sources.append({field: {"terms": {"field": field}}})
            # terms = {
            #     "composite": {
            #         "sources" : sources
            #     }
            # }

        query = {"aggs": {"values": terms}}

        if time_range:
            builder.set_abs_timeframe(query, time_range)
        elif rel_range:
            builder.set_timeframe(query, rel_range)
        if filters:
            builder.set_filters(query, filters)

        result = self._es.search(index=index, body=query, request_timeout=60)
        data = result["aggregations"]["values"]["buckets"]

        if len(fields) == 1:
            return list({key["key"] for key in data})
        else:
            return list({key["key_as_string"] for key in data})

    def get_rule_by_uuid(self, uuid: str):
        r = self._es.search(index="rules", query={"match": {"uuid": uuid}})
        return r["hits"]["hits"][0]["_source"]

    def insert(self, index: str, doc):
        self._es.index(index=index, document=doc)

    def bulk_insert(self, index: str, docs: list):
        for doc in docs:
            self._es.index(index=index, document=doc)
        # self._es.bulk(index=index, operations=docs)

    def update(self, index: str, uuid: str, data):
        r = self._es.search(index=index, query={"match": {"uuid": uuid}})
        r_id = r["hits"]["hits"][0]["_id"]
        self._es.update(index=index, id=r_id, doc=data)

    def delete(self, index: str, uuid: str):
        r = self._es.search(index=index, query={"match": {"uuid": uuid}})
        r_id = r["hits"]["hits"][0]["_id"]
        self._es.delete(index=index, id=r_id)

    def eql_search(self, *args, **kwargs):
        try:
            return self._es.eql.search(*args, **kwargs)
        except Exception as e:
            return

    def indice_field_mapping(self, index: str, fields: str = "*"):
        r = self._es.indices.get_field_mapping(index=index, fields=fields)
        return r

    def indice_count(self, index: str, q=None):
        try:
            r = self._es.count(index=index, q=q)
            return r["count"]
        except:
            return 0

    def indice_count_by_day(self, index: str):
        query = {
            "query": {"range": {"@timestamp": {"lte": "now"}}},
            "aggs": {
                "group_by_day": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "calendar_interval": "day",
                    }
                }
            },
            "size": 30,
        }
        r = self._es.search(index=index, body=query)
        return [ts for ts in r["aggregations"]["group_by_day"]["buckets"]]

    def data_flows_by_day(self, index: str | list[str], interval: str, cfilter=None):
        query = {
            "aggs": {
                "group_by_day": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "calendar_interval": interval,
                    },
                },
            }
        }
        r = self._es.search(index=index, body=query, q=cfilter)
        return r["aggregations"]["group_by_day"]["buckets"]

    def profile_field_by_day(
        self, index: str, field: str, func: str, interval: str, filters: list[Filter]
    ):
        query = {
            "aggs": {
                "group_by_day": {
                    "date_histogram": {
                        "field": "@timestamp",
                        "calendar_interval": interval,
                    },
                    "aggs": {field: {func: {"field": field}}},
                }
            }
        }
        if filters:
            builder.set_filters(
                query, [f for f in filters if f.type is FilterType.SIMPLE]
            )
            builder.set_painless_filter(
                query, [f for f in filters if f.type == FilterType.PAINLESS_SCRIPT]
            )
        builder.set_timeframe(query, "160d")

        r = self._es.search(index=index, body=query)
        return r["aggregations"]["group_by_day"]["buckets"]

    def search_pipeline(self):
        unmanaged_pipelines = []
        pipes = self._pipelines.get_pipeline()

        for name in pipes.keys():
            if pipes[name].get("_meta") or name[0] == ".":
                continue
            if "kibana" in name:
                print(pipes[name])

            unmanaged_pipelines.append(
                {
                    "id": name,
                    "description": pipes[name].get("description", ""),
                    "processors": pipes[name].get("processors", []),
                    "on_failure": pipes[name].get("on_failure", []),
                }
            )
        return unmanaged_pipelines

    def search_pipeline_by_id(self, p_id: str):
        return self._pipelines.get_pipeline(id=p_id)

    def update_pipeline(
        self, p_id: str, description: str, processors: list, on_failure: list
    ):
        return self._pipelines.put_pipeline(
            id=p_id,
            description=description,
            processors=processors,
            on_failure=on_failure,
        )

    def delete_pipeline(self, p_id):
        return self._pipelines.delete_pipeline(id=p_id)

    def events_by_ips(self, ips: list[str], network: bool = False):
        query = ""
        for index, ip in enumerate(ips):
            query += f"destination.ip:{ip} or source.ip:{ip}"
            if not network:
                query += f" or host.ip: {ip}"
            if (index + 1) < len(ips):
                query += " or "

        all_datasource_indices = Datasource.get_all_indices()
        r = self.indice_count(",".join(all_datasource_indices), q=query)
        return r
