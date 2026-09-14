"use client";
import { uploadCmsFileAction } from "@/app/admin/actions";
import { saveEditorialPage } from "@/app/admin/career-actions";
import { ContentEditor } from "@/components/editor/content-editor";
import type { AboutContent,CareersContent } from "@/lib/careers/contracts";
import type {QualityPageContent} from '@/lib/cms/contracts'
import type { CmsLocale } from "@/lib/cms/contracts";
import { useState } from "react";
import { AdminForm } from './admin-form';
import { ArticleLanguages,EditorField } from "./article-fields";
import { CatalogTabButton } from "./catalog-button";
import {
CatalogField,
CmsSectionTabs,
} from "./catalog-layout";
import { CatalogPanel } from "./catalog-panel";
import { AssetField,LocalizedFields,UrlField } from "./cms-fields";
import { AdminFormProvider,FieldGroup,FormNotice,useAdminForm } from "./form-feedback";
import { LocalizedEditor } from "./localized-editor";
import { PageManagerShell } from "./page-manager-shell";
export function EditorialPageManager({
  page,
  initial,
  canEdit,
  news = [],
}: {
  page: "about" | "careers" | "quality";
  initial: AboutContent | CareersContent | QualityPageContent;
  canEdit: boolean;
  news?: { id: number; title: string }[];
}) {
  const [value, setValue] = useState(initial),
    [tab, setTab] = useState("hero"),
    [locale, setLocale] = useState<CmsLocale>("en"),
    form = useAdminForm(value),
    busy = form.submitting;
  const title = page === "about" ? "About page" : page === 'quality' ? 'Quality page' : "Careers page",
    tabs =
      page !== "careers"
        ? [
            ["hero", "Hero"],
            ["body", "Body content"],
            ["seo", "SEO and sharing"],
          ]
        : [
            ["hero", "Hero"],
            ["news", "News section"],
            ["jobs", "Open positions"],
            ["apply", "Application section"],
            ["seo", "SEO and sharing"],
          ];
  const update = (patch: Partial<AboutContent & CareersContent>) => {
    setValue((v) => ({ ...v, ...patch }) as typeof v);
    form.change();
  };
  const updateVisibility = (key: string, enabled: boolean) => {
    setValue(
      (current) =>
        ({
          ...current,
          sectionVisibility: { ...current.sectionVisibility, [key]: enabled },
        }) as AboutContent | CareersContent | QualityPageContent,
    );
    form.change();
  };
  const upload = async (file: File) => {
    const data = new FormData();
    data.set("file", file);
    data.set("ownerType", "website-setting");
    data.set("ownerKey", page);
    data.set("conversion", "optimized");
    const r = await uploadCmsFileAction(data);
    if(!r.ok||!('url' in r)||!r.url)throw new Error(r.message);
    return r.url;
  };
  const hero = value.hero,
    career = value as CareersContent;
  const section =
    tab === "news"
      ? ({
          title: "newsTitle",
          intro: "newsIntro",
          kicker: "newsKicker",
        } as const)
      : tab === "jobs"
        ? ({
            title: "jobsTitle",
            intro: "jobsIntro",
            kicker: "jobsKicker",
          } as const)
        : ({
            title: "applyTitle",
            intro: "applyIntro",
            kicker: "applyKicker",
          } as const);
  return (
    <AdminFormProvider form={form} reveal={name=>{const key=name.split(".")[0];setTab(key.startsWith("news")?"news":key.startsWith("jobs")||key==="empty"?"jobs":key.startsWith("apply")?"apply":key==="seo"?"seo":key==="body"?"body":"hero");const language=name.match(/\.(en|ar|fr)$/)?.[1];if(language)setLocale(language as CmsLocale)}}>
    <section onChangeCapture={() => form.change()}>
      <AdminForm
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          await form.run(() => saveEditorialPage(page, JSON.stringify(value)));
        }}
      >
        <fieldset className="news-crud-fields" disabled={!canEdit || busy}>
          <PageManagerShell
            title={title}

            saving={busy}
            canSave={canEdit}
            navigation={
              <CmsSectionTabs aria-label={`${title} sections`}>
                {tabs.map(([key, label]) => (
                  <CatalogTabButton
                    key={key}
                    active={tab === key}
                    onClick={() => setTab(key)}
                  >
                    {label}
                  </CatalogTabButton>
                ))}
              </CmsSectionTabs>
            }
          >
            <FormNotice result={form.result} />
            <div className="cms-editor-head">
              <h2>{tabs.find(([key]) => key === tab)?.[1]}</h2>
              {tab !== "seo" && (
                <label className="cms-toggle">
                  <input
                    type="checkbox"
                    checked={
                      value.sectionVisibility[
                        tab as keyof typeof value.sectionVisibility
                      ]
                    }
                    onChange={(event) =>
                      updateVisibility(tab, event.target.checked)
                    }
                  />
                  <span />
                  Show section
                </label>
              )}
            </div>
            {tab === "hero" && (
              <>
                <CatalogPanel title="Text in all languages">
                  <LocalizedEditor
                    label="Heading"
                    editable={canEdit && !busy}
                    value={hero.title}
                    onChange={(title) => update({ hero: { ...hero, title } })}
                  />
                  <LocalizedEditor
                    appearance="body"
                    label="Introduction"
                    editable={canEdit && !busy}
                    value={hero.description}
                    onChange={(description) =>
                      update({ hero: { ...hero, description } })
                    }
                  />
                  <LocalizedFields
                    label="Eyebrow"
                    value={hero.kicker}
                    onChange={(kicker) => update({ hero: { ...hero, kicker } })}
                  />
                </CatalogPanel>
                <CatalogPanel title="Hero image">
                  <AssetField name="hero.image"
                    field={{
                      id: "hero",
                      label: "Image",
                      kind: "image",
                      source: "",
                      value: hero.image,
                    }}
                    owner={{ type: "website-setting", key: page }}
                    onChange={(image) => update({ hero: { ...hero, image } })}
                  />
                  <LocalizedFields
                    label="Alternative text"
                    value={hero.alt}
                    onChange={(alt) => update({ hero: { ...hero, alt } })}
                  />
                </CatalogPanel>
              </>
            )}
            {tab === "body" && (
              <CatalogPanel title="Body content">
                <ArticleLanguages
                  locale={locale}
                  onChange={setLocale}
                  label="Body language"
                />
                <EditorField name={`body.${locale}`} label="Body content"><ContentEditor
                  key={locale}
                  locale={locale}
                  blockSet={page==='quality'?'quality':'default'}
                  editable={canEdit && !busy}
                  value={(value as AboutContent).body[locale]}
                  upload={upload}
                  onChange={(body) =>
                    update({
                      body: { ...(value as AboutContent).body, [locale]: body },
                    })
                  }
                /></EditorField>
              </CatalogPanel>
            )}
            {["news", "jobs", "apply"].includes(tab) && (
              <CatalogPanel title="Text in all languages">
                <LocalizedEditor
                  key={section.title}
                  editable={canEdit && !busy}
                  label="Heading"
                  value={career[section.title]}
                  onChange={(doc) => update({ [section.title]: doc })}
                />
                <LocalizedEditor
                  key={section.intro}
                  editable={canEdit && !busy}
                  appearance="body"
                  label="Introduction"
                  value={career[section.intro]}
                  onChange={(doc) => update({ [section.intro]: doc })}
                />
                <LocalizedFields
                  label="Eyebrow"
                  value={career[section.kicker]}
                  onChange={(text) => update({ [section.kicker]: text })}
                />
                {tab === "jobs" && (
                  <LocalizedFields
                    label="No open positions message"
                    value={career.empty}
                    onChange={(empty) => update({ empty })}
                  />
                )}
              </CatalogPanel>
            )}
            {tab === "news" && (
              <CatalogPanel title="Introduction image">
                <AssetField name="newsImage"
                  field={{
                    id: "news-image",
                    label: "Image",
                    kind: "image",
                    source: "",
                    value: career.newsImage,
                  }}
                  owner={{ type: "website-setting", key: page }}
                  onChange={(newsImage) => update({ newsImage })}
                />
                <LocalizedFields
                  label="Alternative text"
                  value={career.newsImageAlt}
                  onChange={(newsImageAlt) => update({ newsImageAlt })}
                />
              </CatalogPanel>
            )}
            {tab === "news" && (
              <CatalogPanel title="Three News articles"><FieldGroup name="newsIds">
                {[0, 1, 2].map((index) => (
                  <CatalogField name={`newsIds.${index}`} key={index}>
                    <span>Article {index + 1}</span>
                    <select
                      value={career.newsIds[index] ?? ""}
                      onChange={(e) =>
                        update({
                          newsIds: career.newsIds.map((id, i) =>
                            i === index ? Number(e.target.value) : id,
                          ),
                        })
                      }
                    >
                      <option value="">Select an article</option>
                      {news.map((n) => (
                        <option key={n.id} value={n.id}>
                          {n.title}
                        </option>
                      ))}
                    </select>
                  </CatalogField>
                ))}
              </FieldGroup></CatalogPanel>
            )}
            {tab === "seo" && (
              <CatalogPanel title="Search engines">
                {(
                  [
                    "title",
                    "description",
                    "socialTitle",
                    "socialDescription",
                  ] as const
                ).map((key, i) => (
                  <LocalizedFields
                    key={key}
                    label={
                      [
                        "Page title",
                        "Meta description",
                        "Social title",
                        "Social description",
                      ][i]
                    }
                    value={value.seo[key]}
                    multiline={key.includes("escription")}
                    onChange={(v) =>
                      update({ seo: { ...value.seo, [key]: v } })
                    }
                  />
                ))}
                <UrlField name="seo.socialImage"
                  label="Social image"
                  media
                  owner={{ type: "website-setting", key: page }}
                  value={value.seo.socialImage}
                  onChange={(socialImage) =>
                    update({ seo: { ...value.seo, socialImage } })
                  }
                />
              </CatalogPanel>
            )}
          </PageManagerShell>
        </fieldset>
      </AdminForm>
    </section>
    </AdminFormProvider>
  );
}
