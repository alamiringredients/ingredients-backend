"use client";
import { uploadCmsFileAction } from "@/app/admin/actions";
import { saveJob } from "@/app/admin/career-actions";
import { ContentEditor } from "@/components/editor/content-editor";
import type { JobLocale,JobRecord } from "@/lib/careers/contracts";
import type { CmsLocale } from "@/lib/cms/contracts";
import { useState } from "react";
import { AdminForm } from './admin-form';
import { AdminPageHeader } from './admin-page-header';
import {
ArticleLanguages,
ArticleTextField,
EditorField,
} from "./article-fields";
import {
CatalogField,
CatalogFormGrid,
CatalogFormMain,
CatalogFormSidebar
} from "./catalog-layout";
import { CatalogPanel } from "./catalog-panel";
import { AssetField } from "./cms-fields";
import { AdminFormProvider,FormNotice,useAdminForm } from "./form-feedback";
export function JobEditor({
  initial,
  canEdit,
}: {
  initial: JobRecord;
  canEdit: boolean;
}) {
  const [job, setJob] = useState(initial),
    [locale, setLocale] = useState<CmsLocale>("en");
  const holoForm = useAdminForm(job);
  const busy=holoForm.submitting, result=holoForm.result;
  const v = job.content[locale],
    update = (patch: Partial<JobLocale>) =>
      setJob((j) => ({
        ...j,
        content: { ...j.content, [locale]: { ...j.content[locale], ...patch } },
      }));
  const text = (
    key: Exclude<keyof JobLocale, "body">,
    label: string,
    multiline = false,
  ) => (
    <ArticleTextField name={`content.${locale}.${key}`}
      label={label}
      value={v[key]}
      locale={locale}
      multiline={multiline}
      onChange={(value) => update({ [key]: value })}
    />
  );
  const upload = async (file: File) => {
    const data = new FormData();
    data.set("file", file);
    data.set("ownerType", "career-job");
    data.set("ownerKey", String(job.id));
    data.set("conversion", "optimized");
    const r = await uploadCmsFileAction(data);
    if(!r.ok||!('url' in r)||!r.url)throw new Error(r.message);
    return r.url;
  };
  return (
    <AdminFormProvider form={holoForm} reveal={name=>{const language=name.match(/(?:cmsLocales|content)\.(en|ar|fr)(?:\.|$)/)?.[1];if(language)setLocale(language as CmsLocale)}}><section className="catalog-admin-page catalog-edit-page news-crud">
      <AdminForm
        noValidate
        onChangeCapture={() => holoForm.change()}
        onSubmit={async (e) => {
          e.preventDefault();
          await holoForm.run(() => saveJob(job.id, JSON.stringify(job)));
        }}
      >
        <AdminPageHeader title={job.id ? `Edit ${job.content.en.title}` : "Add job"} eyebrow="Recruitment / Careers" backHref="/admin/careers" creating={!job.id} noun="job" submitting={busy} canSave={canEdit} sticky/>
        <FormNotice result={result} />
        <fieldset className="news-crud-fields" disabled={!canEdit || busy}>
          <CatalogFormGrid>
            <CatalogFormMain>
              <CatalogPanel title="Role content">
                <ArticleLanguages locale={locale} onChange={setLocale} />
                {text("title", "Role title")}
                {text("summary", "Introduction", true)}
                <EditorField name={`content.${locale}.body`} label="Body content">
                  <ContentEditor
                    key={locale}
                    locale={locale}
                    value={v.body}
                    editable={canEdit && !busy}
                    upload={upload}
                    onChange={(body) => update({ body })}
                  />
                </EditorField>
              </CatalogPanel>
              <CatalogPanel title="Hero image">
                <AssetField name={`content.${locale}.hero`}
                  field={{
                    id: "hero",
                    label: "Image",
                    kind: "image",
                    source: "",
                    value: v.hero,
                  }}
                  owner={{ type: "career-job", key: String(job.id) }}
                  onChange={(hero) => update({ hero })}
                />
                {text("heroAlt", "Alternative text")}
              </CatalogPanel>
            </CatalogFormMain>
            <CatalogFormSidebar>
              <CatalogPanel title="Publishing">
                <CatalogField name="slug">
                  <span>URL slug</span>
                  <input
                    value={job.slug}
                    onChange={(e) => setJob({ ...job, slug: e.target.value })}
                  />
                </CatalogField>
                <CatalogField name="code">
                  <span>Code</span>
                  <input
                    value={job.code}
                    onChange={(e) => setJob({ ...job, code: e.target.value })}
                  />
                </CatalogField>
                <CatalogField name="status">
                  <span>Status</span>
                  <select
                    value={job.status}
                    onChange={(e) =>
                      setJob({
                        ...job,
                        status: e.target.value as JobRecord["status"],
                      })
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </CatalogField>
              </CatalogPanel>
              <CatalogPanel title="Role summary">
                {text("department", "Department")}
                {text("location", "Location")}
                {text("contract", "Contract")}
                {text("experience", "Experience")}
                {text("reportsTo", "Reports to")}
                {text("closing", "Closing date / availability")}
              </CatalogPanel>
            </CatalogFormSidebar>
          </CatalogFormGrid>
        </fieldset>
      </AdminForm>
    </section></AdminFormProvider>
  );
}
