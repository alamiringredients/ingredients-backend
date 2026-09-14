import {validate} from '@holo-js/forms'
import {contactEnquiryForm, homeEnquiryForm, quoteEnquiryForm} from '@/server/http/controllers/enquiry-schema'
import {storeEnquiry} from '@/server/services/enquiries/submissions'
import {publicFormRoute} from '@/server/http/public-form'

export const createContactEnquiry = publicFormRoute(async (request: Request) => {
  const input = await validate(request, contactEnquiryForm, {throttle: 'contact-enquiry'})
  await storeEnquiry('contact', input)
  return Response.json({ok: true, status: 200, data: {redirectTo: input.locale === 'en' ? '/thank-you' : `/${input.locale}/thank-you`}})
})

export const createHomeEnquiry = publicFormRoute(async (request: Request) => {
  const input = await validate(request, homeEnquiryForm, {throttle: 'contact-enquiry'})
  await storeEnquiry('contact', {...input, message: `Target Brix: ${input.brix ?? ''}\nDestination: ${input.destination}`})
  return Response.json({ok: true, status: 200, data: {redirectTo: input.locale === 'en' ? '/thank-you' : `/${input.locale}/thank-you`}})
})

export const createQuoteEnquiry = publicFormRoute(async (request: Request) => {
  const input = await validate(request, quoteEnquiryForm, {throttle: 'quote-enquiry'})
  await storeEnquiry('quote', input)
  return Response.json({ok: true, status: 200, data: {}})
})
