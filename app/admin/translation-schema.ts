import {field, schema} from '@holo-js/forms/schema'

export const translationsForm=schema({
  translations:field.array({
    key:field.string().required('A translation key is required.'),
    locale:field.string().required('A locale is required.').in(['en','ar','fr']),
    value:field.string().required('This field is required.').max(20000).transform(value=>value.trim()),
  }).required('Submit at least one translation.').min(1),
})
