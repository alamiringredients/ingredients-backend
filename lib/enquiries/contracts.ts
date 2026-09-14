export type EnquiryStatus='open'|'closed'
export type EnquirySource='contact'|'quote'

export type EnquiryRecord={
  id:number
  source:EnquirySource
  status:EnquiryStatus
  name:string
  email:string
  company:string
  job_title:string
  country:string
  dial_code:string
  phone:string
  website:string
  industry:string
  product:string
  volume:string
  channel:string
  message:string
  locale:string
  submission_key:string
  created_at:string
  updated_at:string
}

export type EnquiryReplyRecord={
  id:number
  enquiry_id:number
  subject:string
  body:string
  status:string
  message_id:string|null
  request_key:string
  created_at:string
  updated_at:string
}

export type EnquiryOption =
  | 'Beverage'
  | 'Sauces & condiments'
  | 'Dairy'
  | 'Confectionery'
  | 'Bakery'
  | 'Prepared foods'
  | 'Other'
  | 'Tomato concentrates'
  | 'Fruit concentrates'
  | 'Fruit purees'
  | 'Chilli concentrate'
  | 'Not sure yet'
  | 'WhatsApp'
  | 'Email'
  | 'Call'

export type EnquiryInterfaceLabels = {
  fullName:string
  jobTitle:string
  company:string
  companyName:string
  workEmail:string
  email:string
  country:string
  selectCountry:string
  dialCode:string
  code:string
  phoneNumber:string
  companyWebsite:string
  industry:string
  product:string
  productInterest:string
  selectProduct:string
  indicativeVolume:string
  estimatedVolume:string
  preferredChannel:string
  message:string
  specificationNotes:string
  consent:string
  privacyPolicy:string
  incomplete:string
  sending:string
  sendRequest:string
  cancel:string
  submitEnquiry:string
  whatsappSales:string
  quoteSuccess:string
  quoteFailure:string
  contactFailure:string
  fullNamePlaceholder:string
  jobTitlePlaceholder:string
  companyPlaceholder:string
  countryPlaceholder:string
  emailPlaceholder:string
  phonePlaceholder:string
  websitePlaceholder:string
  volumePlaceholder:string
  quoteVolumePlaceholder:string
  messagePlaceholder:string
  quoteMessagePlaceholder:string
  requiredName:string
  requiredEmail:string
  validEmail:string
  requiredDialCode:string
  requiredPhone:string
  requiredCompany:string
  requiredCountry:string
  requiredConsent:string
  options:Record<EnquiryOption,string>
}
