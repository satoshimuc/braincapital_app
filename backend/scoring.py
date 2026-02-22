from typing import List, Optional, Dict


def normalize_score(raw: float, min_val: float = 1, max_val: float = 5) -> float:
    """Normalize a raw score (1-5 scale) to 0-100."""
    return max(0, min(100, ((raw - min_val) / (max_val - min_val)) * 100))


def normalize_reverse(raw: float, min_val: float = 1, max_val: float = 5) -> float:
    """Normalize a reversed score (higher raw = lower score)."""
    return normalize_score(max_val - raw + min_val, min_val, max_val)


def pillar_score(item_scores: List[float], weights: Optional[List[float]] = None) -> float:
    """Calculate weighted pillar score (0-100)."""
    if not item_scores:
        return 0
    if weights is None:
        weights = [1.0] * len(item_scores)
    total_weight = sum(weights)
    if total_weight == 0:
        return 0
    weighted_sum = sum(s * w for s, w in zip(item_scores, weights))
    return round(min(100, max(0, weighted_sum / total_weight)), 1)


def total_score(drivers: float, health: float, skills: float) -> float:
    """Calculate total Brain Capital Score."""
    return round(0.3 * drivers + 0.4 * health + 0.3 * skills, 1)


# Reverse-scored items (higher raw answer = lower brain capital score)
REVERSE_ITEMS = {"d4", "d5"}  # noise/pollution exposure, screen time


def calculate_pillar1_score(responses: Dict[str, float]) -> float:
    """Calculate Pillar 1 (Brain Capital Drivers) score from survey responses."""
    scores = []
    for item_id, raw in responses.items():
        if item_id in REVERSE_ITEMS:
            scores.append(normalize_reverse(raw))
        else:
            scores.append(normalize_score(raw))
    return pillar_score(scores) if scores else 0


def calculate_pillar2_score(responses: Dict[str, float]) -> float:
    """Calculate Pillar 2 (Brain Health) score from survey responses.
    PHQ-9/GAD-7 items: lower raw = better health (0-3 scale).
    Custom items: 5-scale where lower = better for stress.
    """
    scores = []
    phq_gad_items = {"h1", "h2", "h3", "h4", "h5", "h6"}
    for item_id, raw in responses.items():
        if item_id in phq_gad_items:
            # PHQ/GAD: 0-3 scale, 0=best; reverse and normalize
            normalized = max(0, min(100, (1 - raw / 3) * 100))
            scores.append(normalized)
        elif item_id == "h7":
            # Stress 1-10: lower = better
            normalized = max(0, min(100, (1 - (raw - 1) / 9) * 100))
            scores.append(normalized)
        else:
            # h8: subjective cognitive decline frequency, reverse scored
            scores.append(normalize_reverse(raw))
    return pillar_score(scores) if scores else 0


def calculate_pillar3_score(
    survey_responses: Dict[str, float],
    test_results: Dict[str, float]
) -> float:
    """Calculate Pillar 3 (Brain Skills) score."""
    survey_scores = [normalize_score(v) for v in survey_responses.values()]
    test_scores = list(test_results.values())  # already normalized 0-100

    all_scores = survey_scores + test_scores
    # Weight cognitive tests slightly more
    survey_weights = [1.0] * len(survey_scores)
    test_weights = [1.5] * len(test_scores)
    all_weights = survey_weights + test_weights

    return pillar_score(all_scores, all_weights) if all_scores else 0


# Benchmark data (static, age/gender groups)
BENCHMARKS = {
    "20-29": {"drivers": 68, "health": 72, "skills": 70, "total": 70},
    "30-39": {"drivers": 65, "health": 68, "skills": 72, "total": 68},
    "40-49": {"drivers": 63, "health": 65, "skills": 71, "total": 66},
    "50-60": {"drivers": 61, "health": 62, "skills": 69, "total": 64},
}


def get_benchmark(age: Optional[int]) -> Dict[str, float]:
    if age is None:
        return BENCHMARKS["30-39"]
    if age < 30:
        return BENCHMARKS["20-29"]
    elif age < 40:
        return BENCHMARKS["30-39"]
    elif age < 50:
        return BENCHMARKS["40-49"]
    else:
        return BENCHMARKS["50-60"]


def normalize_test_score_attention(avg_reaction_ms: float, correct_rate: float) -> float:
    """Normalize attention test: lower reaction time + high accuracy = better."""
    # reaction: 150ms (best) to 800ms (worst)
    rt_score = max(0, min(100, (1 - (avg_reaction_ms - 150) / 650) * 100))
    acc_score = correct_rate * 100
    return round(rt_score * 0.5 + acc_score * 0.5, 1)


def normalize_test_score_memory(correct_count: int, total: int) -> float:
    """Normalize memory test."""
    return round(min(100, (correct_count / max(1, total)) * 100), 1)


def normalize_test_score_flexibility(avg_reaction_ms: float, correct_rate: float) -> float:
    """Normalize flexibility (Stroop) test."""
    rt_score = max(0, min(100, (1 - (avg_reaction_ms - 200) / 800) * 100))
    acc_score = correct_rate * 100
    return round(rt_score * 0.5 + acc_score * 0.5, 1)
