import {notFound} from 'next/navigation'
import {SustainabilityGoalManager} from '@/components/admin/sustainability-goal-manager'
import {getSustainabilityGoals} from '@/server/services/sustainability/records'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'

export default async function Page({params, searchParams}: {params: Promise<{id:string}>; searchParams: Promise<{saved?:string}>}) {
  await requireAdminPagePermission('sustainability_goals', 'edit')
  const {id} = await params
  const goal = (await getSustainabilityGoals()).find(goal => goal.id === Number(id))
  if (!goal) notFound()
  return <SustainabilityGoalManager key={goal.id} initial={goal} saved={(await searchParams).saved === '1'} canEdit={(await getAdminResourceCapabilities('sustainability_goals')).edit}/>
}
