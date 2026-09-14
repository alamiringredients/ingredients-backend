import { defineMail } from '@holo-js/mail'

export type ApplicationReplyMailInput = {
  readonly to: string
  readonly subject: string
  readonly body: string
  readonly brandName: string
  readonly logo: string
  readonly appUrl: string
}

const escapeHtml = (value:string) => value.replace(/[&<>"']/g, character => ({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#039;',
})[character]!)

function absoluteUrl(path:string,appUrl:string) {
  return new URL(path,new URL('/',appUrl)).toString()
}

function messageHtml(body:string) {
  return body.trim().split(/\r?\n\s*\r?\n/).map(paragraph =>
    `<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#3f484f;">${escapeHtml(paragraph).replace(/\r?\n/g,'<br>')}</p>`
  ).join('')
}

function html(input:ApplicationReplyMailInput) {
  const subject=escapeHtml(input.subject.trim())
  const brandName=escapeHtml(input.brandName.trim())
  const logo=escapeHtml(absoluteUrl(input.logo,input.appUrl))
  const website=new URL('/',input.appUrl)
  const websiteUrl=escapeHtml(website.toString())
  const websiteLabel=escapeHtml(website.hostname.replace(/^www\./,''))
  const year=new Date().getUTCFullYear()
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>${subject}</title>
  <style>
    @media only screen and (max-width:640px) {
      .email-shell { padding:16px 10px !important; }
      .email-header { padding:26px 24px 22px !important; }
      .email-content { padding:32px 24px 36px !important; }
      .email-footer { padding:24px !important; }
      .email-title { font-size:23px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f1f0eb;color:#101820;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${subject}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f1f0eb" style="width:100%;background:#f1f0eb;">
    <tr>
      <td class="email-shell" align="center" style="padding:48px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dedbd3;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(16,24,32,.08);">
          <tr>
            <td height="5" bgcolor="#c8402c" style="height:5px;background:#c8402c;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-header" align="left" style="padding:30px 44px 26px;border-bottom:1px solid #ebe8e1;">
              <img src="${logo}" width="184" alt="${brandName}" style="display:block;width:184px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
            </td>
          </tr>
          <tr>
            <td class="email-content" style="padding:40px 44px 44px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="32" height="3" bgcolor="#c8402c" style="width:32px;height:3px;background:#c8402c;font-size:0;line-height:0;">&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              </table>
              <h1 class="email-title" style="margin:18px 0 26px;font-size:26px;line-height:1.3;letter-spacing:-.02em;color:#132840;font-weight:700;">${subject}</h1>
              <div style="font-size:16px;line-height:1.75;color:#3f484f;">
                ${messageHtml(input.body)}
              </div>
            </td>
          </tr>
          <tr>
            <td class="email-footer" bgcolor="#132840" style="padding:25px 44px;background:#132840;color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:12px;line-height:1.6;color:#ffffff;">&copy; ${year} ${brandName}</td>
                  <td align="right" style="font-size:12px;line-height:1.6;"><a href="${websiteUrl}" style="color:#c9dae8;text-decoration:none;">${websiteLabel}</a></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ApplicationReplyMail(input: ApplicationReplyMailInput) {
  return defineMail({
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: html(input),
  })
}

export default ApplicationReplyMail
