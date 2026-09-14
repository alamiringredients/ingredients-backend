'use client'

import type {PaginationMeta} from '@holo-js/db'
import {pageSizes, paginationPages} from '@/lib/admin/pagination'
import {CatalogButton, CatalogButtonLink} from './catalog-button'

export function CrudPagination({meta, href, onPageSizeChange, pending = false}: {
  meta: PaginationMeta; href: (page: number) => string; onPageSizeChange: (size: number) => void; pending?: boolean
}) {
  if (meta.lastPage <= 1) return null

  const arrow = (direction: 'previous' | 'next') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={direction === 'previous' ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'}/></svg>
  return <footer className="crud-pagination" aria-busy={pending}>
    <p className="crud-pagination-summary">Showing <strong>{meta.from ?? 0}</strong> to <strong>{meta.to ?? 0}</strong> of <strong>{meta.total.toLocaleString('en')}</strong> results</p>
    <label className="crud-pagination-size"><span>Per page</span><select aria-label="Results per page" value={meta.perPage} disabled={pending} onChange={event => onPageSizeChange(Number(event.target.value))}>{pageSizes.map(size => <option key={size} value={size}>{size}</option>)}</select></label>
    <nav className="crud-pagination-pages" aria-label="Pagination">
      {meta.currentPage > 1 ? <CatalogButtonLink href={href(meta.currentPage - 1)} scroll={false} prefetch={false} className="crud-pagination-previous" aria-label="Previous page">{arrow('previous')}<span className="crud-pagination-mobile-label">Previous</span></CatalogButtonLink> : <CatalogButton disabled className="crud-pagination-previous" aria-label="Previous page">{arrow('previous')}<span className="crud-pagination-mobile-label">Previous</span></CatalogButton>}
      {paginationPages(meta.currentPage, meta.lastPage).map((page, index) => page === 'ellipsis'
        ? <span className="crud-pagination-gap" key={`gap-${index}`} aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="3" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="13" cy="8" r="1"/></svg></span>
        : <CatalogButtonLink key={page} className="crud-pagination-number" href={href(page)} scroll={false} prefetch={false} aria-label={`Page ${page}`} aria-current={page === meta.currentPage ? 'page' : undefined}>{page}</CatalogButtonLink>)}
      {meta.hasMorePages ? <CatalogButtonLink href={href(meta.currentPage + 1)} scroll={false} prefetch={false} className="crud-pagination-next" aria-label="Next page"><span className="crud-pagination-mobile-label">Next</span>{arrow('next')}</CatalogButtonLink> : <CatalogButton disabled className="crud-pagination-next" aria-label="Next page"><span className="crud-pagination-mobile-label">Next</span>{arrow('next')}</CatalogButton>}
    </nav>
  </footer>
}
