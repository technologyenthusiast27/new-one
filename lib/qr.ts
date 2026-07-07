import QRCode from "qrcode";

/**
 * Generate a QR code as a PNG data URL. Encodes the public ticket URL so
 * scanning at the door opens the verifiable digital ticket.
 */
export async function generateQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    scale: 8,
    color: {
      dark: "#0e0e14",
      light: "#ffffff",
    },
  });
}
