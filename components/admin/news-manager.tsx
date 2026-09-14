"use client";
import { AdminForm } from './admin-form';
import { AdminPageHeader } from './admin-page-header';
import {
CatalogButton,
CatalogButtonLink
} from "./catalog-button";

import {
CatalogField,
CatalogFormGrid,
CatalogFormMain,
CatalogFormSidebar
} from "./catalog-layout";

import { uploadCmsFileAction } from "@/app/admin/actions";
import {
getNewsRevisions,
saveNews
} from "@/app/admin/news/actions";
import { ContentEditor } from "@/components/editor/content-editor";
import { EditorContext } from "@/components/editor/editor-context";
import type { AdminCapabilities } from "@/lib/admin/access";
import { textContent } from "@/lib/editor/document";
import {
type NewsContent,
type NewsRecord,
type NewsTaxonomy,
type NewsVersion
} from "@/lib/news/contracts";
import type { CmsLocale } from "@/lib/cms/contracts";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";
import {
ArticleLanguages,
ArticleRevisionHistory,
ArticleTextField,
EditorField,
} from "./article-fields";
import { Icon } from "./catalog-icon";
import { CatalogPanel as Panel } from "./catalog-panel";
import { AssetField } from "./cms-fields";
import { AdminFormProvider,FieldGroup,FormNotice,useAdminForm } from "./form-feedback";

type Props = {
  articles: NewsRecord[];
  taxonomies: NewsTaxonomy[];
  initial?: NewsRecord;
  capabilities: AdminCapabilities;
};

export function NewsManager({
  articles,
  taxonomies,
  initial,
  capabilities,
}: Props) {
  const router = useRouter();
  const [record, setRecord] = useState(initial),
    [locale, setLocale] = useState<CmsLocale>("en"),
    [dirty, setDirty] = useState(false),
    [revisions, setRevisions] = useState<
      Awaited<ReturnType<typeof getNewsRevisions>>
    >([]);
  const holoForm = useAdminForm(record ?? null);
  const busy=holoForm.submitting, result=holoForm.result;
  const canEdit = record?.id ? capabilities.edit : capabilities.create;
  const change = (next: NewsRecord) => {
    setRecord(next);
    setDirty(true);
    holoForm.change();
  };
  const updateVersion = (values: Partial<NewsVersion>) => {
    if (record)
      change({
        ...record,
        content: {
          ...record.content,
          locales: {
            ...record.content.locales,
            [locale]: { ...record.content.locales[locale], ...values },
          },
        },
      });
  };
  const save = async (
    operation: "save" | "publish" | "unpublish" = "save",
  ) => {
    if (!record || busy) return;
    const r = await holoForm.run(() => saveNews(
        record.id,
        record.revision,
        record.slug,
        JSON.stringify(record.content),
        operation,
        locale,
      ));
      if(!r)return;
      if (r.ok && 'id' in r && 'revision' in r && 'published' in r && 'content' in r) {
        setRecord({
          ...record,
          id: Number(r.id),
          revision: Number(r.revision),
          published: r.published as NewsRecord['published'],
          content: r.content as NewsContent,
        });
        setDirty(false);

        router.refresh();
      }

  };
  useEffect(() => {
    if (!dirty) return;
    const prevent = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  const upload = async (file: File) => {
    if (!record?.id)
      throw new Error("Create the article before uploading media.");
    const form = new FormData();
    form.set("ownerType", "news");
    form.set("ownerKey", String(record.id));
    form.set("conversion", "optimized");
    form.set("file", file);
    const r = await uploadCmsFileAction(form);
    if(!r.ok||!('url' in r)||!r.url)throw new Error(r.message);
    return r.url;
  };
  if (!record) throw new Error('An editor record is required.')

  const v = record.content.locales[locale];
  const input = (key: keyof NewsVersion, label: string, multiline = false) => (
    <ArticleTextField name={`content.locales.${locale}.${key}`}
      label={label}
      value={String(v[key])}
      locale={locale}
      multiline={multiline}
      onChange={(value) => updateVersion({ [key]: value })}
    />
  );
  const articleSelect = (
    name: string,
    value: string,
    onChange: (slug: string) => void,
    label: string,
  ) => (
    <CatalogField name={name}>
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Automatic</option>
        {articles
          .filter((a) => a.id !== record.id)
          .map((a) => (
            <option value={a.slug} key={a.id}>
              {textContent(a.content.locales[locale].title) || a.slug}
            </option>
          ))}
      </select>
    </CatalogField>
  );
  return (
    <EditorContext.Provider value={{ upload }}>
      <AdminFormProvider form={holoForm} reveal={name=>{const language=name.match(/(?:locales|content)\.(en|ar|fr)(?:\.|$)/)?.[1];if(language)setLocale(language as CmsLocale)}}><section className="catalog-admin-page catalog-edit-page news-crud">
        <AdminForm
          noValidate
          onChangeCapture={() => holoForm.change()}
          onSubmit={(e) => {
            e.preventDefault();
            void save("save");
          }}
        >
          <AdminPageHeader title={
              <>
                {record.id
                  ? `Edit ${textContent(record.content.locales.en.title) || "article"}`
                  : "Add article"}
              </>
            } eyebrow="News / Articles" backHref="/admin/news" creating={!record.id} noun="article" submitting={busy} canSave={canEdit} sticky/>
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
                      editable={!!canEdit && !busy}
                      key={`title-${locale}`}
                      value={v.title}
                      locale={locale}
                      compact
                      onChange={(title) => updateVersion({ title })}
                      upload={upload}
                    />
                  </EditorField>
                  {input("summary", "Introduction", true)}
                  <EditorField name={`content.locales.${locale}.body`} label="Article body">
                    <ContentEditor
                      editable={!!canEdit && !busy}
                      key={`body-${locale}`}
                      value={v.body}
                      locale={locale}
                      onChange={(body) => updateVersion({ body })}
                      upload={upload}
                    />
                  </EditorField>
                </Panel>
                <Panel
                  title="News card"
                  description="Content shown on the news listing and related article cards."
                >
                  <EditorField name={`content.locales.${locale}.cardTitle`} label="Card title">
                    <ContentEditor
                      editable={!!canEdit && !busy}
                      key={`card-${locale}`}
                      value={v.cardTitle}
                      locale={locale}
                      compact
                      onChange={(cardTitle) => updateVersion({ cardTitle })}
                      upload={upload}
                    />
                  </EditorField>
                  {input("cardSummary", "Card summary", true)}
                  <CatalogButton
                    variant="secondary"
                    type="button"
                    onClick={() =>
                      updateVersion({
                        cardTitle: structuredClone(v.title),
                        cardSummary: v.summary,
                      })
                    }
                  >
                    Copy article title and introduction
                  </CatalogButton>
                </Panel>
                <Panel title="Lead image">
                  {record.id ? (
                    <AssetField name={`content.locales.${locale}.hero`}
                      field={{
                        id: "hero",
                        label: "Lead image",
                        kind: "image",
                        source: "",
                        value: v.hero,
                      }}
                      owner={{ type: "news", key: String(record.id) }}
                      onChange={(hero) => updateVersion({ hero })}
                    />
                  ) : (
                    <p className="catalog-help">
                      Create the article to upload a lead image.
                    </p>
                  )}
                  {input("heroAlt", "Alt text")}
                  {input("heroCaption", "Caption")}
                </Panel>
                <Panel title="Search engine optimization">
                  {input("seoTitle", "SEO title")}
                  {input("seoDescription", "SEO description", true)}
                </Panel>

                {record.id > 0 && (
                  <ArticleRevisionHistory
                    revisions={revisions}
                    onOpen={() => {
                      getNewsRevisions(record.id)
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
                    Save changes updates the draft. Publish applies this
                    language to the website.
                  </p>
                  <CatalogButton
                    variant="primary"
                    type="button"
                    onClick={() => void save("publish")}
                  >
                    Publish {locale.toUpperCase()}
                  </CatalogButton>
                  {record.published[locale] && (
                    <CatalogButton
                      variant="secondary"
                      type="button"
                      onClick={() => void save("unpublish")}
                    >
                      Unpublish {locale.toUpperCase()}
                    </CatalogButton>
                  )}
                </Panel>
                <Panel title="Organization">
                  <CatalogField name="slug">
                    <span>URL slug</span>
                    <input
                      required
                      value={record.slug}
                      readOnly={!!record.id}
                      onChange={(e) =>
                        change({ ...record, slug: e.target.value })
                      }
                    />
                  </CatalogField>
                  <CatalogField name="content.categoryId">
                    <span>Category</span>
                    <select
                      value={record.content.categoryId}
                      onChange={(e) =>
                        change({
                          ...record,
                          content: {
                            ...record.content,
                            categoryId: Number(e.target.value),
                          },
                        })
                      }
                    >
                      <option value="0">Choose a category</option>
                      {taxonomies
                        .filter((t) => t.kind === "category")
                        .map((t) => (
                          <option value={t.id} key={t.id}>
                            {t.content[locale].name}
                          </option>
                        ))}
                    </select>
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
                    <span aria-hidden="true" />
                    <b>Featured article</b>
                  </label>
                </Panel>
                <Panel title="Tags"><FieldGroup name="content.tagIds">
                  <fieldset className="catalog-check-group">
                    <legend className="sr-only">Tags</legend>
                    <div>
                      {taxonomies
                        .filter((t) => t.kind === "tag")
                        .map((t) => (
                          <label key={t.id}>
                            <input
                              type="checkbox"
                              checked={record.content.tagIds.includes(t.id)}
                              onChange={(e) =>
                                change({
                                  ...record,
                                  content: {
                                    ...record.content,
                                    tagIds: e.target.checked
                                      ? [...record.content.tagIds, t.id]
                                      : record.content.tagIds.filter(
                                          (id) => id !== t.id,
                                        ),
                                  },
                                })
                              }
                            />
                            <span>{t.content[locale].name}</span>
                          </label>
                        ))}
                    </div>
                  </fieldset></FieldGroup>
                </Panel>
                <Panel title="Previous / next articles">
                  {(["previousSlug", "nextSlug"] as const).map((key) => (
                    <div key={key}>
                      {articleSelect(
                        `content.${key}`,
                        record.content[key],
                        (slug) =>
                          change({
                            ...record,
                            content: { ...record.content, [key]: slug },
                          }),
                        key === "previousSlug" ? "Previous" : "Next",
                      )}
                    </div>
                  ))}
                </Panel>
                <Panel title="Related articles"><FieldGroup name="content.relatedSlugs">
                  {[0, 1, 2].map((index) => (
                    <div key={index}>
                      {articleSelect(
                        `content.relatedSlugs.${index}`,
                        record.content.relatedSlugs[index] ?? "",
                        (slug) => {
                          const relatedSlugs = [...record.content.relatedSlugs];
                          relatedSlugs[index] = slug;
                          change({
                            ...record,
                            content: {
                              ...record.content,
                              relatedSlugs: relatedSlugs.filter(Boolean),
                            },
                          });
                        },
                        `Story ${index + 1}`,
                      )}
                    </div>
                  ))}
                </FieldGroup></Panel>
                {record.id > 0 && (
                  <CatalogButtonLink
                    variant="view"
                    href={`/admin/news/${record.id}/preview?locale=${locale}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="external" />
                    Preview draft
                  </CatalogButtonLink>
                )}
              </CatalogFormSidebar>
            </CatalogFormGrid>
          </fieldset>
        </AdminForm>
      </section></AdminFormProvider>
    </EditorContext.Provider>
  );
}
