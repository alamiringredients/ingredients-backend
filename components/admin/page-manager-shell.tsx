'use client'
import type { ReactNode } from 'react';
import { CmsPageLayout } from './catalog-layout';
import {AdminPageHeader} from './admin-page-header'

export function PageManagerShell({title,navigation,children,saving,canSave=true}:{title:ReactNode;navigation:ReactNode;children:ReactNode;saving:boolean;canSave?:boolean}){
  return <><AdminPageHeader title={title} submitting={saving} canSave={canSave} sticky/><CmsPageLayout navigation={navigation}><fieldset className="news-crud-fields" disabled={!canSave || saving}>{children}</fieldset></CmsPageLayout></>
}
