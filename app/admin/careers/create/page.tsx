import {JobEditor} from '@/components/admin/job-manager'
import {blankJob} from '@/lib/careers/contracts'
import {requireAdminPagePermission} from '@/server/admin/authorization'
export default async function Page(){await requireAdminPagePermission('career_jobs','create');return <JobEditor initial={blankJob()} canEdit/>}
