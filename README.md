# SULE WORKSTATION BOX

SULEBOX のものづくり用ワークステーション。チョコミントの街から、よく使う計算ツールにすぐ飛べます。

| キー | ツール | 中身 |
|---|---|---|
| 1 | 単位変換 | 長さ・質量・力・トルク・圧力・温度・角度・速度・回転（`s/60°` のサーボ速度表記も）。入力欄は `3/8`・`1 1/2` などの式もOK |
| 2 | ネジ | M2〜M12 の早見（下穴・ばか穴・ざぐり・六角レンチ・ナット）、種類別寸法と図面、タップ下穴表。3D プリント用の穴補正つき |
| 3 | はめあい | ISO 286 / JIS B 0401 の規則から公差域を計算（〜500 mm、IT5〜IT11）。公差域の図つき |
| 4 | 電卓 | 関数電卓。キーボード操作・途中結果のプレビュー・履歴 |
| 5 | 翻訳 | Claude Haiku 5.5 でストリーミング翻訳。トーン（自然／ていねい／カジュアル／技術文書）切り替え |
| 6 | サーボ | PCA9685 の角度 ⇄ パルス幅 ⇄ tick、Arduino / MicroPython のコード生成。KRS（ICS）のポジション値 |
| 7 | 回路 | 分圧（E24 の組み合わせ探索）、LED 抵抗、カラーコード、オームの法則 |

どのページでも <kbd>⌘K</kbd>（Windows は <kbd>Ctrl K</kbd>）または <kbd>/</kbd> で検索パレットが開きます。
`3/8*25.4` のような計算、`M3`（ネジ早見へ）、`H7/g6 10`（はめあいへ）、`t 翻訳したい文` も使えます。

テーマ（チョコミント／チョコバナナ／ストロベリーチョコ）と昼夜モード（自動=18時〜6時は夜／昼／夜）は右上で切り替え。選んだものは全ページ共通で保存されます。

## ローカルで動かす

Node.js 20.12 以上が必要です。

```bash
npm install
npm run dev
```

http://localhost:3000 で開きます。翻訳を使うときは、プロジェクト直下の `.env` に API キーを書いてから `npm run dev` し直してください。

```
ANTHROPIC_API_KEY=sk-ant-...
```

`.env` は `.gitignore` 済みなので GitHub には上がりません（ひな形は `.env.example`）。

## Vercel にデプロイ

1. GitHub のリポジトリを Vercel に接続（Framework Preset は **Other**、Build Command は空のまま）
2. Project Settings → Environment Variables に `ANTHROPIC_API_KEY` を追加
3. 再デプロイ

静的ページはそのまま配信され、`api/translate.js` が Vercel Functions として動きます。旧ページの URL（`unitconverter.html` など）は `vercel.json` で新しいページへリダイレクトします。

### 翻訳 API を他人に使われたくないとき

`TRANSLATE_PASSCODE` を環境変数に設定すると、翻訳ページで一度だけパスコードを聞かれるようになります（ブラウザに保存）。
API 側でも、他サイトのページからの呼び出しは拒否し、1 回 8,000 文字までに制限しています。

## 構成

```
index.html            ホーム（街の背景・時計・ツールのドック）
units.html ほか       各ツール（素の HTML + JS、ビルド不要）
api/translate.js      翻訳 API（Claude Haiku 5.5、NDJSON ストリーミング）
assets/css/app.css    デザインシステム（テーマ × 昼夜のトークン、部品）
assets/js/core.js     テーマ・昼夜・ヘッダー・⌘K パレット・コピーなど共通処理
assets/js/expr.js     数式パーサ（eval を使わない）
assets/js/iso286.js   はめあい公差の計算
assets/js/circuit.js  抵抗・カラーコード・分圧の計算
assets/img/           最適化済みの画像（WebP）
_source/              元画像（デプロイ対象外）
tests/                計算ロジックのテスト（npm test）
dev-server.mjs        ローカル開発サーバー（デプロイ対象外）
```

## 注意

ネジ・公差のデータは JIS / ISO 規格に基づく代表値です。実際の加工は図面とメーカーの資料に従ってください。
