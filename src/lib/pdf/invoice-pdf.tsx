import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { registerFonts } from "./fonts";

registerFonts();

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 9,
    padding: 40,
    color: "#1a1a1a",
  },
  header: {
    textAlign: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 4,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 9,
    color: "#666",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  customerSection: {
    width: "48%",
  },
  companySection: {
    width: "48%",
    textAlign: "right",
  },
  customerName: {
    fontSize: 13,
    fontWeight: 700,
    borderBottom: "1px solid #333",
    paddingBottom: 4,
    marginBottom: 6,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 8,
    color: "#555",
    marginBottom: 2,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f7ff",
    border: "1px solid #0ea5e9",
    borderRadius: 4,
    padding: "10 16",
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 700,
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottom: "1px solid #ccc",
    borderTop: "1px solid #ccc",
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #eee",
    paddingVertical: 5,
  },
  colNo: { width: "8%", textAlign: "center" },
  colName: { width: "37%", paddingLeft: 4 },
  colQty: { width: "12%", textAlign: "right", paddingRight: 4 },
  colUnit: { width: "10%", textAlign: "center" },
  colPrice: { width: "16%", textAlign: "right", paddingRight: 4 },
  colAmount: { width: "17%", textAlign: "right", paddingRight: 4 },
  headerText: {
    fontSize: 7,
    fontWeight: 700,
    color: "#555",
  },
  summarySection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  summaryTable: {
    width: 200,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottom: "1px solid #eee",
  },
  summaryTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderTop: "2px solid #333",
    marginTop: 2,
  },
  paymentSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 6,
  },
  paymentRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  paymentLabel: {
    fontSize: 8,
    color: "#888",
    width: 80,
  },
  paymentValue: {
    fontSize: 9,
  },
  notesSection: {
    marginTop: 8,
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8,
    color: "#555",
    lineHeight: 1.5,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 8,
    color: "#888",
    width: 70,
  },
  metaValue: {
    fontSize: 9,
  },
  bankSection: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#fafafa",
    border: "1px solid #eee",
    borderRadius: 4,
  },
  bankTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 4,
  },
  bankText: {
    fontSize: 8,
    color: "#555",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 7,
    color: "#aaa",
  },
});

type InvoicePDFProps = {
  invoice: {
    invoiceNumber: string;
    title: string | null;
    issueDate: string;
    dueDate: string | null;
    subtotal: string;
    taxRate: string;
    taxAmount: string;
    totalAmount: string;
    paidAmount: string;
    notes: string | null;
  };
  customerName: string;
  items: {
    itemName: string;
    quantity: string;
    unit: string;
    unitPrice: string;
    amount: string;
  }[];
  company: {
    companyName: string;
    postalCode: string | null;
    address: string | null;
    phone: string | null;
    fax: string | null;
    email: string | null;
    registrationNumber: string | null;
    bankInfo: string | null;
  } | null;
};

function formatCurrency(val: string | number): string {
  return `¥${Number(val).toLocaleString("ja-JP")}`;
}

export function InvoicePDF({
  invoice,
  customerName,
  items,
  company,
}: InvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>請 求 書</Text>
          <Text style={styles.invoiceNumber}>
            No. {invoice.invoiceNumber}
          </Text>
        </View>

        {/* Top row */}
        <View style={styles.topRow}>
          <View style={styles.customerSection}>
            <Text style={styles.customerName}>{customerName} 御中</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>件名:</Text>
              <Text style={styles.metaValue}>
                {invoice.title ?? "—"}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>発行日:</Text>
              <Text style={styles.metaValue}>{invoice.issueDate}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>お支払期限:</Text>
              <Text style={styles.metaValue}>
                {invoice.dueDate ?? "—"}
              </Text>
            </View>
          </View>

          <View style={styles.companySection}>
            {company ? (
              <>
                <Text style={styles.companyName}>{company.companyName}</Text>
                {company.postalCode && (
                  <Text style={styles.infoText}>
                    〒{company.postalCode}
                  </Text>
                )}
                {company.address && (
                  <Text style={styles.infoText}>{company.address}</Text>
                )}
                {company.phone && (
                  <Text style={styles.infoText}>
                    TEL: {company.phone}
                    {company.fax ? ` / FAX: ${company.fax}` : ""}
                  </Text>
                )}
                {company.email && (
                  <Text style={styles.infoText}>{company.email}</Text>
                )}
                {company.registrationNumber && (
                  <Text style={styles.infoText}>
                    登録番号: {company.registrationNumber}
                  </Text>
                )}
              </>
            ) : (
              <Text style={styles.companyName}>株式会社光</Text>
            )}
          </View>
        </View>

        {/* Total box */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>ご請求金額（税込）</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(invoice.totalAmount)}
          </Text>
        </View>

        {/* Items table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colNo, styles.headerText]}>No</Text>
            <Text style={[styles.colName, styles.headerText]}>品名</Text>
            <Text style={[styles.colQty, styles.headerText]}>数量</Text>
            <Text style={[styles.colUnit, styles.headerText]}>単位</Text>
            <Text style={[styles.colPrice, styles.headerText]}>単価</Text>
            <Text style={[styles.colAmount, styles.headerText]}>金額</Text>
          </View>
          {items.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colNo}>{idx + 1}</Text>
              <Text style={styles.colName}>{item.itemName}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colUnit}>{item.unit}</Text>
              <Text style={styles.colPrice}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={styles.colAmount}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryTable}>
            <View style={styles.summaryRow}>
              <Text>小計</Text>
              <Text>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>消費税 ({invoice.taxRate}%)</Text>
              <Text>{formatCurrency(invoice.taxAmount)}</Text>
            </View>
            <View style={styles.summaryTotalRow}>
              <Text style={{ fontWeight: 700 }}>合計</Text>
              <Text style={{ fontWeight: 700 }}>
                {formatCurrency(invoice.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Bank info */}
        {company?.bankInfo && (
          <View style={styles.bankSection}>
            <Text style={styles.bankTitle}>お振込先</Text>
            <Text style={styles.bankText}>{company.bankInfo}</Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>備考</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer}>
          この請求書は {invoice.issueDate} に発行されました
        </Text>
      </Page>
    </Document>
  );
}
