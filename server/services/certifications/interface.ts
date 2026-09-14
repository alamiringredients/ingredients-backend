import 'server-only'

import type {CertificationInterfaceLabels} from '@/lib/certifications/contracts'

export function buildCertificationInterfaceLabels(values: Record<string, string>): CertificationInterfaceLabels {
  const get = (suffix: string) => values[suffix] ?? ''
  return {
    group:get('al.amir.group'),facility:get('alamir.ingredients.sadat.city'),entries:get('credentials'),target:get('target'),unconfirmed:get('target.date.to.be.confirmed'),issued:get('issued'),expires:get('expires'),download:get('download.certificate'),downloads:get('view.available.certificates'),marks:get('certification.marks'),pdf:get('pdf'),
    statuses:{planned:get('planned'),'in-progress':get('in.progress'),held:get('held'),suspended:get('suspended'),expired:get('expired')},
  }
}
