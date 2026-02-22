# Personal Brain Capital Monitor (PBCM)

個人の脳の健康・スキルを自己報告で計測・可視化・改善するMVPアプリ。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript + Vite + Tailwind CSS |
| グラフ | Recharts (レーダー・折れ線・棒) |
| 状態管理 | Zustand (persist対応) |
| バックエンド | Python FastAPI + SQLAlchemy |
| データベース | SQLite (MVP) → PostgreSQL (本番) |
| 認証 | JWT (jose) + bcrypt |
| PDF | ReportLab |
| PWA | vite-plugin-pwa |

## 機能一覧

- **認証**: メール/パスワード + ゲストモード
- **3柱測定**:
  - Pillar 1: Brain Capital Drivers（週次: 生活習慣6問）
  - Pillar 2: Brain Health（月次: PHQ-9/GAD-7簡易版8問）
  - Pillar 3: Brain Skills（月次: 自己報告5問 + 認知テスト3種）
- **認知テスト**: 注意力（矢印タスク）・記憶（数字記憶）・柔軟性（Stroop）
- **ダッシュボード**: レーダー/折れ線/棒グラフ、同年代ベンチマーク比較
- **改善提案**: ルールベース静的アドバイス（日本語/英語）
- **PDFレポート**: スコア推移 + 改善提案
- **多言語**: 日本語/英語切替
- **PWA対応**: オフライン基本機能、ホーム画面追加可能

## セットアップ

### クイックスタート

```bash
./start.sh
```

### 手動セットアップ

#### バックエンド

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# http://localhost:8000/docs でAPIドキュメント確認
```

#### フロントエンド

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

## スコアリング

```
Pillar 1 (Drivers):  30%
Pillar 2 (Health):   40%
Pillar 3 (Skills):   30%
--------------------------
Total Brain Capital Score = Drivers×0.3 + Health×0.4 + Skills×0.3
```

| スコア | 評価 |
|-------|------|
| 80-100 | 優秀 |
| 65-79  | 良好 |
| 50-64  | 普通 |
| 35-49  | 要改善 |
| 0-34   | 要注意 |

## プロジェクト構造

```
braincapital_app/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── models.py            # DB models
│   ├── database.py          # DB connection
│   ├── auth.py              # JWT auth
│   ├── scoring.py           # スコア計算ロジック
│   ├── suggestions_data.py  # 静的提案データ
│   └── routers/             # API routers
│       ├── auth.py
│       ├── surveys.py
│       ├── tests.py
│       ├── suggestions.py
│       └── reports.py
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx    # メインダッシュボード
│   │   │   ├── Survey.tsx       # サーベイ (週次/月次/ベースライン)
│   │   │   ├── CognitiveTest.tsx # 認知テスト
│   │   │   ├── Suggestions.tsx  # 改善提案
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Profile.tsx
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── ScoreGauge.tsx   # 円形ゲージ
│   │   │   ├── LikertScale.tsx  # リッカート尺度
│   │   │   └── ProgressBar.tsx
│   │   ├── store/authStore.ts   # Zustand store
│   │   ├── utils/api.ts         # Axios API client
│   │   └── i18n/               # 多言語対応
└── start.sh
```

## 免責事項

このアプリは個人の自己改善目的のみに使用されます。医療診断・医療行為ではありません。
