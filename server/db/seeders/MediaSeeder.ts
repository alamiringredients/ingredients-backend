import {DB, defineSeeder} from '@holo-js/db'
import source from '../seed-data/site-content.json'

export default defineSeeder({
  name: 'media',
  async run() {
    const existing = new Set((await DB.table('media').select('uuid').whereIn('uuid', source.media.map(row => row.uuid)).get()).map(row => row.uuid))
    const rows = source.media.filter(row => !existing.has(row.uuid)).map(row => ({
      ...Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'id')),
      disk: 'r2',
      generated_conversions: JSON.stringify(row.generated_conversions),
    }))
    if (rows.length) await DB.table('media').insert(rows)
  },
})
