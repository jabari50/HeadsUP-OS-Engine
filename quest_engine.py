"""
╔══════════════════════════════════════════════════════════════════════════════╗
║        HeadsUp OS — Quest Engine                                             ║
║        Arc-based development goals seeded from the athlete's weakest areas   ║
║        HeadsUp OS v3.1.0 | Render Deployment Target                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import uuid

from data_models import Quest, get_nested
from ovr_engine import SCALE_MAX, next_tier_target

ATTRIBUTE_QUEST_BOOST = 10.0
QUEST_LABELS = {
    "ball_handling": "Tighten the Handle",
    "shooting": "Stretch the Floor",
    "finishing": "Finish Through Contact",
    "passing": "See the Floor",
    "defense": "Guard Your Yard",
    "rebounding": "Own the Glass",
    "athleticism": "Build the Engine",
    "composure": "Stay Ice Cold",
    "coachability": "Stay Coachable",
    "iq": "Sharpen the Mind",
    "resilience": "Bounce Back Stronger",
    "leadership": "Raise Your Voice",
    "drive": "Bring It Every Day",
}


def _new_quest(title: str, description: str, target_attribute: str,
               target_value: float, current_value: float) -> Quest:
    """Build an active Quest with computed progress.

    Args:
        title: Display title.
        description: What the athlete is working toward.
        target_attribute: Dotted path into the player data dict.
        target_value: Score that completes the quest.
        current_value: Athlete's current score on that attribute.

    Returns:
        Quest dataclass in active (or completed) state.
    """
    quest = Quest(
        quest_id=str(uuid.uuid4()),
        title=title,
        description=description,
        target_attribute=target_attribute,
        target_value=target_value,
        current_value=current_value,
        status="active",
    )
    quest.progress_pct = round(min(100.0, (current_value / target_value) * 100), 1)
    if current_value >= target_value:
        quest.status = "completed"
    return quest


def seed_starter_quests(player_data: dict) -> list:
    """Generate the onboarding quest arc from an athlete's weakest areas.

    Seeds three quests: lift the weakest technical skill, lift the weakest
    neural attribute, and reach the next OVR tier.

    Args:
        player_data: Nested player dict with technical (converted 1-99),
            neural, and ovr keys.

    Returns:
        List of Quest dataclasses.
    """
    quests = []

    technical = player_data.get("technical", {})
    converted = {k: v for k, v in technical.items() if k.endswith("_converted")}
    if converted:
        weakest_key = min(converted, key=converted.get)
        skill = weakest_key.replace("_converted", "")
        current = converted[weakest_key]
        target = min(SCALE_MAX, current + ATTRIBUTE_QUEST_BOOST)
        quests.append(_new_quest(
            title=QUEST_LABELS.get(skill, f"Develop {skill}"),
            description=f"Raise {skill.replace('_', ' ')} from {round(current)} to {round(target)}.",
            target_attribute=f"technical.{weakest_key}",
            target_value=target,
            current_value=current,
        ))

    neural = player_data.get("neural", {})
    if neural:
        weakest_attr = min(neural, key=neural.get)
        current = neural[weakest_attr]
        target = min(SCALE_MAX, current + ATTRIBUTE_QUEST_BOOST)
        quests.append(_new_quest(
            title=QUEST_LABELS.get(weakest_attr, f"Develop {weakest_attr}"),
            description=f"Raise {weakest_attr.replace('_', ' ')} from {round(current)} to {round(target)}.",
            target_attribute=f"neural.{weakest_attr}",
            target_value=target,
            current_value=current,
        ))

    ovr = player_data.get("ovr")
    if ovr is not None:
        tier, threshold = next_tier_target(ovr)
        if tier is not None:
            quests.append(_new_quest(
                title=f"Reach {tier} Tier",
                description=f"Push overall rating from {ovr} to {threshold}.",
                target_attribute="ovr",
                target_value=threshold,
                current_value=ovr,
            ))

    return quests


def calculate_quest_progress(quest: Quest, player_data: dict) -> Quest:
    """Update quest progress based on current player data.

    Args:
        quest: The quest to refresh.
        player_data: Nested player dict with current scores.

    Returns:
        The quest with updated current_value, progress_pct, and status.
    """
    current = get_nested(player_data, quest.target_attribute)
    if current is None:
        return quest
    quest.current_value = current
    quest.progress_pct = round(min(100.0, (current / quest.target_value) * 100), 1)
    if current >= quest.target_value:
        quest.status = "completed"
    return quest
