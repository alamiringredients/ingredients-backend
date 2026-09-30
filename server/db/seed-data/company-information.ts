import type {CompanyInformation} from '@/lib/cms/company-information'

export const companyInformationDefaults: CompanyInformation = {
  email: 'sales@alamiringredients.com',
  phone: '(+20) 100 32 444 22',
  exportPhone: '+20 100 550 5020',
  secondaryPhone: '+20 122 157 7774',
  website: 'https://www.alamiringredients.com',
  address: {
    en: 'Industrial Zone, Sadat City,\nMenoufia, Egypt',
    ar: 'المنطقة الصناعية، مدينة السادات،\nالمنوفية، مصر',
    fr: 'Zone industrielle, ville de Sadat,\nMenoufia, Égypte',
  },
  socialLinks: {
    facebook: 'https://www.facebook.com/',
    instagram: 'https://www.instagram.com/',
    linkedin: 'https://www.linkedin.com/',
    youtube: 'https://www.youtube.com/',
    whatsapp: 'https://wa.me/201005505020',
  },
  salesWhatsapp: 'https://wa.me/201005505020?text=Hello%20Alamir%20Ingredients%2C%20I%20would%20like%20to%20speak%20with%20your%20sales%20team%20about%20tomato%20and%20fruit%20concentrates.',
}
