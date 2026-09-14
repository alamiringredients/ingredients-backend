import {defineMigration} from '@holo-js/db'

export default defineMigration({
  async up({schema}){
    await schema.createTable('events',t=>{t.id();t.string('slug').unique();t.string('kind').default('event');t.boolean('published').default(false);t.integer('sort_order').default(0);t.datetime('starts_at');t.datetime('ends_at');t.string('timezone').default('Africa/Cairo');t.json('content');t.timestamps();t.index(['published','starts_at']);t.index(['sort_order'])})
    await schema.createTable('event_slots', t => {
      t.id(); t.bigInteger('event_id'); t.datetime('starts_at'); t.datetime('ends_at'); t.string('status').default('available'); t.timestamps()
      t.unique(['event_id', 'starts_at']); t.index(['event_id', 'status', 'starts_at'])
      t.foreign('event_id').references('id').on('events').onDelete('cascade')
    })
    await schema.createTable('event_reservations', t => {
      t.id(); t.bigInteger('slot_id').unique(); t.string('status').default('reserved')
      t.string('name'); t.string('company'); t.string('email'); t.string('country'); t.string('dial_code'); t.string('phone'); t.string('topic'); t.text('message').nullable(); t.string('locale')
      t.string('submission_key').unique(); t.string('mail_status').default('pending'); t.string('message_id').nullable(); t.timestamp('reserved_at'); t.timestamps()
      t.foreign('slot_id').references('id').on('event_slots').onDelete('restrict')
      t.index(['email']); t.index(['mail_status', 'id'])
    })
    await schema.createTable('contact_enquiries',t=>{t.id();t.string('source');t.string('status').default('open');t.string('name');t.string('email');t.string('company').default('');t.string('job_title').default('');t.string('country').default('');t.string('dial_code').default('');t.string('phone').default('');t.string('website').default('');t.string('industry').default('');t.string('product').default('');t.string('volume').default('');t.string('channel').default('');t.text('message');t.string('locale').default('en');t.string('submission_key').unique();t.timestamps();t.index(['status','created_at']);t.index(['email'])})
    await schema.createTable('contact_replies',t=>{t.id();t.bigInteger('enquiry_id');t.string('subject');t.text('body');t.string('status').default('sending');t.string('message_id').nullable();t.string('request_key').unique();t.index(['enquiry_id','id']);t.timestamps();t.foreign('enquiry_id').references('id').on('contact_enquiries').onDelete('cascade')})
  },
  async down({schema}){await schema.dropTable('contact_replies');await schema.dropTable('contact_enquiries');await schema.dropTable('event_reservations');await schema.dropTable('event_slots');await schema.dropTable('events')},
})
