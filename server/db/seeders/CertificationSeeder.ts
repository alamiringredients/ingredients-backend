import {DB, defineSeeder} from '@holo-js/db'
import {cmsLocales} from '@/lib/cms/contracts'
import source from '../seed-data/site-content.json'
import Certification from '@/server/models/Certification'
import CertificationTranslation from '@/server/models/CertificationTranslation'
import CertificationType from '@/server/models/CertificationType'
import CertificationTypeTranslation from '@/server/models/CertificationTypeTranslation'

export default defineSeeder({
  name: 'certifications',
  async run() {
    await CertificationType.unguarded(async () => {
      for (const row of source.certification_types) {
        if (await CertificationType.find(row.id)) continue
        const {content, ...attributes} = row
        await DB.table('certification_types').insert({
          ...attributes,
          kind: content.kind,
          logo: content.logo,
          badge: content.badge,
        })
        const type = await CertificationType.findOrFail(row.id)
        for (const locale of cmsLocales) {
          await CertificationTypeTranslation.create({
            type_id: Number(type.id),
            locale,
            name: content.name[locale],
            description: content.description[locale],
          })
        }
      }
    })

    await Certification.unguarded(async () => {
      for (const row of source.certifications) {
        if (await Certification.find(row.id)) continue
        const {content, ...attributes} = row
        await DB.table('certifications').insert({
          ...attributes,
          published: Boolean(attributes.published),
          target_date: content.target_date ? new Date(`${content.target_date}T00:00:00.000Z`) : null,
          issue_date: content.issue_date ? new Date(`${content.issue_date}T00:00:00.000Z`) : null,
          expiry_date: content.expiry_date ? new Date(`${content.expiry_date}T00:00:00.000Z`) : null,
          certificate_number: content.certificate_number,
          document: content.document,
        })
        const certification = await Certification.findOrFail(row.id)
        for (const locale of cmsLocales) {
          await CertificationTranslation.create({
            certification_id: Number(certification.id),
            locale,
            scope: content.scope[locale],
          })
        }
      }
    })
  },
})
