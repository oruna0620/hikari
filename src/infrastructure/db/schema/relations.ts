import { relations } from "drizzle-orm";
import { users } from "./common/users";
import { products } from "./common/products";
import { productSearchKeywords } from "./common/product-search-keywords";
import { customers } from "./common/customers";
import { lineUserMappings } from "./common/line-user-mappings";
import { estimates } from "./estimate/estimates";
import { estimateItems } from "./estimate/estimate-items";
import { uploadedDocuments } from "./estimate/uploaded-documents";
import { invoices } from "./cashflow/invoices";
import { invoiceItems } from "./cashflow/invoice-items";
import { payments } from "./cashflow/payments";
import { expenses } from "./cashflow/expenses";
import { inventories } from "./inventory/inventories";
import { inventoryHistories } from "./inventory/inventory-histories";
import { qrCodes } from "./inventory/qr-codes";

// ── users ──
export const usersRelations = relations(users, ({ many }) => ({
  estimates: many(estimates),
  uploadedDocuments: many(uploadedDocuments),
  inventories: many(inventories),
  inventoryHistories: many(inventoryHistories),
  lineUserMappings: many(lineUserMappings),
  invoicesCreated: many(invoices),
}));

// ── products ──
export const productsRelations = relations(products, ({ many, one }) => ({
  searchKeywords: many(productSearchKeywords),
  estimateItems: many(estimateItems),
  inventory: one(inventories),
  inventoryHistories: many(inventoryHistories),
  qrCodes: many(qrCodes),
}));

// ── product_search_keywords ──
export const productSearchKeywordsRelations = relations(
  productSearchKeywords,
  ({ one }) => ({
    product: one(products, {
      fields: [productSearchKeywords.productId],
      references: [products.id],
    }),
  })
);

// ── customers ──
export const customersRelations = relations(customers, ({ many }) => ({
  estimates: many(estimates),
  invoices: many(invoices),
  payments: many(payments),
  expenses: many(expenses),
}));

// ── uploaded_documents ──
export const uploadedDocumentsRelations = relations(
  uploadedDocuments,
  ({ one }) => ({
    uploadedByUser: one(users, {
      fields: [uploadedDocuments.uploadedBy],
      references: [users.id],
    }),
    estimate: one(estimates, {
      fields: [uploadedDocuments.estimateId],
      references: [estimates.id],
    }),
    invoice: one(invoices, {
      fields: [uploadedDocuments.invoiceId],
      references: [invoices.id],
    }),
  })
);

// ── estimates ──
export const estimatesRelations = relations(estimates, ({ one, many }) => ({
  customer: one(customers, {
    fields: [estimates.customerId],
    references: [customers.id],
  }),
  createdByUser: one(users, {
    fields: [estimates.createdBy],
    references: [users.id],
  }),
  uploadedDocument: one(uploadedDocuments, {
    fields: [estimates.uploadedDocumentId],
    references: [uploadedDocuments.id],
  }),
  items: many(estimateItems),
  invoices: many(invoices),
  attachments: many(uploadedDocuments),
}));

// ── estimate_items ──
export const estimateItemsRelations = relations(estimateItems, ({ one }) => ({
  estimate: one(estimates, {
    fields: [estimateItems.estimateId],
    references: [estimates.id],
  }),
  product: one(products, {
    fields: [estimateItems.productId],
    references: [products.id],
  }),
}));

// ── invoices ──
export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  estimate: one(estimates, {
    fields: [invoices.estimateId],
    references: [estimates.id],
  }),
  createdByUser: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
  attachments: many(uploadedDocuments),
}));

// ── invoice_items ──
export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

// ── payments ──
export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
}));

// ── expenses ──
export const expensesRelations = relations(expenses, ({ one }) => ({
  customer: one(customers, {
    fields: [expenses.customerId],
    references: [customers.id],
  }),
}));

// ── inventories ──
export const inventoriesRelations = relations(
  inventories,
  ({ one, many }) => ({
    product: one(products, {
      fields: [inventories.productId],
      references: [products.id],
    }),
    lastUpdatedByUser: one(users, {
      fields: [inventories.lastUpdatedBy],
      references: [users.id],
    }),
    histories: many(inventoryHistories),
  })
);

// ── inventory_histories ──
export const inventoryHistoriesRelations = relations(
  inventoryHistories,
  ({ one }) => ({
    product: one(products, {
      fields: [inventoryHistories.productId],
      references: [products.id],
    }),
    inventory: one(inventories, {
      fields: [inventoryHistories.inventoryId],
      references: [inventories.id],
    }),
    operatedByUser: one(users, {
      fields: [inventoryHistories.operatedBy],
      references: [users.id],
    }),
  })
);

// ── qr_codes ──
export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  product: one(products, {
    fields: [qrCodes.productId],
    references: [products.id],
  }),
}));

// ── line_user_mappings ──
export const lineUserMappingsRelations = relations(
  lineUserMappings,
  ({ one }) => ({
    user: one(users, {
      fields: [lineUserMappings.userId],
      references: [users.id],
    }),
  })
);
