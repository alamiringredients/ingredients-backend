"use client";
import { AdminForm } from './admin-form';
import { CatalogTabButton } from "./catalog-button";

import {
CmsSectionTabs,
} from "./catalog-layout";
import { CatalogPanel } from "./catalog-panel";

import { saveSustainabilityPage } from "@/app/admin/sustainability/actions";
import type { SustainabilityPageContent } from "@/lib/sustainability/contracts";
import { useState } from "react";
import {
AssetField,
LocalizedFields,
TextContentFields,
UrlField,
} from "./cms-fields";
import { AdminFormProvider,FormNotice,useAdminForm } from "./form-feedback";
import { LocalizedEditor } from "./localized-editor";
import { PageManagerShell } from "./page-manager-shell";
export function SustainabilityPageManager({
  initial,
  canEdit,
}: {
  initial: SustainabilityPageContent;
  canEdit: boolean;
}) {
  const [content, setContent] = useState(initial),
    [tab, setTab] = useState(initial.sections[0]?.key),
    form = useAdminForm(content),
    busy = form.submitting;
  const section = content.sections.find((s) => s.key === tab);
  const update = (patch: Partial<NonNullable<typeof section>>) => {
    if (section)
      setContent({
        ...content,
        sections: content.sections.map((s) =>
          s.key === tab ? { ...s, ...patch } : s,
        ),
      });
  };
  return (
    <AdminFormProvider form={form} reveal={name=>{const [key,index]=name.split(".");setTab(key==="sections"?content.sections[Number(index)]?.key:key==="seo"?"seo":"related")}}>
    <section onChangeCapture={() => form.change()}>
      <AdminForm
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          await form.run(() => saveSustainabilityPage(JSON.stringify(content)));
        }}
      >
        <fieldset className="news-crud-fields" disabled={!canEdit || busy}>
          <PageManagerShell
            title="Sustainability page"

            saving={busy}
            canSave={canEdit}
            navigation={
              <CmsSectionTabs aria-label="Sustainability sections">
                {[
                  ...content.sections.map((s) => ({
                    key: s.key,
                    label: s.label,
                  })),
                  { key: "related", label: "Related articles" },
                  { key: "seo", label: "SEO and sharing" },
                ].map((s) => (
                  <CatalogTabButton
                    type="button"
                    key={s.key}
                    onClick={() => setTab(s.key)}
                    active={s.key === tab}
                  >
                    {s.label}
                  </CatalogTabButton>
                ))}
              </CmsSectionTabs>
            }
          >
            <FormNotice result={form.result} />
            {section && (
              <>
                <div className="cms-editor-head">
                  <h2>{section.label}</h2>
                  <label className="cms-toggle">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={(e) => update({ enabled: e.target.checked })}
                    />
                    <span />
                    Show section
                  </label>
                </div>
                <CatalogPanel title={<>Text in all languages</>}>
                  <TextContentFields
                    richTexts={section.richTexts}
                    fields={section.texts}
                    onChange={(texts) => update({ texts })}
                    onRichChange={(richTexts) => update({ richTexts })}
                  />
                </CatalogPanel>
                {section.assets.length > 0 && (
                  <CatalogPanel title={<>Images and media</>}>
                    {section.assets.map((asset, i) => (
                      <AssetField
                        key={asset.id}
                        field={asset}
                        owner={{
                          type: "website-setting",
                          key: "sustainability",
                        }}
                        onChange={(value) =>
                          update({
                            assets: section.assets.map((a, j) =>
                              i === j ? { ...a, value } : a,
                            ),
                          })
                        }
                      />
                    ))}
                  </CatalogPanel>
                )}
                {section.links.length > 0 && (
                  <CatalogPanel title={<>Links</>}>
                    {section.links.map((link, i) => (
                      <UrlField name={`sections.${content.sections.findIndex(s=>s.key===tab)}.links.${i}.value`}
                        key={link.id}
                        label={link.label}
                        value={link.value}
                        onChange={(value) =>
                          update({
                            links: section.links.map((a, j) =>
                              i === j ? { ...a, value } : a,
                            ),
                          })
                        }
                      />
                    ))}
                  </CatalogPanel>
                )}
              </>
            )}
            {tab === "related" && (
              <>
                <div className="cms-editor-head">
                  <h2>Related articles</h2>
                  <label className="cms-toggle">
                    <input
                      type="checkbox"
                      checked={content.sectionVisibility.related}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          sectionVisibility: {
                            ...content.sectionVisibility,
                            related: e.target.checked,
                          },
                        })
                      }
                    />
                    <span />
                    Show section
                  </label>
                </div>
                <CatalogPanel>
                  <LocalizedFields
                    label="Eyebrow"
                    value={content.relatedKicker}
                    onChange={(relatedKicker) =>
                      setContent({ ...content, relatedKicker })
                    }
                  />
                  <LocalizedEditor
                    label="Heading"
                    value={content.relatedTitle}
                    onChange={(relatedTitle) =>
                      setContent({ ...content, relatedTitle })
                    }
                  />
                </CatalogPanel>
              </>
            )}
            {tab === "seo" && (
              <CatalogPanel title={<>Search engines</>}>
                <LocalizedFields
                  label="Page title"
                  value={content.seo.title}
                  onChange={(title) =>
                    setContent({ ...content, seo: { ...content.seo, title } })
                  }
                />
                <LocalizedFields
                  label="Description"
                  multiline
                  value={content.seo.description}
                  onChange={(description) =>
                    setContent({
                      ...content,
                      seo: { ...content.seo, description },
                    })
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
