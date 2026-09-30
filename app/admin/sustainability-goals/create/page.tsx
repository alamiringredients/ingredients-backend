import {SustainabilityGoalManager} from '@/components/admin/sustainability-goal-manager'
import {getAdminResourceCapabilities, requireAdminPagePermission} from '@/server/admin/authorization'

export default async function Page() {
  await requireAdminPagePermission('sustainability_goals', 'create')
  return <SustainabilityGoalManager initial={{id:0,color:'#4b7954',image:'',name:{en:'',ar:'',fr:''},alt:{en:'',ar:'',fr:''}}} canEdit={(await getAdminResourceCapabilities('sustainability_goals')).create}/>
}
