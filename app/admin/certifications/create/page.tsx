import {CertificationManager} from '@/components/admin/certification-manager'
import {getCertifications} from '@/server/services/certifications/content'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
import {newCertification} from '@/lib/certifications/contracts'
export default async function Page() {
  await requireAdminPagePermission('certifications', 'create')
  return <CertificationManager data={await getCertifications(true)} kind="certification" capabilities={await getAdminResourceCapabilities('certifications')} initialRecord={newCertification()}/>
}
