import { defineMail } from "@holo-js/mail";
import type { EventRecord } from "@/lib/events/contracts";
import type { CmsLocale } from "@/lib/cms/contracts";
import { textContent } from "@/lib/editor/document";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]!,
  );
export default function MeetingConfirmationMail(input: {
  to: string;
  name: string;
  event: EventRecord;
  startsAt: Date;
  endsAt: Date;
  locale: CmsLocale;
}) {
  const { event, locale } = input,
    title = textContent(event.content.title[locale]),
    when = new Intl.DateTimeFormat(locale, {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: event.timezone,
    }).format(input.startsAt),
    subject = `Meeting confirmed — ${title}`;
  const text = `Hello ${input.name},\n\nYour meeting for ${title} is confirmed for ${when} (${event.timezone}).\n\nIf anything changes, reply to this email and we will help.`;
  return defineMail({
    to: input.to,
    subject,
    text,
    html: `<!doctype html><html lang="${locale}"><body style="margin:0;background:#f1f0eb;font-family:Arial,sans-serif;color:#17283a"><table role="presentation" width="100%"><tr><td align="center" style="padding:40px 16px"><table role="presentation" width="600" style="max-width:600px;background:#fff;border-radius:14px;border-top:5px solid #c8402c"><tr><td style="padding:40px"><p style="color:#c8402c;font-weight:700">Alamir Ingredients</p><h1 style="font-family:Georgia,serif">${escape(subject)}</h1><p>Hello ${escape(input.name)},</p><p>Your meeting is confirmed.</p><p style="padding:18px;background:#f4f6f7;border-radius:10px"><strong>${escape(title)}</strong><br>${escape(when)}<br>${escape(event.timezone)}</p><p>If anything changes, reply to this email and we will help.</p></td></tr></table></td></tr></table></body></html>`,
  });
}
