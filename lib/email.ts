import nodemailer from "nodemailer";
import type { Event, Ticket } from "./types";

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || "NovaLabs <tickets@novalabs.club>";

export const emailConfigured = Boolean(host && user && pass);

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

function ticketEmailHtml(event: Event, ticket: Ticket, qrDataUrl: string): string {
  const url = `${siteUrl()}/ticket/${ticket.id}`;
  const venue = [event.venueName, event.venueCity].filter(Boolean).join(", ");
  return `
  <div style="margin:0;padding:0;background:#0b0b10;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
      <p style="letter-spacing:4px;font-size:11px;color:#a78bfa;text-transform:uppercase;margin:0 0 8px;">${event.presenter} presents</p>
      <h1 style="font-size:30px;line-height:1.1;color:#ffffff;margin:0 0 4px;font-weight:700;">${event.name}</h1>
      <p style="color:#9ca3af;margin:0 0 28px;font-size:14px;">${event.tagline ?? ""}</p>

      <div style="background:#14141c;border:1px solid rgba(139,92,246,0.25);border-radius:20px;padding:28px;">
        <p style="color:#c4b5fd;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">You're in, ${ticket.buyerName.split(" ")[0]} 🎈</p>
        <h2 style="color:#ffffff;margin:0 0 20px;font-size:20px;">${ticket.ticketTypeName} Pass &middot; ${ticket.quantity} × &middot; ${ticket.seats} guest${ticket.seats > 1 ? "s" : ""}</h2>

        <div style="text-align:center;background:#ffffff;border-radius:16px;padding:18px;margin:0 0 20px;">
          <img src="${qrDataUrl}" alt="Entry QR code" width="200" height="200" style="display:block;margin:0 auto;" />
          <p style="color:#111827;font-family:monospace;font-size:14px;margin:12px 0 0;letter-spacing:1px;">${ticket.id}</p>
        </div>

        <table style="width:100%;color:#d1d5db;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#9ca3af;">Date</td><td style="padding:6px 0;text-align:right;">${fmtDate(event.eventDate)}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Doors open</td><td style="padding:6px 0;text-align:right;">${fmtTime(event.doorsOpenAt)}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Venue</td><td style="padding:6px 0;text-align:right;">${venue}</td></tr>
          <tr><td style="padding:6px 0;color:#9ca3af;">Amount paid</td><td style="padding:6px 0;text-align:right;color:#ffffff;font-weight:600;">${inr(ticket.amountInr)}</td></tr>
        </table>
      </div>

      <div style="text-align:center;margin:24px 0;">
        <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#8b5cf6,#6d28d9);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:14px;">View your digital ticket</a>
      </div>

      <p style="color:#6b7280;font-size:12px;text-align:center;line-height:1.6;margin:24px 0 0;">
        Show the QR code above at the entrance. This ticket admits ${ticket.seats} guest${ticket.seats > 1 ? "s" : ""}.<br/>
        ${event.name} — presented by ${event.presenter}.
      </p>
    </div>
  </div>`;
}

export interface EmailResult {
  sent: boolean;
  reason?: string;
}

/**
 * Send the confirmation email with the QR ticket. When SMTP is not
 * configured this is a no-op (logged), so the booking flow still succeeds.
 */
export async function sendTicketEmail(
  event: Event,
  ticket: Ticket,
  qrDataUrl: string,
): Promise<EmailResult> {
  if (!emailConfigured) {
    console.info(
      `[email] SMTP not configured — skipping confirmation to ${ticket.buyerEmail} for ${ticket.id}`,
    );
    return { sent: false, reason: "smtp-not-configured" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: ticket.buyerEmail,
      subject: `🎈 Your ${ticket.ticketTypeName} pass for ${event.name}`,
      html: ticketEmailHtml(event, ticket, qrDataUrl),
    });

    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { sent: false, reason: "send-failed" };
  }
}
