"""Centralized Growth Score calculation utility."""


def calculate_growth_score(streak: int, completed_reflections: int, profile_completed: bool = True) -> int:
    """
    Calculate user's Growth Score (0 to 100).
    - Base score: 40
    - Streak bonus: up to 30 points (3 pts/day)
    - Activity bonus: up to 20 points (2 pts/reflection)
    - Profile completion bonus: 10 points
    """
    base = 40
    streak_bonus = min(streak * 3, 30)
    activity_bonus = min(completed_reflections * 2, 20)
    profile_bonus = 10 if profile_completed else 0

    score = base + streak_bonus + activity_bonus + profile_bonus
    return min(100, max(0, score))
