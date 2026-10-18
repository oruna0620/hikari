-- ============================================================
-- 株式会社光 業務システム — 初期スキーマ
-- ============================================================
-- 対象: PostgreSQL 15+
-- 内容: 全16テーブル + インデックス + トリガー
-- ============================================================

BEGIN;

-- =========================
-- 拡張機能
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- 部分一致検索用

-- =========================
-- updated_at 自動更新トリガー関数
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 共通
-- ============================================================

-- 1. users — ログインユーザー
CREATE TABLE users (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(100) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'staff',
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. company_settings — 自社情報
CREATE TABLE company_settings (
    id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name         VARCHAR(200) NOT NULL,
    postal_code          VARCHAR(10),
    address              TEXT,
    phone                VARCHAR(20),
    fax                  VARCHAR(20),
    email                VARCHAR(200),
    registration_number  VARCHAR(50),
    logo_url             TEXT,
    bank_info            TEXT,
    estimate_notes       TEXT,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_company_settings_updated_at
    BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 商品マスタ
-- ============================================================

-- 3. products — 商品マスタ
CREATE TABLE products (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code  VARCHAR(50)   UNIQUE,
    name          VARCHAR(300)  NOT NULL,
    model_number  VARCHAR(100),
    manufacturer  VARCHAR(200),
    unit_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
    unit          VARCHAR(20)   NOT NULL DEFAULT '個',
    category      VARCHAR(100),
    description   TEXT,
    is_deleted    BOOLEAN       NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 部分一致検索用インデックス (pg_trgm)
CREATE INDEX idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_product_code_trgm ON products USING gin (product_code gin_trgm_ops);
CREATE INDEX idx_products_model_number_trgm ON products USING gin (model_number gin_trgm_ops);
CREATE INDEX idx_products_manufacturer_trgm ON products USING gin (manufacturer gin_trgm_ops);

-- 4. product_search_keywords — 商品の略称・検索ワード
CREATE TABLE product_search_keywords (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID         NOT NULL REFERENCES products(id),
    keyword     VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_search_keywords_product_id ON product_search_keywords(product_id);
CREATE INDEX idx_product_search_keywords_keyword_trgm ON product_search_keywords USING gin (keyword gin_trgm_ops);

-- ============================================================
-- 顧客
-- ============================================================

-- 8. customers — 顧客マスタ
CREATE TABLE customers (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name        VARCHAR(200),
    customer_name       VARCHAR(200) NOT NULL,
    contact_person      VARCHAR(100),
    phone               VARCHAR(20),
    email               VARCHAR(200),
    postal_code         VARCHAR(10),
    address             TEXT,
    billing_postal_code VARCHAR(10),
    billing_address     TEXT,
    notes               TEXT,
    is_deleted          BOOLEAN      NOT NULL DEFAULT false,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 見積もり
-- ============================================================

-- 7. uploaded_documents — アップロード画像/PDF・AI読み取り結果
--    (estimates より先に作成: estimates が FK 参照するため)
CREATE TABLE uploaded_documents (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name         VARCHAR(300) NOT NULL,
    file_url          TEXT         NOT NULL,
    file_type         VARCHAR(10)  NOT NULL,
    ai_raw_response   JSONB,
    ai_extracted_data JSONB,
    status            VARCHAR(20)  NOT NULL DEFAULT 'pending',
    uploaded_by       UUID         REFERENCES users(id),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 5. estimates — 見積書ヘッダ
CREATE TABLE estimates (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_number      VARCHAR(50)   NOT NULL UNIQUE,
    customer_id          UUID          REFERENCES customers(id),
    customer_name        VARCHAR(200),
    title                VARCHAR(300),
    issue_date           DATE          NOT NULL DEFAULT CURRENT_DATE,
    expiry_date          DATE,
    subtotal             NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_rate             NUMERIC(5,2)  NOT NULL DEFAULT 10.00,
    tax_amount           NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_amount         NUMERIC(14,2) NOT NULL DEFAULT 0,
    notes                TEXT,
    status               VARCHAR(20)   NOT NULL DEFAULT 'draft',
    source_type          VARCHAR(20)   NOT NULL DEFAULT 'manual',
    uploaded_document_id UUID          REFERENCES uploaded_documents(id),
    created_by           UUID          REFERENCES users(id),
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_estimates_updated_at
    BEFORE UPDATE ON estimates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_estimates_customer_id ON estimates(customer_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_issue_date ON estimates(issue_date);

-- 6. estimate_items — 見積書明細
CREATE TABLE estimate_items (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    estimate_id  UUID          NOT NULL REFERENCES estimates(id),
    sort_order   INTEGER       NOT NULL DEFAULT 0,
    product_id   UUID          REFERENCES products(id),
    item_name    VARCHAR(300)  NOT NULL,
    model_number VARCHAR(100),
    quantity     NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit         VARCHAR(20)   NOT NULL DEFAULT '個',
    unit_price   NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_estimate_items_estimate_id ON estimate_items(estimate_id);

-- ============================================================
-- 請求・入出金
-- ============================================================

-- 9. invoices — 請求書
CREATE TABLE invoices (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number  VARCHAR(50)   NOT NULL UNIQUE,
    customer_id     UUID          NOT NULL REFERENCES customers(id),
    estimate_id     UUID          REFERENCES estimates(id),
    title           VARCHAR(300),
    issue_date      DATE          NOT NULL,
    due_date        DATE,
    subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_rate        NUMERIC(5,2)  NOT NULL DEFAULT 10.00,
    tax_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
    paid_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
    payment_status  VARCHAR(20)   NOT NULL DEFAULT 'unpaid',
    file_url        TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- 10. invoice_items — 請求書明細
CREATE TABLE invoice_items (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id  UUID          NOT NULL REFERENCES invoices(id),
    sort_order  INTEGER       NOT NULL DEFAULT 0,
    item_name   VARCHAR(300)  NOT NULL,
    quantity    NUMERIC(10,2) NOT NULL DEFAULT 1,
    unit        VARCHAR(20)   NOT NULL DEFAULT '個',
    unit_price  NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 11. payments — 入金記録
CREATE TABLE payments (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID          NOT NULL REFERENCES invoices(id),
    customer_id     UUID          NOT NULL REFERENCES customers(id),
    expected_date   DATE,
    expected_amount NUMERIC(14,2),
    actual_date     DATE,
    actual_amount   NUMERIC(14,2),
    payment_method  VARCHAR(50),
    notes           TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);

-- 12. expenses — 出金・支払い
CREATE TABLE expenses (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    payee_name      VARCHAR(200)  NOT NULL,
    customer_id     UUID          REFERENCES customers(id),
    category        VARCHAR(100),
    title           VARCHAR(300),
    expected_date   DATE,
    expected_amount NUMERIC(14,2),
    actual_date     DATE,
    actual_amount   NUMERIC(14,2),
    payment_status  VARCHAR(20)   NOT NULL DEFAULT 'unpaid',
    payment_method  VARCHAR(50),
    file_url        TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_expenses_customer_id ON expenses(customer_id);
CREATE INDEX idx_expenses_payment_status ON expenses(payment_status);

-- ============================================================
-- 在庫管理
-- ============================================================

-- 13. inventories — 商品別の現在庫
CREATE TABLE inventories (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID        NOT NULL UNIQUE REFERENCES products(id),
    current_stock   INTEGER     NOT NULL DEFAULT 0,
    minimum_stock   INTEGER     NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_updated_by UUID        REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. inventory_histories — 入出庫履歴
CREATE TABLE inventory_histories (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id   UUID        NOT NULL REFERENCES products(id),
    inventory_id UUID        NOT NULL REFERENCES inventories(id),
    type         VARCHAR(10) NOT NULL,
    quantity     INTEGER     NOT NULL,
    stock_after  INTEGER     NOT NULL,
    operated_by  UUID        NOT NULL REFERENCES users(id),
    operated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes        TEXT,
    is_cancelled BOOLEAN     NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_histories_product_id ON inventory_histories(product_id);
CREATE INDEX idx_inventory_histories_inventory_id ON inventory_histories(inventory_id);
CREATE INDEX idx_inventory_histories_operated_at ON inventory_histories(operated_at);

-- 15. qr_codes — QRコードと商品の紐付け
CREATE TABLE qr_codes (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID         NOT NULL REFERENCES products(id),
    code       VARCHAR(100) NOT NULL UNIQUE,
    label      VARCHAR(200),
    is_active  BOOLEAN      NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_qr_codes_product_id ON qr_codes(product_id);

-- ============================================================
-- システム
-- ============================================================

-- 16. tax_settings — 消費税設定
CREATE TABLE tax_settings (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    rounding_method  VARCHAR(10)  NOT NULL DEFAULT 'floor',
    display_mode     VARCHAR(20)  NOT NULL DEFAULT 'exclusive',
    effective_from   DATE         NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_tax_settings_effective_from ON tax_settings(effective_from);

COMMIT;
