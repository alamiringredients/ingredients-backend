import {field, schema} from '@holo-js/forms/schema'

const catalogFields={
  slug:field.string().required('Enter a URL slug.').max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/,'Use lowercase letters, numbers and single hyphens.'),
  published:field.boolean().required(),
  sort_order:field.number().required('Enter a display order.').integer('Enter a whole number.'),
}

export const categoryForm=schema(catalogFields)
export const productForm=schema({...catalogFields,category_id:field.number().required('Choose a category.').integer().min(1)})
