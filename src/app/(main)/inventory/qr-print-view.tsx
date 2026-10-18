"use client";

type QrItem = {
  code: string;
  label: string | null;
  productName: string;
  dataUrl: string;
};

type Props = {
  items: QrItem[];
};

export function QrPrintView({ items }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "1rem",
            textAlign: "center",
            breakInside: "avoid",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.dataUrl}
            alt={item.code}
            style={{ width: 120, height: 120 }}
          />
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              marginTop: "0.5rem",
            }}
          >
            {item.productName}
          </div>
          {item.label && (
            <div style={{ fontSize: "0.625rem", color: "#888" }}>
              {item.label}
            </div>
          )}
          <div
            style={{
              fontSize: "0.5rem",
              color: "#aaa",
              marginTop: "0.25rem",
            }}
          >
            {item.code}
          </div>
        </div>
      ))}
    </div>
  );
}
