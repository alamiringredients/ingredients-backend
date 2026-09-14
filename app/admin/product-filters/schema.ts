import {field, schema} from '@holo-js/forms/schema'

export const productFilterForm = schema({
  id: field.number().required().integer().min(0),
  group: field.string().required().in(['applications', 'concentrations']),
  slug: field.string().required().max(100).custom(value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value), 'Use lowercase letters, numbers and hyphens.'),
  en: field.string().required().max(200),
  ar: field.string().required().max(200),
  fr: field.string().required().max(200),
  sort_order: field.number().required().integer().min(0),
  is_active: field.boolean().required(),
})
