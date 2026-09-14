import {field, schema} from '@holo-js/forms/schema'

const common={
 name:field.string().required('requiredName').max(150).transform(value=>value.trim()),email:field.string().required('requiredEmail').email('validEmail').max(200).transform(value=>value.trim().toLowerCase()),company:field.string().max(200).transform(value=>value.trim()).optional(),country:field.string().max(120).optional(),product:field.string().max(160).optional(),volume:field.string().max(160).optional(),message:field.string().max(10000).optional(),consent:field.boolean().required('requiredConsent').custom(value=>value===true,'requiredConsent'),locale:field.string().required().in(['en','ar','fr']),key:field.string().required().uuid(),trap:field.string().max(200).optional(),
}
export const contactEnquiryForm=schema({...common,jobTitle:field.string().max(160).optional(),dialCode:field.string().required('requiredDialCode').max(12),phone:field.string().required('requiredPhone').max(50),website:field.string().max(300).optional(),industry:field.string().max(160).optional(),channel:field.string().max(80).optional()})
export const quoteEnquiryForm=schema({...common,company:field.string().required('requiredCompany').max(200),country:field.string().required('requiredCountry').max(120)})
export const enquiryReplyForm=schema({enquiryId:field.number().required().integer().min(1),subject:field.string().required('Enter a subject.').max(200).custom(value=>!/[\r\n]/.test(value),'Use one line for the subject.'),body:field.string().required('Enter a reply.').max(20000),key:field.string().required().uuid()})
export const enquiryStatusForm=schema({enquiryId:field.number().required().integer().min(1),status:field.string().required().in(['open','closed'])})

export const homeEnquiryForm = schema({
 name: common.name,
 email: common.email,
 company: field.string().required().max(200),
 country: field.string().required().max(120),
 product: field.string().required().max(160),
 volume: field.string().required().max(160),
 brix: field.string().max(100).optional(),
 destination: field.string().required().max(200),
 locale: common.locale,
 key: common.key,
 trap: common.trap,
})
