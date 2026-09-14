import {CertificationManager} from '@/components/admin/certification-manager'
import {getCertifications} from '@/server/services/certifications/content'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
import {newCertificationType} from '@/lib/certifications/contracts'
export default async function Page() {
  await requireAdminPagePermission('certification_types', 'create')
  return <CertificationManager data={await getCertifications(true)} kind="certification-type" capabilities={await getAdminResourceCapabilities('certification_types')} initialRecord={newCertificationType()}/>
}
