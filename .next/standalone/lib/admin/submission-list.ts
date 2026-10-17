import type {PaginationMeta} from '@holo-js/db'
import type {ApplicationRecord} from '@/lib/careers/contracts'
import type {EnquiryRecord} from '@/lib/enquiries/contracts'

export type ApplicationSummary=Pick<ApplicationRecord,'id'|'name'|'email'|'job_title'|'department'|'status'|'created_at'>
export type EnquirySummary=Pick<EnquiryRecord,'id'|'name'|'email'|'company'|'product'|'source'|'status'|'created_at'>
export type ListSearchParams=Record<string,string|string[]|undefined>
export type SubmissionPagination={meta:PaginationMeta;query:string;filters:Record<string,string>}
