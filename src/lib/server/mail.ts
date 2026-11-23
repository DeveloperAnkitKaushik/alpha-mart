import { createTransport } from "nodemailer";
import { smtpEnv } from "@/lib/server/env";

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const smtp = smtpEnv();
  if (!smtp) throw new Error("Email isn't set up yet");
  await createTransport({
    host: smtp.SMTP_HOST,
    port: smtp.SMTP_PORT,
    secure: smtp.SMTP_PORT === 465,
    auth: { user: smtp.SMTP_USER, pass: smtp.SMTP_PASS },
  }).sendMail({ from: smtp.MAIL_FROM, to, subject, text });
}
