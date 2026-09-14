import assert from 'node:assert/strict'
import {test} from 'node:test'
import ApplicationReplyMail from '../server/mail/application-reply'

test('application reply mail renders an absolute brand logo above the message',()=>{
 const mail=ApplicationReplyMail({
  to:'applicant@example.test',
  subject:'Application update',
  body:'Hello Sam,\n\nThank you for applying.',
  brandName:'Alamir Ingredients',
  logo:'/assets/logo-full.svg',
  appUrl:'https://www.alamiringredients.com/admin',
 })
 assert.equal(mail.to[0].email,'applicant@example.test')
 assert.equal(mail.text,'Hello Sam,\n\nThank you for applying.')
 assert.match(mail.html!,/src="https:\/\/www\.alamiringredients\.com\/assets\/logo-full\.svg"/)
 assert.ok(mail.html!.indexOf('<img ')<mail.html!.indexOf('Hello Sam'))
 assert.match(mail.html!,/width="184" alt="Alamir Ingredients"/)
 assert.match(mail.html!,/<h1[^>]*>Application update<\/h1>/)
 assert.match(mail.html!,/Hello Sam,<\/p><p[^>]*>Thank you for applying\.<\/p>/)
 assert.match(mail.html!,/alt="Alamir Ingredients"/)
 assert.match(mail.html!,/background:#c8402c/)
 assert.match(mail.html!,/background:#132840/)
 assert.match(mail.html!,/&copy; \d{4} Alamir Ingredients/)
 assert.match(mail.html!,/>alamiringredients\.com<\/a>/)
 assert.match(mail.html!,/@media only screen and \(max-width:640px\)/)
})

test('application reply mail escapes message and brand content',()=>{
 const mail=ApplicationReplyMail({
  to:'applicant@example.test',
  subject:'Reply <draft>',
  body:'Hello <script>alert("x")</script>',
  brandName:'Alamir & Sons',
  logo:'https://cdn.example.test/logo.svg?size=large&theme=light',
  appUrl:'https://www.alamiringredients.com',
 })
 assert.match(mail.html!,/<title>Reply &lt;draft&gt;<\/title>/)
 assert.doesNotMatch(mail.html!,/<script>/)
 assert.match(mail.html!,/Hello &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/)
 assert.match(mail.html!,/alt="Alamir &amp; Sons"/)
 assert.match(mail.html!,/logo\.svg\?size=large&amp;theme=light/)
})
