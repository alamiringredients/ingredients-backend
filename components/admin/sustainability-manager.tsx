"use client";
import { AdminForm } from './admin-form';
import { AdminPageHeader } from './admin-page-header';
import {
CatalogButton,
CatalogButtonLink
} from "./catalog-button";

import {
CatalogActions,
CatalogField,
CatalogFormGrid,
CatalogFormMain,
CatalogFormSidebar
} from "./catalog-layout";

import { uploadCmsFileAction } from "@/app/admin/actions";
import {
saveSustainability,
sustainabilityRevisions,
} from "@/app/admin/sustainability/actions";
import { ContentEditor } from "@/components/editor/content-editor";
import type { AdminCapabilities } from "@/lib/admin/access";
import { textContent } from "@/lib/editor/document";
import type { CmsLocale } from "@/lib/cms/contracts";
import type {
SustainabilityPageContent,
SustainabilityRecord,
SustainabilityVersion,
} from "@/lib/sustainability/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
ArticleLanguages,
ArticleRevisionHistory,
ArticleTextField,
EditorField,
} from "./article-fields";
import { CatalogPanel as Panel } from "./catalog-panel";
import { AssetField } from "./cms-fields";
import { AdminFormProvider,FieldGroup,FormNotice,useAdminForm } from "./form-feedback";

export function SustainabilityManager({
  page,
  initial,
  capabilities,
}: {
  articles: SustainabilityRecord[];
  page: SustainabilityPageContent;
  initial?: SustainabilityRecord;
  capabilities: AdminCapabilities;
}) {
  const router = useRouter(),
    [record, setRecord] = useState(initial),
    [locale, setLocale] = useState<CmsLocale>("en"),
    [revisions, setRevisions] = useState<
      Awaited<ReturnType<typeof sustainabilityRevisions>>
    >([]);
  const holoForm = useAdminForm(record ?? null);
  const busy=holoForm.submitting, result=holoForm.result;
  const change = (r: SustainabilityRecord) => {
    setRecord(r);
    holoForm.change();
  };
  const update = (v: Partial<SustainabilityVersion>) => {
    if (record)
      change({
        ...record,
        content: {
          ...record.content,
          locales: {
            ...record.content.locales,
            [locale]: { ...record.content.locales[locale], ...v },
          },
        },
      });
  };
  const save = async (operation: "save" | "publish" | "unpublish" = "save") => {
    if (!record || busy) return;
    const r = await holoForm.run(() => saveSustainability(
        record.id,
        record.revision,
        record.slug,
        JSON.stringify(record.content),
        operation,
        locale,
      ));
      if(!r)return;
      if (r.ok && 'id' in r) {
        setRecord({ ...record, ...r, id:Number(r.id) } as SustainabilityRecord);

        router.refresh();
      }

  };
  const upload = async (file: File) => {
    if (!record?.id)
      throw new Error("Save the article before uploading media.");
    const data = new FormData();
    data.set("ownerType", "sustainability");
    data.set("ownerKey", String(record.id));
    data.set("conversion", "optimized");
    data.set("file", file);
    const r = await uploadCmsFileAction(data);
    if(!r.ok||!('url' in r)||!r.url)throw new Error(r.message);
    return r.url;
  };
  if (!record) throw new Error('An editor record is required.')

  const v = record.content.locales[locale],
    canEdit = record.id ? capabilities.edit : capabilities.create;
  const field = (
    key: keyof Pick<
      SustainabilityVersion,
      | "kicker"
      | "summary"
      | "cardSummary"
      | "badge"
      | "railIntro"
      | "note"
      | "seoTitle"
      | "seoDescription"
    >,
    label: string,
    multiline = false,
  ) => (
    <ArticleTextField name={`content.locales.${locale}.${key}`}
      label={label}
      value={String(v[key])}
      locale={locale}
      multiline={multiline}
      onChange={(value) => update({ [key]: value })}
    />
  );
  return (
    <AdminFormProvider form={holoForm} reveal={name=>{const language=name.match(/(?:locales|content)\.(en|ar|fr)(?:\.|$)/)?.[1];if(language)setLocale(language as CmsLocale)}}><section className="catalog-admin-page catalog-edit-page news-crud">
      <AdminForm
        noValidate
        onChangeCapture={() => holoForm.change()}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <AdminPageHeader title={
            <>
              {record.id
                ? `Edit ${textContent(record.content.locales.en.title)}`
                : "Add sustainability article"}
            </>
          } eyebrow="Sustainability / Articles" backHref="/admin/sustainability" creating={!record.id} noun="article" submitting={busy} canSave={canEdit} sticky/>
        <FormNotice result={result} />
        <fieldset className="news-crud-fields" disabled={!canEdit || busy}>
          <CatalogFormGrid>
            <CatalogFormMain>
              <Panel
                title="Article content"
                description="Choose a language to edit its title, introduction, and article body."
              >
                <ArticleLanguages locale={locale} onChange={setLocale} />
                <EditorField name={`content.locales.${locale}.title`} label="Title">
                  <ContentEditor
                    sectionGoals
                    editable={canEdit && !busy}
                    key={`title-${locale}`}
                    label="Article title"
                    compact
                    locale={locale}
                    value={v.title}
                    onChange={(title) => update({ title })}
                    upload={upload}
                  />
                </EditorField>
                {field("kicker", "Eyebrow")}
                {field("summary", "Introduction", true)}
                <EditorField name={`content.locales.${locale}.body`} label="Article body">
                  <ContentEditor
                    sectionGoals
                    editable={canEdit && !busy}
                    key={`body-${locale}`}
                    locale={locale}
                    value={v.body}
                    onChange={(body) => update({ body })}
                    upload={upload}
                  />
                </EditorField>
              </Panel>
              <Panel
                title="Hero gallery"
                description="Images appear in this order. The first image is also used on article cards."
              ><FieldGroup name={`content.locales.${locale}.gallery`}>
                <div className="catalog-field-list">
                  {v.gallery.map((image, i) => (
                    <div className="catalog-gallery-item" key={i}>
                      {record.id ? (
                        <AssetField name={`content.locales.${locale}.gallery.${i}.src`}
                          field={{
                            id: `hero-${i}`,
                            label: `Image ${i + 1}`,
                            kind: "image",
                            source: "",
                            value: image.src,
                          }}
                          owner={{
                            type: "sustainability",
                            key: String(record.id),
                          }}
                          onChange={(src) =>
                            update({
                              gallery: v.gallery.map((g, j) =>
                                j === i ? { ...g, src } : g,
                              ),
                            })
                          }
                        />
                      ) : (
                        <p>Save the article to upload images.</p>
                      )}
                      <CatalogField name={`content.locales.${locale}.gallery.${i}.alt`}>
                        <span>Alternative text</span>
                        <input
                          value={image.alt}
                          onChange={(e) =>
                            update({
                              gallery: v.gallery.map((g, j) =>
                                j === i ? { ...g, alt: e.target.value } : g,
                              ),
                            })
                          }
                        />
                      </CatalogField>
                      <CatalogField name={`content.locales.${locale}.gallery.${i}.caption`}>
                        <span>Caption</span>
                        <input
                          value={image.caption}
                          onChange={(e) =>
                            update({
                              gallery: v.gallery.map((g, j) =>
                                j === i ? { ...g, caption: e.target.value } : g,
                              ),
                            })
                          }
                        />
                      </CatalogField>
                      <CatalogActions>
                        <CatalogButton
                          type="button"
                          variant="secondary"
                          disabled={!i}
                          onClick={() => {
                            const gallery = [...v.gallery];
                            [gallery[i - 1], gallery[i]] = [
                              gallery[i],
                              gallery[i - 1],
                            ];
                            update({ gallery });
                          }}
                        >
                          Move up
                        </CatalogButton>
                        <CatalogButton
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            update({
                              gallery: v.gallery.filter((_, j) => i !== j),
                            })
                          }
                        >
                          Remove image
                        </CatalogButton>
                      </CatalogActions>
                    </div>
                  ))}
                  <CatalogButton
                    type="button"
                    variant="secondary"
                    disabled={v.gallery.length >= 12}
                    onClick={() =>
                      update({
                        gallery: [
                          ...v.gallery,
                          { src: "", alt: "", caption: "" },
                        ],
                      })
                    }
                  >
                    Add image
                  </CatalogButton>
                </div>
              </FieldGroup></Panel>
              <Panel title="Card and supporting content">
                <EditorField name={`content.locales.${locale}.cardTitle`} label="Card title">
                  <ContentEditor
                    sectionGoals
                    editable={canEdit && !busy}
                    key={`card-${locale}`}
                    label="Card title"
                    compact
                    locale={locale}
                    value={v.cardTitle}
                    onChange={(cardTitle) => update({ cardTitle })}
                    upload={upload}
                  />
                </EditorField>
                {field("cardSummary", "Card description", true)}
                {field("badge", "Topic label")}
                {field("railIntro", "Goals introduction", true)}
                {field("note", "Closing note", true)}
              </Panel>
              <Panel title="Search engines">
                {field("seoTitle", "SEO title")}
                {field("seoDescription", "SEO description", true)}
              </Panel>
              {record.id > 0 && (
                <ArticleRevisionHistory
                  revisions={revisions}
                  onOpen={() => {
                    sustainabilityRevisions(record.id)
                      .then(setRevisions)
                      .catch(() =>
                        holoForm.apply({
                          ok: false,
                          message: "Could not load revisions.",
                        }),
                      );
                  }}
                  onRestore={(r) => {
                    change({ ...record, content: r.content });
                    holoForm.apply({
                      ok: true,
                      message:
                        "Snapshot restored to the editor. Save or publish to apply it.",
                    });
                  }}
                />
              )}
            </CatalogFormMain>
            <CatalogFormSidebar>
              <Panel title="Publishing">
                <span
                  className={`catalog-status${record.published[locale] ? " is-published" : ""}`}
                >
                  <i />
                  {record.published[locale] ? "Published" : "Draft"} ·{" "}
                  {locale.toUpperCase()}
                </span>
                <p className="catalog-help">
                  Save changes updates the draft. Publish applies this language
                  to the website.
                </p>
                <CatalogButton
                  type="button"
                  variant="primary"
                  onClick={() => void save("publish")}
                >
                  Publish {locale.toUpperCase()}
                </CatalogButton>
                {record.published[locale] && (
                  <CatalogButton
                    type="button"
                    variant="secondary"
                    onClick={() => void save("unpublish")}
                  >
                    Unpublish {locale.toUpperCase()}
                  </CatalogButton>
                )}
                {record.id > 0 && (
                  <CatalogButtonLink
                    href={`/admin/sustainability/${record.id}/preview?locale=${locale}`}
                    target="_blank"
                    variant="secondary"
                  >
                    Preview draft
                  </CatalogButtonLink>
                )}
              </Panel>
              <Panel title="Organization">
                <CatalogField name="slug">
                  <span>URL slug</span>
                  <input
                    value={record.slug}
                    readOnly={Boolean(record.id)}
                    onChange={(e) =>
                      change({ ...record, slug: e.target.value })
                    }
                  />
                </CatalogField>
                <CatalogField name="content.date">
                  <span>Publication date</span>
                  <input
                    type="date"
                    value={record.content.date}
                    onChange={(e) =>
                      change({
                        ...record,
                        content: { ...record.content, date: e.target.value },
                      })
                    }
                  />
                </CatalogField>
                <CatalogField name="content.updatedDate">
                  <span>Updated date</span>
                  <input
                    type="date"
                    value={record.content.updatedDate}
                    onChange={(e) =>
                      change({
                        ...record,
                        content: {
                          ...record.content,
                          updatedDate: e.target.value,
                        },
                      })
                    }
                  />
                </CatalogField>
                <CatalogField name="content.sortOrder">
                  <span>Display order</span>
                  <input
                    type="number"
                    value={record.content.sortOrder}
                    onChange={(e) =>
                      change({
                        ...record,
                        content: {
                          ...record.content,
                          sortOrder: Number(e.target.value),
                        },
                      })
                    }
                  />
                </CatalogField>
                <label className="catalog-switch">
                  <input
                    type="checkbox"
                    checked={record.content.featured}
                    onChange={(e) =>
                      change({
                        ...record,
                        content: {
                          ...record.content,
                          featured: e.target.checked,
                        },
                      })
                    }
                  />
                  <span />
                  <b>Featured article</b>
                </label>
              </Panel>
              <Panel title="Sustainable development goals">
                <FieldGroup name="content.goalIds"><div className="catalog-check-group">
                  <div>
                    {page.goals.map((g) => (
                      <label key={g.id}>
                        <input
                          type="checkbox"
                          checked={record.content.goalIds.includes(g.id)}
                          onChange={(e) => {
                            const goalIds = e.target.checked
                              ? [...record.content.goalIds, g.id]
                              : record.content.goalIds.filter(
                                  (id) => id !== g.id,
                                );
                            change({
                              ...record,
                              content: {
                                ...record.content,
                                goalIds,
                                primaryGoal: goalIds.includes(
                                  record.content.primaryGoal,
                                )
                                  ? record.content.primaryGoal
                                  : (goalIds[0] ?? 0),
                              },
                            });
                          }}
                        />
                        <span>
                          {g.id}. {g.name[locale]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                </FieldGroup><CatalogField name="content.primaryGoal">
                  <span>Primary goal</span>
                  <select
                    value={record.content.primaryGoal}
                    onChange={(e) =>
                      change({
                        ...record,
                        content: {
                          ...record.content,
                          primaryGoal: Number(e.target.value),
                        },
                      })
                    }
                  >
                    <option value={0}>None</option>
                    {page.goals
                      .filter((g) => record.content.goalIds.includes(g.id))
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.id}. {g.name[locale]}
                        </option>
                      ))}
                  </select>
                </CatalogField>
              </Panel>
            </CatalogFormSidebar>
          </CatalogFormGrid>
        </fieldset>
      </AdminForm>
    </section></AdminFormProvider>
  );
}
