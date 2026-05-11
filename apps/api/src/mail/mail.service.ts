import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);
    const user = this.config.get<string>('SMTP_USER');
    const password = this.config.get<string>('SMTP_PASSWORD');
    this.from = this.config.get<string>('MAIL_FROM') ?? 'TraveloCount <no-reply@travelocount.local>';
    this.enabled = Boolean(host);

    this.transporter = this.enabled
      ? nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: user && password ? { user, pass: password } : undefined,
        })
      : nodemailer.createTransport({ jsonTransport: true });
  }

  async sendInvite(opts: {
    to: string;
    tripTitle: string;
    inviteUrl: string;
    inviterName: string;
  }) {
    const subject = `${opts.inviterName} t'invite à rejoindre "${opts.tripTitle}" sur TraveloCount`;
    const html = renderInviteEmail(opts);
    const text = `${opts.inviterName} t'invite à rejoindre "${opts.tripTitle}". Rejoins le voyage : ${opts.inviteUrl}`;

    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: opts.to,
        subject,
        html,
        text,
      });
      if (!this.enabled) {
        this.logger.log(`[DEV mailer] To: ${opts.to} | Subject: ${subject} | URL: ${opts.inviteUrl}`);
      } else {
        this.logger.log(`Invite email sent: ${info.messageId} to ${opts.to}`);
      }
    } catch (e) {
      this.logger.error(`Failed to send invite email to ${opts.to}`, e);
    }
  }
}

function renderInviteEmail({
  tripTitle,
  inviteUrl,
  inviterName,
}: {
  tripTitle: string;
  inviteUrl: string;
  inviterName: string;
}): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Invitation</title></head>
<body style="margin:0;padding:24px;background:#F4F4F9;font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#0C1A22">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 8px 24px rgba(12,26,34,0.06)">
    <tr><td style="background:#0C1A22;padding:32px 28px;color:#fff">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#B8DBD9">TraveloCount</div>
      <div style="margin-top:8px;font-size:22px;font-weight:700;letter-spacing:-0.02em">Invitation au voyage</div>
    </td></tr>
    <tr><td style="padding:28px">
      <p style="margin:0 0 12px;font-size:15px;line-height:1.5"><strong>${escapeHtml(inviterName)}</strong> t'invite à rejoindre :</p>
      <p style="margin:0 0 24px;font-size:22px;font-weight:700">${escapeHtml(tripTitle)}</p>
      <a href="${inviteUrl}" style="display:inline-block;background:#0C1A22;color:#fff;text-decoration:none;padding:14px 24px;border-radius:14px;font-weight:700;font-size:14px">Rejoindre le voyage</a>
      <p style="margin:24px 0 0;font-size:12px;color:#586F7C">Ou copie ce lien : <br><span style="font-family:monospace;font-size:11px;color:#2F4550;word-break:break-all">${inviteUrl}</span></p>
    </td></tr>
    <tr><td style="padding:16px 28px;background:#F4F4F9;text-align:center;font-size:11px;color:#8FA0AB">
      Ce lien expire après une durée limitée.
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
