import {CertificationManager} from '@/components/admin/certification-manager'
import {getCertifications} from '@/server/services/certifications/content'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
import {notFound} from 'next/navigation'
export default async function Page({params}: {params: Promise<{id: string}>}) {
  await requireAdminPagePermission('certifications', 'edit')
  const {id} = await params
  const data = await getCertifications(true)
  const record = data.certifications.find(record => record.id === Number(id))
  if (!record) notFound()
  return <CertificationManager key={record.id} data={data} kind="certification" capabilities={await getAdminResourceCapabilities('certifications')} initialRecord={record}/>
}
