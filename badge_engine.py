"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — Badge Engine                                             ║
║        Criteria-driven achievements: performance · character · milestone     ║
║        HeadsUp OS v3.1.0 | Render Deployment Target                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

from datetime import datetime, timezone

from data_models import Badge, get_nested

BADGE_DEFINITIONS = [
    {
        "badge_id": "sniper",
        "name": "Sniper",
        "category": "performance",
        "description": "Shooting score of 85 or higher",
        "criteria": {"field": "technical.shooting_converted", "operator": ">=", "value": 85},
        "icon": "🎯",
    },
    {
        "badge_id": "handle_artist",
        "name": "Handle Artist",
        "category": "performance",
        "description": "Ball handling score of 85 or higher",
        "criteria": {"field": "technical.ball_handling_converted", "operator": ">=", "value": 85},
        "icon": "🪄",
    },
    {
        "badge_id": "rim_pressure",
        "name": "Rim Pressure",
        "category": "performance",
        "description": "Finishing score of 85 or higher",
        "criteria": {"field": "technical.finishing_converted", "operator": ">=", "value": 85},
        "icon": "💥",
    },
    {
        "badge_id": "lockdown",
        "name": "Lockdown",
        "category": "performance",
        "description": "Defense score of 85 or higher",
        "criteria": {"field": "technical.defense_converted", "operator": ">=", "value": 85},
        "icon": "🔒",
    },
    {
        "badge_id": "glass_cleaner",
        "name": "Glass Cleaner",
        "category": "performance",
        "description": "Rebounding score of 85 or higher",
        "criteria": {"field": "technical.rebounding_converted", "operator": ">=", "value": 85},
        "icon": "🧹",
    },
    {
        "badge_id": "dimer",
        "name": "Dimer",
        "category": "performance",
        "description": "Passing score of 85 or higher",
        "criteria": {"field": "technical.passing_converted", "operator": ">=", "value": 85},
        "icon": "🎁",
    },
    {
        "badge_id": "iron_mind",
        "name": "Iron Mind",
        "category": "character",
        "description": "Composure rating of 90 or higher",
        "criteria": {"field": "neural.composure", "operator": ">=", "value": 90},
        "icon": "🧠",
    },
    {
        "badge_id": "sponge",
        "name": "Sponge",
        "category": "character",
        "description": "Coachability rating of 90 or higher",
        "criteria": {"field": "neural.coachability", "operator": ">=", "value": 90},
        "icon": "🧽",
    },
    {
        "badge_id": "bounce_back",
        "name": "Bounce Back",
        "category": "character",
        "description": "Resilience rating of 90 or higher",
        "criteria": {"field": "neural.resilience", "operator": ">=", "value": 90},
        "icon": "🔁",
    },
    {
        "badge_id": "motor",
        "name": "Motor",
        "category": "character",
        "description": "Drive rating of 90 or higher",
        "criteria": {"field": "neural.drive", "operator": ">=", "value": 90},
        "icon": "⚙️",
    },
    {
        "badge_id": "floor_general",
        "name": "Floor General",
        "category": "performance",
        "description": "IQ + Leadership both above 80",
        "criteria": {"fields": ["neural.iq", "neural.leadership"], "operator": "all_>=", "value": 80},
        "icon": "⚡",
    },
    {
        "badge_id": "two_way",
        "name": "Two-Way Threat",
        "category": "performance",
        "description": "Shooting + Defense both at 80 or higher",
        "criteria": {
            "fields": ["technical.shooting_converted", "technical.defense_converted"],
            "operator": "all_>=",
            "value": 80,
        },
        "icon": "🗡️",
    },
    {
        "badge_id": "franchise",
        "name": "Franchise",
        "category": "milestone",
        "description": "Overall rating in the Elite tier (85+)",
        "criteria": {"field": "ovr", "operator": ">=", "value": 85},
        "icon": "🏆",
    },
]


def check_criteria(player_data: dict, criteria: dict) -> bool:
    """Evaluate a single badge criteria rule against player data.

    Args:
        player_data: Nested player dict with technical, neural, and ovr keys.
        criteria: Rule dict with field(s), operator, and value.

    Returns:
        True if the rule passes. Missing fields never pass (Zero Hallucination).
    """
    operator = criteria["operator"]
    threshold = criteria["value"]

    if operator == ">=":
        value = get_nested(player_data, criteria["field"])
        return value is not None and value >= threshold

    if operator == "all_>=":
        values = [get_nested(player_data, f) for f in criteria["fields"]]
        return all(v is not None and v >= threshold for v in values)

    return False


def evaluate_badges(player_data: dict, badge_definitions: list = BADGE_DEFINITIONS) -> list:
    """Check all badge criteria against a player's current scores.

    Args:
        player_data: Nested player dict with technical, neural, and ovr keys.
        badge_definitions: Badge rule definitions to evaluate.

    Returns:
        List of earned Badge dataclasses.
    """
    earned = []
    for badge_def in badge_definitions:
        if check_criteria(player_data, badge_def["criteria"]):
            earned.append(Badge(
                badge_id=badge_def["badge_id"],
                name=badge_def["name"],
                category=badge_def["category"],
                description=badge_def["description"],
                criteria=badge_def["criteria"],
                awarded_at=datetime.now(timezone.utc),
                icon=badge_def["icon"],
            ))
    return earned
