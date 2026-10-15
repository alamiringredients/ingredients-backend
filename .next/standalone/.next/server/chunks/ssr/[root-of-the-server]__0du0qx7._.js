module.exports=[86625,a=>a.a(async(b,c)=>{try{var d=await a.y("@holo-js/mail-56980ce599d13bef");a.n(d),c()}catch(a){c(a)}},!0),87814,a=>{a.v(b=>Promise.all(["server/chunks/ssr/[externals]_@holo-js_security_1nepzwo._.js"].map(b=>a.l(b))).then(()=>b(28882)))},81007,a=>{a.v(b=>Promise.all(["server/chunks/ssr/[externals]_sharp_1oez0x5._.js"].map(b=>a.l(b))).then(()=>b(93599)))},2542,a=>a.a(async(b,c)=>{try{var d=a.i(30973),e=a.i(76326),f=b([d,e]);[d,e]=f.then?(await f)():f,a.s([]),c()}catch(a){c(a)}},!1),57455,a=>a.a(async(b,c)=>{try{var d=a.i(2542),e=a.i(30973),f=a.i(76326),g=b([d,e,f]);[d,e,f]=g.then?(await g)():g,a.s(["402017636c5b628cb71eb7faefdc87bac98d1fb2ce",()=>f.replyToEnquiryAction,"402192dd407e3b7d2ec76423a6c0adb2ee97443739",()=>f.deleteEnquiryAction,"402a2ca564e142abe5fcbbbdc5466612bec5501513",()=>e.logoutAdminAction,"40561d54c0f1c928bdeecc038c4d7105d358690c1c",()=>f.setEnquiryStatusAction]),c()}catch(a){c(a)}},!1),30973,a=>a.a(async(b,c)=>{try{var d=a.i(37936),e=a.i(18887),f=a.i(48588),g=a.i(46995),h=a.i(89231);a.i(70396);var i=a.i(73727),j=a.i(13095),k=b([e,f,g,h]);async function l(a){await (0,g.validate)(a,h.logoutForm),await f.default.guard("admin").logout(),(0,i.redirect)("/admin/login")}[e,f,g,h]=k.then?(await k)():k,(0,j.ensureServerEntryExports)([l]),(0,d.registerServerReference)(l,"402a2ca564e142abe5fcbbbdc5466612bec5501513",null),a.s(["logoutAdminAction",0,l]),c()}catch(a){c(a)}},!1),76326,a=>a.a(async(b,c)=>{try{var d=a.i(37936),e=a.i(14126),f=a.i(79622),g=a.i(29767),h=a.i(11895),i=a.i(65542),j=a.i(74199),k=a.i(15040),l=a.i(88385),m=a.i(46995),n=a.i(86625),o=a.i(18558),p=a.i(13095),q=b([e,f,g,h,i,j,k,l,m,n]);[e,f,g,h,i,j,k,l,m,n]=q.then?(await q)():q;let u=f.adminActionError;async function r(a){try{await (0,e.requireAdminPermission)("contact_enquiries","edit");let b=await (0,m.validate)(a,h.enquiryStatusForm);return await (await j.default.findOrFail(Number(b.enquiryId))).update({status:b.status}),(0,o.revalidatePath)("/admin/enquiries","layout"),{ok:!0,message:"Status updated."}}catch(a){return u(a)}}async function s(a){try{return await (0,e.requireAdminPermission)("contact_enquiries","delete"),await (await j.default.findOrFail(a)).delete(),(0,o.revalidatePath)("/admin/enquiries","layout"),{ok:!0,message:"Enquiry and reply history deleted."}}catch(a){return u(a)}}async function t(a){try{await (0,e.requireAdminPermission)("contact_enquiries","edit");let b=await (0,m.validate)(a,h.enquiryReplyForm),c=await j.default.findOrFail(Number(b.enquiryId)),d=await k.default.where("request_key",b.key).firstJson();if(d)return{ok:"sent"===d.status,message:"sent"===d.status?"Reply already sent.":"This reply was already attempted. Check its delivery status."};let f=await k.default.create({enquiry_id:Number(b.enquiryId),subject:b.subject,body:b.body,status:"sending",request_key:b.key});try{let a=await (0,g.getWebsiteSettings)(),d=await (0,n.sendMail)((0,i.default)({to:c.email,subject:b.subject,body:b.body,brandName:a.siteName.en,logo:a.logo,appUrl:(0,l.config)("app.url")}));await f.update({status:"sent",message_id:d.messageId})}catch{return await f.update({status:"failed"}),(0,o.revalidatePath)(`/admin/enquiries/${c.id}`),{ok:!1,message:"Delivery failed. The reply is saved with failed status."}}return(0,o.revalidatePath)(`/admin/enquiries/${c.id}`),{ok:!0,message:"Reply sent."}}catch(a){return u(a)}}(0,p.ensureServerEntryExports)([r,s,t]),(0,d.registerServerReference)(r,"40561d54c0f1c928bdeecc038c4d7105d358690c1c",null),(0,d.registerServerReference)(s,"402192dd407e3b7d2ec76423a6c0adb2ee97443739",null),(0,d.registerServerReference)(t,"402017636c5b628cb71eb7faefdc87bac98d1fb2ce",null),a.s(["deleteEnquiryAction",0,s,"replyToEnquiryAction",0,t,"setEnquiryStatusAction",0,r]),c()}catch(a){c(a)}},!1),89231,a=>a.a(async(b,c)=>{try{var d=a.i(67950),e=b([d]);[d]=e.then?(await e)():e;let f=(0,d.schema)({email:d.field.string().required().email(),password:d.field.password().required(),remember:d.field.boolean().default(!1)}),g=(0,d.schema)({guard:d.field.string().default("admin").in(["admin"])});a.s(["loginForm",0,f,"logoutForm",0,g]),c()}catch(a){c(a)}},!1),48588,a=>a.a(async(b,c)=>{try{var d=a.i(6610),e=b([d]);[d]=e.then?(await e)():e,a.s(["default",()=>d.src_default]),c()}catch(a){c(a)}},!1),11895,a=>a.a(async(b,c)=>{try{var d=a.i(67950),e=b([d]);[d]=e.then?(await e)():e;let f={name:d.field.string().required("requiredName").max(150).transform(a=>a.trim()),email:d.field.string().required("requiredEmail").email("validEmail").max(200).transform(a=>a.trim().toLowerCase()),company:d.field.string().max(200).transform(a=>a.trim()).optional(),country:d.field.string().max(120).optional(),product:d.field.string().max(160).optional(),volume:d.field.string().max(160).optional(),message:d.field.string().max(1e4).optional(),consent:d.field.boolean().required("requiredConsent").custom(a=>!0===a,"requiredConsent"),locale:d.field.string().required().in(["en","ar","fr"]),key:d.field.string().required().uuid(),trap:d.field.string().max(200).optional()};(0,d.schema)({...f,jobTitle:d.field.string().max(160).optional(),dialCode:d.field.string().required("requiredDialCode").max(12),phone:d.field.string().required("requiredPhone").max(50),website:d.field.string().max(300).optional(),industry:d.field.string().max(160).optional(),channel:d.field.string().max(80).optional()}),(0,d.schema)({...f,company:d.field.string().required("requiredCompany").max(200),country:d.field.string().required("requiredCountry").max(120)});let g=(0,d.schema)({enquiryId:d.field.number().required().integer().min(1),subject:d.field.string().required("Enter a subject.").max(200).custom(a=>!/[\r\n]/.test(a),"Use one line for the subject."),body:d.field.string().required("Enter a reply.").max(2e4),key:d.field.string().required().uuid()}),h=(0,d.schema)({enquiryId:d.field.number().required().integer().min(1),status:d.field.string().required().in(["open","closed"])});(0,d.schema)({name:f.name,email:f.email,company:d.field.string().required().max(200),country:d.field.string().required().max(120),product:d.field.string().required().max(160),volume:d.field.string().required().max(160),brix:d.field.string().max(100).optional(),destination:d.field.string().required().max(200),locale:f.locale,key:f.key,trap:f.trap}),a.s(["enquiryReplyForm",0,g,"enquiryStatusForm",0,h]),c()}catch(a){c(a)}},!1),65542,a=>a.a(async(b,c)=>{try{var d=a.i(86625),e=b([d]);[d]=e.then?(await e)():e;let f=a=>a.replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[a]);a.s(["default",0,function(a){var b,c,e;let g,h,i,j,k,l,m;return(0,d.defineMail)({to:a.to,subject:a.subject,text:a.body,html:(b=a,g=f(b.subject.trim()),h=f(b.brandName.trim()),i=f((c=b.logo,e=b.appUrl,new URL(c,new URL("/",e)).toString())),j=new URL("/",b.appUrl),k=f(j.toString()),l=f(j.hostname.replace(/^www\./,"")),m=new Date().getUTCFullYear(),`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light only">
  <title>${g}</title>
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
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${g}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f1f0eb" style="width:100%;background:#f1f0eb;">
    <tr>
      <td class="email-shell" align="center" style="padding:48px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dedbd3;border-radius:14px;overflow:hidden;box-shadow:0 12px 32px rgba(16,24,32,.08);">
          <tr>
            <td height="5" bgcolor="#c8402c" style="height:5px;background:#c8402c;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-header" align="left" style="padding:30px 44px 26px;border-bottom:1px solid #ebe8e1;">
              <img src="${i}" width="184" alt="${h}" style="display:block;width:184px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
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
              <h1 class="email-title" style="margin:18px 0 26px;font-size:26px;line-height:1.3;letter-spacing:-.02em;color:#132840;font-weight:700;">${g}</h1>
              <div style="font-size:16px;line-height:1.75;color:#3f484f;">
                ${b.body.trim().split(/\r?\n\s*\r?\n/).map(a=>`<p style="margin:0 0 20px;font-size:16px;line-height:1.75;color:#3f484f;">${f(a).replace(/\r?\n/g,"<br>")}</p>`).join("")}
              </div>
            </td>
          </tr>
          <tr>
            <td class="email-footer" bgcolor="#132840" style="padding:25px 44px;background:#132840;color:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size:12px;line-height:1.6;color:#ffffff;">&copy; ${m} ${h}</td>
                  <td align="right" style="font-size:12px;line-height:1.6;"><a href="${k}" style="color:#c9dae8;text-decoration:none;">${l}</a></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`)})}]),c()}catch(a){c(a)}},!1),74199,a=>a.a(async(b,c)=>{try{var d=a.i(66314),e=b([d]);[d]=e.then?(await e)():e;let f=(0,d.defineModel)("contact_enquiries",{relations:{replies:(0,d.hasMany)("ContactReply","enquiry_id")},fillable:["source","status","name","email","company","job_title","country","dial_code","phone","website","industry","product","volume","channel","message","locale","submission_key"]});a.s(["default",0,f]),c()}catch(a){c(a)}},!1),15040,a=>a.a(async(b,c)=>{try{var d=a.i(66314),e=b([d]);[d]=e.then?(await e)():e;let f=(0,d.defineModel)("contact_replies",{relations:{enquiry:(0,d.belongsTo)("ContactEnquiry","enquiry_id")},fillable:["enquiry_id","subject","body","status","message_id","request_key"]});a.s(["default",0,f]),c()}catch(a){c(a)}},!1)];

//# sourceMappingURL=%5Broot-of-the-server%5D__0du0qx7._.js.map