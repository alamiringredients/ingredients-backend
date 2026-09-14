import 'server-only'

import type {EnquiryInterfaceLabels,EnquiryOption} from '@/lib/enquiries/contracts'

export function buildEnquiryInterfaceLabels(values: Record<string, string>): EnquiryInterfaceLabels {
  const get=(key:string)=>{
    const value=values[key]
    if(!value)throw new Error(`Enquiry interface translation ${key} is missing from the database. Run the content_translations seeder.`)
    return value
  }
  const option=(key:string)=>get(`option.${key}`)
  return {
    fullName:get('fullName'),jobTitle:get('jobTitle'),company:get('company'),companyName:get('companyName'),workEmail:get('workEmail'),email:get('email'),country:get('country'),selectCountry:get('selectCountry'),dialCode:get('dialCode'),code:get('code'),phoneNumber:get('phoneNumber'),companyWebsite:get('companyWebsite'),industry:get('industry'),product:get('product'),productInterest:get('productInterest'),selectProduct:get('selectProduct'),indicativeVolume:get('indicativeVolume'),estimatedVolume:get('estimatedVolume'),preferredChannel:get('preferredChannel'),message:get('message'),specificationNotes:get('specificationNotes'),consent:get('consent'),privacyPolicy:get('privacyPolicy'),incomplete:get('incomplete'),sending:get('sending'),sendRequest:get('sendRequest'),cancel:get('cancel'),submitEnquiry:get('submitEnquiry'),whatsappSales:get('whatsappSales'),quoteSuccess:get('quoteSuccess'),quoteFailure:get('quoteFailure'),contactFailure:get('contactFailure'),fullNamePlaceholder:get('fullNamePlaceholder'),jobTitlePlaceholder:get('jobTitlePlaceholder'),companyPlaceholder:get('companyPlaceholder'),countryPlaceholder:get('countryPlaceholder'),emailPlaceholder:get('emailPlaceholder'),phonePlaceholder:get('phonePlaceholder'),websitePlaceholder:get('websitePlaceholder'),volumePlaceholder:get('volumePlaceholder'),quoteVolumePlaceholder:get('quoteVolumePlaceholder'),messagePlaceholder:get('messagePlaceholder'),quoteMessagePlaceholder:get('quoteMessagePlaceholder'),requiredName:get('requiredName'),requiredEmail:get('requiredEmail'),validEmail:get('validEmail'),requiredDialCode:get('requiredDialCode'),requiredPhone:get('requiredPhone'),requiredCompany:get('requiredCompany'),requiredCountry:get('requiredCountry'),requiredConsent:get('requiredConsent'),
    options:{
      'Beverage':option('beverage'),'Sauces & condiments':option('sauces'),'Dairy':option('dairy'),'Confectionery':option('confectionery'),'Bakery':option('bakery'),'Prepared foods':option('prepared'),'Other':option('other'),'Tomato concentrates':option('tomato'),'Fruit concentrates':option('fruitConcentrates'),'Fruit purees':option('fruitPurees'),'Chilli concentrate':option('chilli'),'Not sure yet':option('unsure'),'WhatsApp':option('whatsapp'),'Email':option('email'),'Call':option('call'),
    } satisfies Record<EnquiryOption,string>,
  }
}
