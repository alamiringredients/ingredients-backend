import type {CrudFilter} from '@/lib/admin/crud-index'
import type {useCrudNavigation} from './use-crud-navigation'
import {CatalogButton} from './catalog-button'

export function CrudToolbar({title, filters, navigation}: {title: string; filters: CrudFilter[]; navigation: ReturnType<typeof useCrudNavigation>}) {
  const {query, selected, change, pending} = navigation
  return <div className="crud-toolbar" aria-busy={pending}>
    <label className="catalog-field crud-search"><span>Search</span><input type="search" value={query} onChange={event => change(event.target.value, selected, 600)} placeholder={`Search ${title.toLowerCase()}…`}/></label>
    {filters.map(filter => <label key={filter.key} className="catalog-field"><span>{filter.label}</span><select value={selected[filter.key] ?? ''} onChange={event => change(query, {...selected, [filter.key]: event.target.value})}><option value="">All</option>{filter.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
    {(query || Object.values(selected).some(Boolean)) && <CatalogButton type="button" onClick={() => change('', {})}>Clear filters</CatalogButton>}
  </div>
}
