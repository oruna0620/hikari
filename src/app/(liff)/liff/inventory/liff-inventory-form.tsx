import s from "../_components/liff.module.css";
import { submitMovement } from "./actions";

type ProductInfo = {
  id: string;
  productCode: string | null;
  name: string;
  modelNumber: string | null;
  unit: string;
};

type InventoryInfo = {
  id: string;
  currentStock: number;
  minimumStock: number;
};

export function LiffInventoryForm({
  product,
  inventory,
  code,
  error,
  success,
}: {
  product: ProductInfo;
  inventory: InventoryInfo | null;
  code: string;
  error?: string;
  success?: string;
}) {
  const stockStatus = !inventory
    ? ""
    : inventory.currentStock <= 0
      ? "out"
      : inventory.currentStock <= inventory.minimumStock
        ? "low"
        : "ok";

  return (
    <div className={s.page}>
      <div className={s.heroHeader}>
        <div className={s.heroIcon}>📦</div>
        <h1 className={s.heroTitle}>在庫操作</h1>
      </div>

      <div className={s.body}>
        {error && (
          <div className={s.toast + " " + s.toastError}>
            <span className={s.toastIcon}>⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div className={s.toast + " " + s.toastSuccess}>
            <span className={s.toastIcon}>✅</span>
            {success}
          </div>
        )}

        <div className={s.productCard}>
          <div className={s.productName}>{product.name}</div>
          {(product.productCode || product.modelNumber) && (
            <div className={s.productMeta}>
              {product.productCode && (
                <span className={s.badge}>{product.productCode}</span>
              )}
              {product.modelNumber && (
                <span className={s.badgeMuted}>{product.modelNumber}</span>
              )}
            </div>
          )}
        </div>

        {inventory && (
          <div className={s.stockRow}>
            <div
              className={
                s.stockBox +
                " " +
                (stockStatus === "out"
                  ? s.stockBoxDanger
                  : stockStatus === "low"
                    ? s.stockBoxWarn
                    : s.stockBoxGood)
              }
            >
              <div className={s.stockBoxLabel}>現在庫</div>
              <div className={s.stockBoxNum}>
                {inventory.currentStock}
                <span className={s.stockBoxUnit}>{product.unit}</span>
              </div>
            </div>
            <div className={s.stockBox}>
              <div className={s.stockBoxLabel}>最低在庫</div>
              <div className={s.stockBoxNum}>
                {inventory.minimumStock}
                <span className={s.stockBoxUnit}>{product.unit}</span>
              </div>
            </div>
          </div>
        )}

        <form action={submitMovement}>
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="code" value={code} />

          <div className={s.section}>
            <div className={s.sectionLabel}>操作種別</div>
            <div className={s.typeGrid}>
              <label className={s.typeCard}>
                <input
                  type="radio"
                  name="type"
                  value="in"
                  defaultChecked
                  className={s.typeRadioInput}
                />
                <span className={s.typeCardInner + " " + s.typeCardIn}>
                  <span className={s.typeEmoji}>📥</span>
                  <span className={s.typeText}>入庫</span>
                </span>
              </label>
              <label className={s.typeCard}>
                <input
                  type="radio"
                  name="type"
                  value="out"
                  className={s.typeRadioInput}
                />
                <span className={s.typeCardInner + " " + s.typeCardOut}>
                  <span className={s.typeEmoji}>📤</span>
                  <span className={s.typeText}>出庫</span>
                </span>
              </label>
              <label className={s.typeCard}>
                <input
                  type="radio"
                  name="type"
                  value="adjust"
                  className={s.typeRadioInput}
                />
                <span className={s.typeCardInner + " " + s.typeCardAdjust}>
                  <span className={s.typeEmoji}>📋</span>
                  <span className={s.typeText}>棚卸</span>
                </span>
              </label>
            </div>
          </div>

          <div className={s.section}>
            <label className={s.sectionLabel} htmlFor="quantity">
              数量
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              className={s.inputPop}
              defaultValue="1"
              min="1"
            />
          </div>

          <div className={s.section}>
            <label className={s.sectionLabel} htmlFor="notes">
              メモ
            </label>
            <textarea
              id="notes"
              name="notes"
              className={s.textareaPop}
              placeholder="補足事項があれば入力..."
            />
          </div>

          <button
            type="submit"
            className={s.submitBtn}
            disabled={!inventory}
          >
            登録する
          </button>
        </form>
      </div>
    </div>
  );
}
