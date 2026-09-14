import 'server-only'
import ContactEnquiry from '@/server/models/ContactEnquiry'

export type EnquiryInput={name:string;email:string;company?:string;country?:string;product?:string;volume?:string;message?:string;locale:string;key:string;trap?:string;jobTitle?:string;dialCode?:string;phone?:string;website?:string;industry?:string;channel?:string}
export async function storeEnquiry(source: 'contact' | 'quote', input: EnquiryInput) {
  if (input.trap) return {id: 0}
  const existing = await ContactEnquiry.where('submission_key', input.key).firstJson()
  if (existing) return {id: Number(existing.id)}

  const row = await ContactEnquiry.create({
    source,
    status: 'open',
    name: input.name,
    email: input.email,
    company: input.company ?? '',
    job_title: input.jobTitle ?? '',
    country: input.country ?? '',
    dial_code: input.dialCode ?? '',
    phone: input.phone ?? '',
    website: input.website ?? '',
    industry: input.industry ?? '',
    product: input.product ?? '',
    volume: input.volume ?? '',
    channel: input.channel ?? '',
    message: input.message ?? '',
    locale: input.locale,
    submission_key: input.key,
  })
  return {id: Number(row.id)}
}
