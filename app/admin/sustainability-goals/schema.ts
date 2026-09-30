import {field, schema} from '@holo-js/forms/schema'

export const goalForm = schema({
  name: {en: field.string().required().max(255), ar: field.string().required().max(255), fr: field.string().required().max(255)},
  alt: {en: field.string().default('').max(2000), ar: field.string().default('').max(2000), fr: field.string().default('').max(2000)},
  image: field.string().default('').max(2000),
  color: field.string().required().custom(value => /^#[a-f0-9]{6}$/i.test(value), 'Choose a valid color.'),
  sortOrder: field.number().required().custom(value => Number.isSafeInteger(value) && value >= 0, 'Enter a whole number of zero or greater.'),
})
