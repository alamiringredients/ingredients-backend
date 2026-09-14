"use client";
import { AdminForm } from './admin-form';
import { AdminPageHeader } from './admin-page-header';

import {
CatalogField,
CatalogFormGrid,
CatalogFormMain,
CatalogFormSidebar
} from "./catalog-layout";
import { CatalogPanel } from "./catalog-panel";

import { saveNewsTaxonomy } from "@/app/admin/news/actions";
import type { AdminCapabilities } from "@/lib/admin/access";
import { newsLocales,type NewsTaxonomy } from "@/lib/news/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocalizedFields,UrlField } from "./cms-fields";
import { AdminFormProvider,FormNotice,useAdminForm,type AdminResult } from "./form-feedback";
export function NewsTaxonomyManager({
  kind,
  capabilities,
  initial,
}: {
  items: NewsTaxonomy[];
  kind: "category" | "tag";
  capabilities: AdminCapabilities;
  initial?: NewsTaxonomy;
}) {
  const [record, setRecord] = useState(initial);
  const holoForm = useAdminForm(record ?? null);
  const busy=holoForm.submitting, result=holoForm.result;
  const router = useRouter(),
    title = kind === "category" ? "News categories" : "News tags",
    base = kind === "category" ? "/admin/news-categories" : "/admin/news-tags";
  const run = async (action: () => Promise<AdminResult>) => {
    const response=await holoForm.run(action);
    if(response?.ok)router.refresh();
  };
  if (!record) throw new Error('An editor record is required.')

  const localized = (key: "name" | "description") =>
    Object.fromEntries(
      newsLocales.map((l) => [l, record.content[l][key]]),
    ) as Record<(typeof newsLocales)[number], string>;
  const update = (
    key: "name" | "description",
    value: Record<(typeof newsLocales)[number], string>,
  ) =>
    setRecord({
      ...record,
      content: Object.fromEntries(
        newsLocales.map((l) => [l, { ...record.content[l], [key]: value[l] }]),
      ) as NewsTaxonomy["content"],
    });
  const canEdit = record.id ? capabilities.edit : capabilities.create;
  return (
    <AdminFormProvider form={holoForm}><section
      className="catalog-admin-page catalog-edit-page"
      onChangeCapture={() => holoForm.change()}
    >
      <AdminForm
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void (async () => {
            await run(
                () => saveNewsTaxonomy(record.id, JSON.stringify(record)),
                );
          })();
        }}
      >
        <AdminPageHeader title={
            <>{record.id ? `Edit ${record.content.en.name}` : `Add ${kind}`}</>
          } eyebrow={<>News / {title}</>} backHref={base} creating={!record.id} noun={kind} submitting={busy} canSave={canEdit} sticky/>
        <FormNotice result={result} />
        <CatalogFormGrid>
          <CatalogFormMain>
            <CatalogPanel
              title={<>Basic information</>}
              description={
                <>Enter the customer-facing content in all three languages.</>
              }
              bodyClassName="catalog-panel-body"
            >
              <LocalizedFields
                name={(locale)=>`content.${locale}.name`} label="Name"
                value={localized("name")}
                onChange={(v) => update("name", v)}
              />
              <LocalizedFields
                name={(locale)=>`content.${locale}.description`} label="Description"
                multiline
                value={localized("description")}
                onChange={(v) => update("description", v)}
              />
            </CatalogPanel>
          </CatalogFormMain>
          <CatalogFormSidebar>
            <CatalogPanel
              title={<>Organization</>}
              bodyClassName="catalog-panel-body"
            >
              <UrlField name="slug"
                label="URL slug"
                value={record.slug}
                onChange={(slug) => setRecord({ ...record, slug })}
              />
              <CatalogField name="sort_order">
                <span>Display order</span>
                <input
                  type="number"
                  value={record.sort_order}
                  onChange={(e) =>
                    setRecord({ ...record, sort_order: Number(e.target.value) })
                  }
                />
              </CatalogField>
            </CatalogPanel>
          </CatalogFormSidebar>
        </CatalogFormGrid>
      </AdminForm>
    </section></AdminFormProvider>
  );
}
