import {field, schema} from '@holo-js/forms/schema'

export const saveCmsPayload = schema({
  key: field.string().required('A content key is required.'),
  payload: field.string().required('Content is required.'),
})

export const companyInformation = schema({
  company: {
    email: field.string().default('').max(254),
    phone: field.string().default('').max(60),
    exportPhone: field.string().default('').max(60),
    secondaryPhone: field.string().default('').max(60),
    website: field.string().default('').max(2000).custom(value => !value || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value), 'Enter an HTTP or HTTPS URL.'),
    address: {en: field.string().default('').max(1000), ar: field.string().default('').max(1000), fr: field.string().default('').max(1000)},
    socialLinks: {
      facebook: field.string().default('').max(2000).custom(value => !value || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value), 'Enter an HTTP or HTTPS URL.'), instagram: field.string().default('').max(2000).custom(value => !value || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value), 'Enter an HTTP or HTTPS URL.'),
      linkedin: field.string().default('').max(2000).custom(value => !value || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value), 'Enter an HTTP or HTTPS URL.'), youtube: field.string().default('').max(2000).custom(value => !value || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value), 'Enter an HTTP or HTTPS URL.'), whatsapp: field.string().default('').max(2000).custom(value => !value || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value), 'Enter an HTTP or HTTPS URL.'),
    },
    salesWhatsapp: field.string().default('').max(2000).custom(value => !value || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value), 'Enter an HTTP or HTTPS URL.'),
  },
})

export const homeFigures = schema({
  figures: field.array({
    id: field.string().required(),
    value: field.number().required('Enter a number.').min(0).max(Number.MAX_SAFE_INTEGER),
    unit: field.string().default('').max(20),
    unitLabel: {en:field.string().default('').max(30),ar:field.string().default('').max(30),fr:field.string().default('').max(30)},
    label: {en:field.string().required('Enter an English label.').max(200),ar:field.string().default('').max(200),fr:field.string().default('').max(200)},
    description: {en:field.string().default('').max(500),ar:field.string().default('').max(500),fr:field.string().default('').max(500)},
  }).default([]).max(30).custom(items=>new Set(items.map(item=>item.id)).size===items.length||'Figure IDs must be unique.'),
})

export const uploadCmsFile = schema({
  ownerType: field.string().required('A media owner type is required.'),
  ownerKey: field.string().required('A media owner key is required.'),
  conversion: field.string().required('An image conversion is required.'),
  file: field.file().required('Choose a file to upload.').maxSize('100mb', 'Files must be smaller than 100 MB.'),
})
