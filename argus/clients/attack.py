from mitreattack.stix20 import MitreAttackData
from typing import Optional
from pathlib import Path
import os

from utils import get_config_path
from models.rule import ATTACKEntry, Rule


def get_matrix_data(matrix: str, version: str) -> MitreAttackData:
    data_dir = get_config_path()
    matrix_file_path = os.path.join(data_dir, f"{matrix}-{version}.json")
    matrix_file = Path(matrix_file_path)

    if not matrix_file.exists():
        return None

    return MitreAttackData(matrix_file_path)


class ATTACKClient:
    def __init__(self, version: str):
        self.data = {
            "ics": get_matrix_data("ics-attack", version),
            "enterprise": get_matrix_data("enterprise-attack", version),
        }

    def get_tactics(
        self,
        matrix: str,
        complete: bool = False,
        with_rules: bool = False,
        name_filter: Optional[str] = None,
    ) -> Optional[list | dict]:
        r = self.data[matrix].get_tactics(remove_revoked_deprecated=True)
        tactics = []

        for tactic in r:
            data = {
                "id": tactic.external_references[0].external_id,
                "name": tactic.name,
                "shortname": tactic.x_mitre_shortname,
            }
            if complete:
                data["description"] = tactic.description
                data["url"] = tactic.external_references[0].url
                data["techniques"] = self.get_techniques_by_tactic(
                    matrix=matrix,
                    tactic=tactic.x_mitre_shortname,
                    complete=True,
                    with_rules=with_rules,
                )

            tactics.append(data)

        if name_filter:
            return next(filter(lambda c: c["shortname"] == name_filter, tactics), None)
        return tactics

    def get_tactic(self, name: str, matrix: str = "ics") -> Optional[ATTACKEntry]:
        # tactic = self.get_tactics(matrix, name_filter=name)
        # if not tactic:
        #     return
        # tactic = ATTACKEntry(**tactic)
        # data = self.data[matrix].get_objects_by_name(name, 'x-mitre-tactic')
        data = self.data[matrix].get_object_by_attack_id(name, "x-mitre-tactic")
        if not data:
            return
        tactic = ATTACKEntry(
            id=data.external_references[0].external_id,
            name=data.name,
            shortname=data.x_mitre_shortname,
        )
        return tactic

    def get_techniques(
        self,
        matrix: str,
        complete: bool = False,
        with_rules: bool = False,
        id_filter: Optional[str] = None,
    ) -> Optional[list | dict]:
        all_techniques = self.data[matrix].get_techniques()
        techniques = []

        for t in all_techniques:
            technique = {
                "id": t.external_references[0].external_id,
                "name": t.name,
            }
            if complete:
                tactics = [ta.phase_name for ta in t.kill_chain_phases]
                technique["tactics"] = tactics

            if with_rules:
                rules = Rule.by_attack_technique(technique["id"])
                technique["rules"] = [
                    {"uuid": rule.uuid, "name": rule.name} for rule in rules
                ]

            techniques.append(technique)
        if id_filter:
            return next(
                filter(lambda c: c["id"].lower() == id_filter, techniques), None
            )
        return techniques

    def get_technique(self, tid: str, matrix: str = "ics") -> Optional[ATTACKEntry]:
        data = self.data[matrix].get_object_by_attack_id(tid, "attack-pattern")
        if not data:
            return
        technique = ATTACKEntry(
            id=data.external_references[0].external_id, name=data.name
        )
        return technique

    def get_techniques_by_group(self, matrix: str, group_id: str) -> list:
        data = self.data[matrix].get_techniques_used_by_group(group_id)
        techniques = []
        for t in data:
            t = t["object"]
            techniques.append(
                {
                    "id": t.external_references[0].external_id,
                    "name": t.name,
                    "description": t.description,
                }
            )
        return techniques

    def get_techniques_by_tactic(
        self, matrix: str, tactic: str, complete: bool = False, with_rules: bool = False
    ) -> list:
        data = self.data[matrix].get_techniques_by_tactic(tactic, f"{matrix}-attack")
        techniques = []
        for t in data:
            data = {"id": t.external_references[0].external_id, "name": t.name}
            if complete:
                data |= {
                    "description": t.description,
                    "mitigations": self.get_mitigations_by_technique(matrix, t.id),
                    "detections": self.get_detections_by_technique(matrix, t.id),
                    "url": t.external_references[0].url,
                }
            if with_rules:
                rules = Rule.by_attack_technique(data["id"])
                data["rules"] = []
                for rule in rules:
                    data["rules"].append({"uuid": rule.uuid, "name": rule.name})
            techniques.append(data)
        return techniques

    def get_techniques_by_software(self, matrix: str, software_id: str) -> list:
        data = self.data[matrix].get_techniques_used_by_software(software_id)
        techniques = []
        for t in data:
            t = t["object"]
            techniques.append(
                {
                    "id": t.external_references[0].external_id,
                    "name": t.name,
                    "description": t.description,
                }
            )
        return techniques

    def get_mitigations_by_technique(self, matrix: str, id: str):
        mitigations = []
        data = self.data[matrix].get_mitigations_mitigating_technique(id)
        for mit in data:
            mit = mit["object"]
            mitigations.append(
                {
                    "id": mit.external_references[0].external_id,
                    "name": mit.name,
                    "description": mit.description,
                    "url": mit.external_references[0].url,
                    "updated_at": mit.created,
                }
            )
        return mitigations

    def get_data_sources(self, matrix: str):
        datasources = []
        data = self.data[matrix].get_datasources()
        for ds in data:
            datasources.append(
                {
                    "id": ds.external_references[0].external_id,
                    "name": ds.name,
                    "description": ds.description,
                    "collection": (
                        ds.x_mitre_collection_layers
                        if hasattr(ds, "x_mitre_collection_layers")
                        else []
                    ),
                    "platforms": (
                        ds.x_mitre_platforms if hasattr(ds, "x_mitre_platforms") else []
                    ),
                    "url": ds.external_references[0].url,
                    "updated_at": ds.modified,
                }
            )
        return datasources

    def get_detections_by_technique(self, matrix: str, id: str):
        detections = []
        data = self.data[matrix].get_datacomponents_detecting_technique(id)
        for det in data:
            det = det["object"]
            detections.append(
                {
                    "name": det.name,
                    "description": det.description,
                    "updated_at": det.created,
                }
            )
        return detections

    def get_groups(self, matrix: str):
        groups = []
        data = self.data[matrix].get_groups()
        for group in data:
            if (
                group.x_mitre_deprecated
                if hasattr(group, "x_mitre_deprecated")
                else False
            ):
                continue

            groups.append(
                {
                    "id": group.external_references[0].external_id,
                    "name": group.name,
                    "aliases": group.aliases if hasattr(group, "aliases") else [],
                    "description": (
                        group.description if hasattr(group, "description") else ""
                    ),
                    "techniques": self.get_techniques_by_group(matrix, group.id),
                    "software": self.get_software_by_group(matrix, group.id),
                    "campaigns": self.get_campaigns_by_group(matrix, group.id),
                    "url": group.external_references[0].url,
                    "updated_at": group.modified,
                }
            )
        return groups

    def get_groups_by_software(self, matrix: str, software_id: str):
        groups = []
        data = self.data[matrix].get_groups_using_software(software_id)
        for group in data:
            group = group["object"]
            if (
                group.x_mitre_deprecated
                if hasattr(group, "x_mitre_deprecated")
                else False
            ):
                continue

            groups.append(
                {
                    "id": group.external_references[0].external_id,
                    "name": group.name,
                    "aliases": group.aliases if hasattr(group, "aliases") else [],
                    "url": group.external_references[0].url,
                    "updated_at": group.modified,
                }
            )
        return groups

    def get_software(self, matrix: str):
        software = []
        data = self.data[matrix].get_software()
        for soft in data:
            if (
                soft.x_mitre_deprecated
                if hasattr(soft, "x_mitre_deprecated")
                else False
            ):
                continue

            software.append(
                {
                    "id": soft.external_references[0].external_id,
                    "name": soft.name,
                    "description": (
                        soft.description if hasattr(soft, "description") else ""
                    ),
                    "platforms": (
                        soft.x_mitre_platforms
                        if hasattr(soft, "x_mitre_platforms")
                        else ""
                    ),
                    "techniques": self.get_techniques_by_software(matrix, soft.id),
                    "groups": self.get_groups_by_software(matrix, soft.id),
                    "url": soft.external_references[0].url,
                    "updated_at": soft.modified,
                }
            )
        return software

    def get_software_by_group(self, matrix: str, id: str):
        software = []
        data = self.data[matrix].get_software_used_by_group(id)
        for soft in data:
            soft = soft["object"]
            if soft.revoked:
                continue
            software.append(
                {
                    "id": soft.external_references[0].external_id,
                    "name": soft.name,
                    "description": soft.description,
                    "platform": (
                        soft.x_mitre_platforms
                        if hasattr(soft, "x_mitre_platforms")
                        else ""
                    ),
                    "url": soft.external_references[0].url,
                    "updated_at": soft.modified,
                }
            )
        return software

    def get_campaigns_by_group(self, matrix: str, group_id: str):
        campaigns = []
        data = self.data[matrix].get_campaigns_attributed_to_group(group_id)
        for campaign in data:
            camp = campaign["object"]
            campaigns.append(
                {
                    "id": camp.external_references[0].external_id,
                    "name": camp.name,
                    "description": (
                        camp.description if hasattr(camp, "description") else ""
                    ),
                    "aliases": camp.aliases if hasattr(camp, "aliases") else [],
                    "url": camp.external_references[0].url,
                    "updated_at": camp.modified,
                }
            )
        return campaigns
