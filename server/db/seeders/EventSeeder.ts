import {DB, defineSeeder} from '@holo-js/db'
import source from '../seed-data/site-content.json'
import Event from '@/server/models/Event'
import EventSlot from '@/server/models/EventSlot'
export const getEventSeedRecords = () => structuredClone(source.events)
export default defineSeeder({name: 'events', async run() {
  await Event.unguarded(async () => {
    for (const row of source.events) {
      if (await Event.find(row.id)) continue
      await DB.table('events').insert({...row, published: Boolean(row.published), starts_at: new Date(row.starts_at), ends_at: new Date(row.ends_at), content: JSON.stringify(row.content)})
    }
  })
  await EventSlot.unguarded(async () => {
    for (const row of source.event_slots) {
      if (await EventSlot.find(row.id)) continue
      await DB.table('event_slots').insert({...row, starts_at: new Date(row.starts_at), ends_at: new Date(row.ends_at)})
    }
  })
}})
