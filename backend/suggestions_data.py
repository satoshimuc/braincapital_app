"""
Static rule-based suggestion templates for PBCM.
Rules: pillar + score range -> advice text (ja/en).
"""

SUGGESTIONS = [
    # --- Pillar 1: Brain Capital Drivers ---
    {
        "pillar": "drivers",
        "score_max": 40,
        "severity": "high",
        "ja": {
            "title": "生活習慣の基盤を整えましょう",
            "body": "Brain Capital Driversのスコアが低めです。まず睡眠を7〜8時間確保し、就寝1時間前はスクリーンをオフにしましょう。毎日15分の散歩でも脳への血流が改善します。",
            "actions": ["就寝90分前に入浴で体温調節", "毎日15分のウォーキング習慣", "週3回は魚・ナッツを食事に取り入れる"]
        },
        "en": {
            "title": "Build your lifestyle foundation",
            "body": "Your Brain Capital Drivers score is low. Start by securing 7-8 hours of sleep and turning off screens 1 hour before bed. Even a 15-minute daily walk improves brain blood flow.",
            "actions": ["Take a bath 90 min before bed to regulate body temp", "Build a daily 15-min walking habit", "Include fish or nuts 3x per week"]
        }
    },
    {
        "pillar": "drivers",
        "score_min": 40,
        "score_max": 65,
        "severity": "medium",
        "ja": {
            "title": "運動と食事のバランスを改善しましょう",
            "body": "生活習慣はある程度整っていますが、さらに伸ばせます。有酸素運動の時間を週150分を目標に増やし、地中海食を意識した食事にしましょう。",
            "actions": ["週3回の有酸素運動（30分）", "野菜・果物を1日5皿分摂取", "友人や家族との質の高い会話を週3回以上"]
        },
        "en": {
            "title": "Balance exercise and diet",
            "body": "Your lifestyle habits are decent but can improve. Aim for 150 min/week of aerobic exercise and adopt a Mediterranean-style diet.",
            "actions": ["3x/week aerobic exercise (30 min)", "5 servings of vegetables/fruit daily", "3+ quality social conversations per week"]
        }
    },
    {
        "pillar": "drivers",
        "score_min": 65,
        "severity": "low",
        "ja": {
            "title": "良い生活習慣を維持しています",
            "body": "Brain Capital Driversは良好です。現在の習慣を継続しながら、ストレス管理（マインドフルネス・自然散策）も取り入れてみましょう。",
            "actions": ["週1回の自然の中での散歩", "マインドフルネス瞑想10分/日", "睡眠の質を記録・最適化"]
        },
        "en": {
            "title": "Excellent lifestyle habits",
            "body": "Your Brain Capital Drivers score is great. Continue your current habits and consider adding stress management like mindfulness or nature walks.",
            "actions": ["Weekly walk in nature", "10 min mindfulness meditation daily", "Track and optimize sleep quality"]
        }
    },
    # --- Pillar 2: Brain Health ---
    {
        "pillar": "health",
        "score_max": 40,
        "severity": "high",
        "ja": {
            "title": "メンタルヘルスのケアが急務です",
            "body": "Brain Healthスコアが低い状態です。不安や気分の落ち込みを感じているかもしれません。医療専門家への相談を検討しつつ、毎日の小さな達成感を積み重ねましょう。",
            "actions": ["信頼できる人に気持ちを打ち明ける", "医療専門家または産業医への相談", "毎日3つの感謝を書き出す習慣"],
            "disclaimer": "このアドバイスは医療診断ではありません。重篤な場合は医師にご相談ください。"
        },
        "en": {
            "title": "Mental health care is urgent",
            "body": "Your Brain Health score is low. You may be experiencing anxiety or low mood. Consider consulting a healthcare professional while building small daily wins.",
            "actions": ["Share your feelings with someone you trust", "Consult a healthcare professional or EAP", "Write 3 daily gratitudes"],
            "disclaimer": "This advice is not medical diagnosis. Please consult a doctor for serious concerns."
        }
    },
    {
        "pillar": "health",
        "score_min": 40,
        "score_max": 65,
        "severity": "medium",
        "ja": {
            "title": "ストレス管理と回復力を高めましょう",
            "body": "中程度のストレスや疲労が見られます。定期的なリラクゼーション習慣と、睡眠の質改善に取り組みましょう。",
            "actions": ["腹式呼吸・4-7-8呼吸法を日常に", "週末のデジタルデトックス半日", "趣味・クリエイティブ活動を週1回以上"]
        },
        "en": {
            "title": "Improve stress management and recovery",
            "body": "Moderate stress and fatigue are present. Work on regular relaxation habits and sleep quality improvement.",
            "actions": ["Practice diaphragmatic/4-7-8 breathing daily", "Half-day digital detox on weekends", "Hobbies or creative activities 1x/week"]
        }
    },
    {
        "pillar": "health",
        "score_min": 65,
        "severity": "low",
        "ja": {
            "title": "脳の健康状態は良好です",
            "body": "メンタルヘルスと脳の健康は良い状態です。この状態を維持するため、予防的なセルフケアを継続しましょう。",
            "actions": ["定期的なセルフチェックを継続", "社会的つながりを大切に", "新しいことへの挑戦を続ける"]
        },
        "en": {
            "title": "Good brain health status",
            "body": "Your mental health and brain health are in good shape. Continue preventive self-care to maintain this state.",
            "actions": ["Continue regular self-monitoring", "Nurture social connections", "Keep challenging yourself with new things"]
        }
    },
    # --- Pillar 3: Brain Skills ---
    {
        "pillar": "skills",
        "score_max": 40,
        "severity": "high",
        "ja": {
            "title": "認知・非認知スキルのトレーニングを始めましょう",
            "body": "Brain Skillsスコアが低めです。毎日の読書、パズル、新しい言語や楽器の学習が脳の可塑性を高めます。",
            "actions": ["毎日20分の読書（新ジャンル）", "週3回の脳トレパズル・数独", "新しいスキル学習（言語・楽器・料理）を開始"]
        },
        "en": {
            "title": "Start training cognitive and soft skills",
            "body": "Your Brain Skills score is low. Daily reading, puzzles, and learning new languages or instruments enhance brain plasticity.",
            "actions": ["20 min daily reading (new genre)", "Brain puzzles/Sudoku 3x/week", "Start learning a new skill (language, instrument, cooking)"]
        }
    },
    {
        "pillar": "skills",
        "score_min": 40,
        "score_max": 65,
        "severity": "medium",
        "ja": {
            "title": "認知スキルをさらに伸ばしましょう",
            "body": "スキルは平均的です。集中力と記憶力を高めるため、マインドフルネス、ポモドーロテクニック、睡眠前の復習を取り入れてみましょう。",
            "actions": ["ポモドーロテクニックで集中力維持", "就寝前に学習内容を振り返る", "創造的な問題解決を要する趣味を持つ"]
        },
        "en": {
            "title": "Level up your cognitive skills",
            "body": "Skills are average. To boost concentration and memory, try mindfulness, the Pomodoro technique, and pre-sleep review.",
            "actions": ["Use Pomodoro technique to maintain focus", "Review learning before bed", "Have a hobby requiring creative problem-solving"]
        }
    },
    {
        "pillar": "skills",
        "score_min": 65,
        "severity": "low",
        "ja": {
            "title": "高い認知スキルを維持しています",
            "body": "Brain Skillsは良好です。さらなる成長のため、新しい分野への越境学習や、他者へのコーチング・メンタリングを試みましょう。",
            "actions": ["異分野のオンラインコース受講", "読書サークルや学習グループへの参加", "後輩や他者への知識共有・メンタリング"]
        },
        "en": {
            "title": "High cognitive skills maintained",
            "body": "Your Brain Skills are excellent. For further growth, try cross-domain learning or coaching and mentoring others.",
            "actions": ["Take an online course in a new field", "Join a book club or learning group", "Share knowledge or mentor others"]
        }
    },
]


def get_suggestions(pillar: str, score: float, lang: str = "ja") -> dict:
    """Get suggestions for a given pillar and score."""
    for suggestion in SUGGESTIONS:
        if suggestion["pillar"] != pillar:
            continue
        score_min = suggestion.get("score_min", 0)
        score_max = suggestion.get("score_max", 100)
        if score_min <= score <= score_max:
            return {
                "pillar": pillar,
                "score": score,
                "severity": suggestion["severity"],
                **suggestion.get(lang, suggestion.get("ja", {}))
            }
    return {}


def get_all_suggestions(
    drivers: float, health: float, skills: float, lang: str = "ja"
) -> list:
    result = []
    for pillar, score in [("drivers", drivers), ("health", health), ("skills", skills)]:
        s = get_suggestions(pillar, score, lang)
        if s:
            result.append(s)
    return result
