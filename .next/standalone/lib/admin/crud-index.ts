import type {SubmissionPagination} from './submission-list'
import type {AdminResource} from './access'

export type CrudCell = string | number | {label: string; active: boolean; detail?: string} | {href: string; label: string}
export type CrudIndexRow = {id: number; name: string; subtitle?: string; image?: string; cells: CrudCell[]}
export type CrudFilter = {key: string; label: string; options: {value: string; label: string}[]}
export type CrudIndexData = {
  title:string;section:string;noun:string;basePath:string;resource:AdminResource
  rows: CrudIndexRow[]; columns: string[]; filters: CrudFilter[]; stats: {label: string; value: number}[]; pagination: SubmissionPagination
}
