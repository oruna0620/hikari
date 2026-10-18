import QRCode from "qrcode";

export async function generateQRCodeDataURL(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    width: 256,
    margin: 2,
    color: {
      dark: "#1a1a1a",
      light: "#ffffff",
    },
  });
}

export async function generateQRCodeBuffer(data: string): Promise<Buffer> {
  return QRCode.toBuffer(data, {
    width: 256,
    margin: 2,
    color: {
      dark: "#1a1a1a",
      light: "#ffffff",
    },
  });
}
