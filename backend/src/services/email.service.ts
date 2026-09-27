import { env } from "../config/env";

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends email through the Resend HTTP API when RESEND_API_KEY is configured.
 * Otherwise the message is written to the server log, which is enough for
 * local development and demos. Returns true if an email was actually sent.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    if (!env.isTest) {
      console.log(`\n[email] (not sent, RESEND_API_KEY not set)\nTo: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
    }
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: env.EMAIL_FROM, ...message }),
    });
    if (!response.ok) {
      console.error(`[email] Resend responded with ${response.status}: ${await response.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}

export function passwordResetEmail(name: string, resetUrl: string): Omit<EmailMessage, "to"> {
  return {
    subject: "Reset your TaskFlow password",
    text: `Hi ${name},\n\nUse the link below to reset your TaskFlow password. It expires in 30 minutes.\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;padding:24px;color:#18181b">
  <h2 style="margin:0 0 16px">Reset your password</h2>
  <p>Hi ${escapeHtml(name)},</p>
  <p>Use the button below to reset your TaskFlow password. The link expires in 30 minutes.</p>
  <p style="margin:24px 0"><a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p>
  <p style="color:#71717a;font-size:14px">If you didn't request this, you can safely ignore this email.</p>
</div>`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
