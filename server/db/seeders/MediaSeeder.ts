import {DB, defineSeeder} from '@holo-js/db'
import source from '../seed-data/site-content.json'

export default defineSeeder({
  name: 'media',
  async run() {
    for (const row of source.media) {
      if (await DB.table('media').where('id', row.id).first()) continue
      await DB.table('media').insert({...row, generated_conversions: JSON.stringify(row.generated_conversions)})
    }
  },
})
