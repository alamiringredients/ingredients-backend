import {DB} from '@holo-js/db'

export async function getProductFilters(selectedGroup:'applications'|'concentrations') {
  const records:{id:number;group:'applications'|'concentrations';slug:string;en:string;ar:string;fr:string;sort_order:number;is_active:boolean}[]=[]
  for (const [group, table, key] of [['applications', 'product_applications', 'application_id'], ['concentrations', 'concentration_ranges', 'concentration_id']] as const) {
    if (group !== selectedGroup) continue
    const [options, translations] = await Promise.all([DB.table(table).orderBy('sort_order').orderBy('id').get(), DB.table(table === 'product_applications' ? 'application_translations' : 'concentration_translations').get()])
    for (const option of options) {
      const names = Object.fromEntries(translations.filter(row => Number(row[key]) === Number(option.id)).map(row => [String(row.locale), String(row.name)]))
      records.push({id: Number(option.id), group, slug: String(option.slug), en: names.en ?? '', ar: names.ar ?? '', fr: names.fr ?? '', sort_order: Number(option.sort_order), is_active: Boolean(option.is_active)})
    }
  }
  return records
}
