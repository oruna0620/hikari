# データベース設計書 — 株式会社光 業務システム

## 概要

株式会社光向け3つの業務システム（LINE見積もり・入出金管理・QR在庫管理）の共通データベース設計。
全システムが商品マスタを共有し、PostgreSQL 上の単一データベースとして構築する。

- **RDBMS**: PostgreSQL 15+
- **拡張機能**: `pgcrypto`（UUID生成）, `pg_trgm`（部分一致検索）

---

## テーブル一覧（16テーブル）

| # | テーブル名 | 区分 | 説明 |
|---|---|---|---|
| 1 | users | 共通 | ログインユーザー（管理者/一般社員） |
| 2 | company_settings | 共通 | 自社情報（見積書印字用） |
| 3 | products | 商品マスタ | 商品マスタ |
| 4 | product_search_keywords | 商品マスタ | 商品の略称・検索ワード |
| 5 | estimates | 見積もり | 見積書ヘッダ |
| 6 | estimate_items | 見積もり | 見積書明細 |
| 7 | uploaded_documents | 見積もり | アップロード画像/PDF・AI読み取り結果 |
| 8 | customers | 顧客・入出金 | 顧客マスタ |
| 9 | invoices | 顧客・入出金 | 請求書 |
| 10 | invoice_items | 顧客・入出金 | 請求書明細 |
| 11 | payments | 顧客・入出金 | 入金記録 |
| 12 | expenses | 顧客・入出金 | 出金・支払い |
| 13 | inventories | 在庫管理 | 商品別の現在庫 |
| 14 | inventory_histories | 在庫管理 | 入出庫履歴 |
| 15 | qr_codes | 在庫管理 | QRコードと商品の紐付け |
| 16 | tax_settings | システム | 消費税設定 |

---

## テーブル詳細

### 1. users

ログインユーザー（管理者/一般社員）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| username | VARCHAR(100) | NOT NULL, UNIQUE | ログインID |
| password_hash | VARCHAR(255) | NOT NULL | bcryptハッシュ |
| display_name | VARCHAR(100) | NOT NULL | 表示名（履歴記録用） |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'staff' | 'admin' / 'staff' |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 有効/無効 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | トリガーで自動更新 |

---

### 2. company_settings

自社情報（見積書・請求書の印字用）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| company_name | VARCHAR(200) | NOT NULL | 社名 |
| postal_code | VARCHAR(10) | | 郵便番号 |
| address | TEXT | | 住所 |
| phone | VARCHAR(20) | | 電話番号 |
| fax | VARCHAR(20) | | FAX |
| email | VARCHAR(200) | | メール |
| registration_number | VARCHAR(50) | | 適格請求書発行事業者番号 |
| logo_url | TEXT | | ロゴ画像パス |
| bank_info | TEXT | | 振込先情報 |
| estimate_notes | TEXT | | 見積書備考デフォルト |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | トリガーで自動更新 |

---

### 3. products

商品マスタ（見積もり・在庫管理で共有）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| product_code | VARCHAR(50) | UNIQUE | 商品コード |
| name | VARCHAR(300) | NOT NULL | 商品名 |
| model_number | VARCHAR(100) | | 型番 |
| manufacturer | VARCHAR(200) | | メーカー |
| unit_price | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | 単価 |
| unit | VARCHAR(20) | NOT NULL, DEFAULT '個' | 単位（個,枚,台,式 等） |
| category | VARCHAR(100) | | カテゴリ |
| description | TEXT | | 説明 |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | 論理削除 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | トリガーで自動更新 |

**インデックス:**
- `name` — GIN (pg_trgm) 部分一致検索
- `product_code` — GIN (pg_trgm) 部分一致検索
- `model_number` — GIN (pg_trgm) 部分一致検索
- `manufacturer` — GIN (pg_trgm) 部分一致検索

---

### 4. product_search_keywords

商品の略称・検索ワード（LINE検索時に横断検索）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| product_id | UUID | FK → products(id), NOT NULL | |
| keyword | VARCHAR(200) | NOT NULL | 略称・検索ワード |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス:**
- `product_id` — B-tree
- `keyword` — GIN (pg_trgm) 部分一致検索

---

### 5. estimates

見積書ヘッダ

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| estimate_number | VARCHAR(50) | NOT NULL, UNIQUE | 見積番号 |
| customer_id | UUID | FK → customers(id) | 顧客（任意） |
| customer_name | VARCHAR(200) | | 宛名（顧客未登録時） |
| title | VARCHAR(300) | | 件名 |
| issue_date | DATE | NOT NULL, DEFAULT CURRENT_DATE | 発行日 |
| expiry_date | DATE | | 有効期限 |
| subtotal | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 小計 |
| tax_rate | NUMERIC(5,2) | NOT NULL, DEFAULT 10.00 | 税率 |
| tax_amount | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 消費税額 |
| total_amount | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 合計金額 |
| notes | TEXT | | 備考 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'draft' | draft/sent/accepted/rejected |
| source_type | VARCHAR(20) | NOT NULL, DEFAULT 'manual' | manual/line/upload |
| uploaded_document_id | UUID | FK → uploaded_documents(id) | AI変換元 |
| created_by | UUID | FK → users(id) | 作成者 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | トリガーで自動更新 |

**インデックス:**
- `customer_id` — B-tree
- `status` — B-tree
- `issue_date` — B-tree

---

### 6. estimate_items

見積書明細

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| estimate_id | UUID | FK → estimates(id), NOT NULL | |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 表示順 |
| product_id | UUID | FK → products(id) | 商品マスタ参照（任意） |
| item_name | VARCHAR(300) | NOT NULL | 品名（手入力・マスタ外対応） |
| model_number | VARCHAR(100) | | 型番 |
| quantity | NUMERIC(10,2) | NOT NULL, DEFAULT 1 | 数量 |
| unit | VARCHAR(20) | NOT NULL, DEFAULT '個' | 単位 |
| unit_price | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | 単価 |
| amount | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 金額（数量×単価） |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス:**
- `estimate_id` — B-tree

---

### 7. uploaded_documents

アップロード画像/PDF・AI読み取り結果

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| file_name | VARCHAR(300) | NOT NULL | 元ファイル名 |
| file_url | TEXT | NOT NULL | Cloud Storageパス |
| file_type | VARCHAR(10) | NOT NULL | 'image' / 'pdf' |
| ai_raw_response | JSONB | | AIの生レスポンス |
| ai_extracted_data | JSONB | | 抽出された構造化データ |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | pending/processed/failed |
| uploaded_by | UUID | FK → users(id) | |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### 8. customers

顧客マスタ

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| company_name | VARCHAR(200) | | 会社名 |
| customer_name | VARCHAR(200) | NOT NULL | 顧客名 |
| contact_person | VARCHAR(100) | | 担当者名 |
| phone | VARCHAR(20) | | 電話番号 |
| email | VARCHAR(200) | | メールアドレス |
| postal_code | VARCHAR(10) | | 郵便番号 |
| address | TEXT | | 住所 |
| billing_postal_code | VARCHAR(10) | | 請求先郵便番号 |
| billing_address | TEXT | | 請求先住所 |
| notes | TEXT | | メモ |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | 論理削除 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | トリガーで自動更新 |

---

### 9. invoices

請求書

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| invoice_number | VARCHAR(50) | NOT NULL, UNIQUE | 請求書番号 |
| customer_id | UUID | FK → customers(id), NOT NULL | 顧客 |
| estimate_id | UUID | FK → estimates(id) | 元見積書（任意） |
| title | VARCHAR(300) | | 件名 |
| issue_date | DATE | NOT NULL | 発行日 |
| due_date | DATE | | 支払期限 |
| subtotal | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 小計 |
| tax_rate | NUMERIC(5,2) | NOT NULL, DEFAULT 10.00 | 税率 |
| tax_amount | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 消費税額 |
| total_amount | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 合計金額 |
| paid_amount | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 入金済み金額 |
| payment_status | VARCHAR(20) | NOT NULL, DEFAULT 'unpaid' | unpaid/partial/paid |
| file_url | TEXT | | PDF/画像パス |
| notes | TEXT | | 備考 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | トリガーで自動更新 |

**インデックス:**
- `customer_id` — B-tree
- `payment_status` — B-tree
- `issue_date` — B-tree
- `due_date` — B-tree

---

### 10. invoice_items

請求書明細

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| invoice_id | UUID | FK → invoices(id), NOT NULL | |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | 表示順 |
| item_name | VARCHAR(300) | NOT NULL | 品名 |
| quantity | NUMERIC(10,2) | NOT NULL, DEFAULT 1 | 数量 |
| unit | VARCHAR(20) | NOT NULL, DEFAULT '個' | 単位 |
| unit_price | NUMERIC(12,2) | NOT NULL, DEFAULT 0 | 単価 |
| amount | NUMERIC(14,2) | NOT NULL, DEFAULT 0 | 金額 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス:**
- `invoice_id` — B-tree

---

### 11. payments

入金記録（1つの請求書に対して複数レコード作成可能）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| invoice_id | UUID | FK → invoices(id), NOT NULL | 対象請求書 |
| customer_id | UUID | FK → customers(id), NOT NULL | 顧客 |
| expected_date | DATE | | 入金予定日 |
| expected_amount | NUMERIC(14,2) | | 入金予定金額 |
| actual_date | DATE | | 実際の入金日 |
| actual_amount | NUMERIC(14,2) | | 実際の入金金額 |
| payment_method | VARCHAR(50) | | 振込/現金/その他 |
| notes | TEXT | | 備考 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | トリガーで自動更新 |

**インデックス:**
- `invoice_id` — B-tree
- `customer_id` — B-tree

---

### 12. expenses

出金・支払い

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| payee_name | VARCHAR(200) | NOT NULL | 支払先名 |
| customer_id | UUID | FK → customers(id) | 顧客（任意） |
| category | VARCHAR(100) | | 仕入/外注/経費/その他 |
| title | VARCHAR(300) | | 件名 |
| expected_date | DATE | | 支払予定日 |
| expected_amount | NUMERIC(14,2) | | 支払予定金額 |
| actual_date | DATE | | 実際の支払日 |
| actual_amount | NUMERIC(14,2) | | 実際の支払金額 |
| payment_status | VARCHAR(20) | NOT NULL, DEFAULT 'unpaid' | unpaid/paid |
| payment_method | VARCHAR(50) | | 振込/現金/その他 |
| file_url | TEXT | | 領収書等のファイルパス |
| notes | TEXT | | 備考 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | トリガーで自動更新 |

**インデックス:**
- `customer_id` — B-tree
- `payment_status` — B-tree

---

### 13. inventories

商品別の現在庫（products と 1:1）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| product_id | UUID | FK → products(id), NOT NULL, UNIQUE | 商品（1:1） |
| current_stock | INTEGER | NOT NULL, DEFAULT 0 | 現在庫数 |
| minimum_stock | INTEGER | NOT NULL, DEFAULT 0 | 最低在庫数 |
| last_updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 最終更新日時 |
| last_updated_by | UUID | FK → users(id) | 最終更新者 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

---

### 14. inventory_histories

入出庫履歴

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| product_id | UUID | FK → products(id), NOT NULL | 商品 |
| inventory_id | UUID | FK → inventories(id), NOT NULL | 在庫レコード |
| type | VARCHAR(10) | NOT NULL | 'in'(入庫) / 'out'(出庫) / 'adjust'(調整) |
| quantity | INTEGER | NOT NULL | 数量（正の値） |
| stock_after | INTEGER | NOT NULL | 処理後の在庫数 |
| operated_by | UUID | FK → users(id), NOT NULL | 担当者 |
| operated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | 処理日時 |
| notes | TEXT | | メモ（調整理由等） |
| is_cancelled | BOOLEAN | NOT NULL, DEFAULT false | 取消フラグ |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス:**
- `product_id` — B-tree
- `inventory_id` — B-tree
- `operated_at` — B-tree

---

### 15. qr_codes

QRコードと商品の紐付け（1商品に対して複数QRコード発行可能）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| product_id | UUID | FK → products(id), NOT NULL | 商品 |
| code | VARCHAR(100) | NOT NULL, UNIQUE | QRコードの識別値 |
| label | VARCHAR(200) | | ラベル（設置場所等） |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | 有効/無効 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス:**
- `product_id` — B-tree

---

### 16. tax_settings

消費税設定

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| tax_rate | NUMERIC(5,2) | NOT NULL, DEFAULT 10.00 | 税率(%) |
| rounding_method | VARCHAR(10) | NOT NULL, DEFAULT 'floor' | floor/round/ceil |
| display_mode | VARCHAR(20) | NOT NULL, DEFAULT 'exclusive' | exclusive(税抜)/inclusive(税込) |
| effective_from | DATE | NOT NULL | 適用開始日 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**インデックス:**
- `effective_from` — B-tree

---

## リレーション図

```
users
  |
  +--< estimates (created_by)
  +--< uploaded_documents (uploaded_by)
  +--< inventories (last_updated_by)
  +--< inventory_histories (operated_by)

customers
  |
  +--< estimates (customer_id)
  +--< invoices (customer_id)
  +--< payments (customer_id)
  +--< expenses (customer_id)

products
  |
  +--< product_search_keywords (product_id)
  +--< estimate_items (product_id)
  +---- inventories (product_id) [1:1]
  +--< inventory_histories (product_id)
  +--< qr_codes (product_id)

estimates
  |
  +--< estimate_items (estimate_id)
  +---- uploaded_documents (uploaded_document_id)
  +--< invoices (estimate_id)

invoices
  |
  +--< invoice_items (invoice_id)
  +--< payments (invoice_id)
```

---

## 設計上のポイント

1. **一部入金対応**: payments テーブルで1つの invoice に対して複数レコードを許可。invoices.paid_amount は payments の合計から更新する。
2. **在庫整合性**: inventories.current_stock を持ちつつ、inventory_histories で全履歴を保存。入出庫時はトランザクション内で両方を更新する。
3. **論理削除**: products, customers は is_deleted フラグで論理削除（過去の見積書・履歴との整合性維持）。
4. **見積書の柔軟性**: estimate_items.product_id は任意。マスタにない商品も手入力で追加可能。
5. **QRコード**: 1商品に対して複数QRコード発行可能（商品棚用、商品本体用など）。
6. **検索ワード**: product_search_keywords で商品ごとに複数の略称・検索ワードを登録。LINE検索時に products.name + keywords を横断検索。
7. **消費税**: tax_settings で税率・端数処理を管理。後から設定変更可能。見積書・請求書には発行時の税率を記録。
8. **updated_at 自動更新**: トリガー関数 `update_updated_at()` により、UPDATE 時に自動で現在時刻が設定される。

---

## マイグレーション

| ファイル | 内容 |
|---|---|
| `api/db/migrations/001_initial_schema.sql` | 全テーブル・インデックス・トリガーの作成 |

### 実行方法

```bash
psql -h localhost -U postgres -d hikari -f api/db/migrations/001_initial_schema.sql
```

### 検証

```sql
-- テーブル一覧確認
\dt

-- テーブル数の確認（16テーブル）
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```
