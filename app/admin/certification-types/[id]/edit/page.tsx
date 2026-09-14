import {CertificationManager} from '@/components/admin/certification-manager'
import {getCertifications} from '@/server/services/certifications/content'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'
import {notFound} from 'next/navigation'
export default async function Page({params}: {params: Promise<{id: string}>}) {
  await requireAdminPagePermission('certification_types', 'edit')
  const {id} = await params
  const data = await getCertifications(true)
  const record = data.types.find(record => record.id === Number(id))
  if (!record) notFound()
  return <CertificationManager key={record.id} data={data} kind="certification-type" capabilities={await getAdminResourceCapabilities('certification_types')} initialRecord={record}/>
}
