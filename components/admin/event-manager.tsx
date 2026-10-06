'use client'
import type {SubmissionPagination} from '@/lib/admin/submission-list'
import {useCrudNavigation} from './use-crud-navigation'
import {CrudPagination} from './crud-pagination'
import {CrudToolbar} from './crud-toolbar'
import { uploadCmsFileAction } from "@/app/admin/actions";
import {
deleteEventSlotAction,
generateEventSlotsAction,
saveEventAction
} from "@/app/admin/events/actions";
import { ContentEditor } from "@/components/editor/content-editor";
import { EditorContext } from "@/components/editor/editor-context";
import { textContent } from "@/lib/editor/document";
import type { EventRecord,EventSlotRecord } from "@/lib/events/contracts";
import type { CmsLocale } from "@/lib/cms/contracts";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminForm } from './admin-form';
import { AdminPageHeader } from './admin-page-header';
import {
ArticleLanguages,
ArticleTextField,
EditorField,
} from "./article-fields";
import {
CatalogButton
} from "./catalog-button";
import {
CatalogField,
CatalogFormGrid,
CatalogFormMain,
CatalogFormSidebar,
CatalogTable
} from "./catalog-layout";
import { CatalogPanel } from "./catalog-panel";
import { AssetField } from "./cms-fields";
import { CrudStatus } from "./crud-list";
import { AdminFormProvider,FormNotice,useAdminForm } from "./form-feedback";

const localInput = (value: string) => {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export function EventEditor({
  initial,
  slots,
  pagination,
  canEdit,
}: {
  initial: EventRecord;
  slots: EventSlotRecord[];
  pagination?: SubmissionPagination;
  canEdit: boolean;
}) {
  const router = useRouter(),
    [event, setEvent] = useState(initial),
    [locale, setLocale] = useState<CmsLocale>("en");
  const form=useAdminForm(event),busy=form.submitting,notice=form.result;
  const updateContent = <K extends keyof EventRecord["content"]>(
    key: K,
    value: EventRecord["content"][K],
  ) =>
    setEvent((current) => ({
      ...current,
      content: { ...current.content, [key]: value },
    }));
  const updateLocalized = (
    key:
      | "eyebrow"
      | "summary"
      | "location"
      | "venue"
      | "stand"
      | "heroAlt"
      | "heroCaption",
    value: string,
  ) => updateContent(key, { ...event.content[key], [locale]: value });
  const upload = async (file: File) => {
    if (!event.id) throw new Error("Create the event before uploading media.");
    const data = new FormData();
    data.set("ownerType", "event");
    data.set("ownerKey", String(event.id));
    data.set("conversion", "optimized");
    data.set("file", file);
    const result = await uploadCmsFileAction(data);
    if(!result.ok||!('url' in result)||!result.url)throw new Error(result.message);
    return result.url;
  };
  const save = async () => {
    const result=await form.run(()=>saveEventAction(event.id,JSON.stringify(event)));
    if(result?.ok)router.refresh();
  };
  const title = textContent(event.content.title.en) || "event";
  return (
    <AdminFormProvider form={form} reveal={name=>{const language=name.match(/\.(en|ar|fr)(?:\.|$)/)?.[1];if(language)setLocale(language as CmsLocale)}}><EditorContext.Provider value={{ upload }}>
      <section className="catalog-admin-page catalog-edit-page news-crud">
      <AdminForm
        onChangeCapture={()=>form.change()}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <AdminPageHeader title={event.id ? `Edit ${title}` : "Add event"} eyebrow="Events / Pages" backHref="/admin/events" creating={!event.id} noun="event" submitting={busy} canSave={canEdit} sticky/>
        <FormNotice result={notice} />
        <fieldset className="news-crud-fields" disabled={!canEdit || busy}>
          <CatalogFormGrid>
            <CatalogFormMain>
              <CatalogPanel
                title="Article content"
                description="Choose a language to edit its title, introduction, and article body."
              >
                <ArticleLanguages locale={locale} onChange={setLocale} />
                <EditorField name={`content.title.${locale}`} label="Title">
                  <ContentEditor
                    editable={canEdit && !busy}
                    key={`title-${locale}`}
                    value={event.content.title[locale]}
                    locale={locale}
                    compact
                    onChange={(value) =>
                      updateContent("title", {
                        ...event.content.title,
                        [locale]: value,
                      })
                    }
                    upload={upload}
                  />
                </EditorField>
                <ArticleTextField name={`content.summary.${locale}`}
                  label="Introduction"
                  value={event.content.summary[locale]}
                  locale={locale}
                  multiline
                  onChange={(value) => updateLocalized("summary", value)}
                />
                <EditorField name={`content.body.${locale}`} label="Article body">
                  <ContentEditor
                    editable={canEdit && !busy}
                    key={`body-${locale}`}
                    value={event.content.body[locale]}
                    locale={locale}
                    onChange={(value) =>
                      updateContent("body", {
                        ...event.content.body,
                        [locale]: value,
                      })
                    }
                    upload={upload}
                  />
                </EditorField>
              </CatalogPanel>
              <CatalogPanel title="Lead image">
                {event.id ? (
                  <AssetField name="content.heroImage"
                    field={{
                      id: "hero",
                      label: "Lead image",
                      kind: "image",
                      source: "",
                      value: event.content.heroImage,
                    }}
                    owner={{ type: "event", key: String(event.id) }}
                    onChange={(value) => updateContent("heroImage", value)}
                  />
                ) : (
                  <p className="catalog-help">
                    Create the event to upload its lead image.
                  </p>
                )}
                <ArticleTextField name={`content.heroAlt.${locale}`}
                  label="Alternative text"
                  value={event.content.heroAlt[locale]}
                  locale={locale}
                  onChange={(value) => updateLocalized("heroAlt", value)}
                />
                <ArticleTextField name={`content.heroCaption.${locale}`}
                  label="Caption"
                  value={event.content.heroCaption[locale]}
                  locale={locale}
                  onChange={(value) => updateLocalized("heroCaption", value)}
                />
              </CatalogPanel>
              <CatalogPanel title="Search engine optimization">
                <ArticleTextField name={`content.seo.title.${locale}`}
                  label="SEO title"
                  value={event.content.seo.title[locale]}
                  locale={locale}
                  onChange={(value) =>
                    updateContent("seo", {
                      ...event.content.seo,
                      title: { ...event.content.seo.title, [locale]: value },
                    })
                  }
                />
                <ArticleTextField name={`content.seo.description.${locale}`}
                  label="SEO description"
                  value={event.content.seo.description[locale]}
                  locale={locale}
                  multiline
                  onChange={(value) =>
                    updateContent("seo", {
                      ...event.content.seo,
                      description: {
                        ...event.content.seo.description,
                        [locale]: value,
                      },
                    })
                  }
                />
              </CatalogPanel>
            </CatalogFormMain>
            <CatalogFormSidebar>
              <CatalogPanel title="Publishing">
                <span
                  className={`catalog-status${event.published ? " is-published" : ""}`}
                >
                  <i />
                  {event.published ? "Published" : "Draft"}
                </span>
                <label className="catalog-switch">
                  <input
                    type="checkbox"
                    checked={event.published}
                    onChange={(e) =>
                      setEvent({ ...event, published: e.target.checked })
                    }
                  />
                  <span />
                  <b>Published</b>
                </label>
              </CatalogPanel>
              <CatalogPanel title="Event details">
                <ArticleTextField name={`content.eyebrow.${locale}`}
                  label="Eyebrow"
                  value={event.content.eyebrow[locale]}
                  locale={locale}
                  onChange={(value) => updateLocalized("eyebrow", value)}
                />
                <CatalogField name="slug">
                  <span>URL slug</span>
                  <input
                    name="slug"
                    value={event.slug}
                    onChange={(e) =>
                      setEvent({ ...event, slug: e.target.value })
                    }
                  />
                </CatalogField>
                <CatalogField name="kind">
                  <span>Page type</span>
                  <select
                    value={event.kind}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        kind: e.target.value as EventRecord["kind"],
                      })
                    }
                  >
                    <option value="event">Upcoming event</option>
                    <option value="recap">Event recap</option>
                  </select>
                </CatalogField>
                <ArticleTextField name={`content.location.${locale}`}
                  label="Location"
                  value={event.content.location[locale]}
                  locale={locale}
                  onChange={(value) => updateLocalized("location", value)}
                />
                <ArticleTextField name={`content.venue.${locale}`}
                  label="Venue"
                  value={event.content.venue[locale]}
                  locale={locale}
                  onChange={(value) => updateLocalized("venue", value)}
                />
                <ArticleTextField name={`content.stand.${locale}`}
                  label="Stand"
                  value={event.content.stand[locale]}
                  locale={locale}
                  onChange={(value) => updateLocalized("stand", value)}
                />
                <CatalogField name="starts_at">
                  <span>Starts</span>
                  <input
                    type="datetime-local"
                    value={localInput(event.starts_at)}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        starts_at: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </CatalogField>
                <CatalogField name="ends_at">
                  <span>Ends</span>
                  <input
                    type="datetime-local"
                    value={localInput(event.ends_at)}
                    onChange={(e) =>
                      setEvent({
                        ...event,
                        ends_at: new Date(e.target.value).toISOString(),
                      })
                    }
                  />
                </CatalogField>
                <CatalogField name="timezone">
                  <span>Time zone</span>
                  <input
                    value={event.timezone}
                    onChange={(e) =>
                      setEvent({ ...event, timezone: e.target.value })
                    }
                  />
                </CatalogField>
                <CatalogField name="sort_order">
                  <span>Display order</span>
                  <input
                    type="number"
                    value={event.sort_order}
                    onChange={(e) =>
                      setEvent({ ...event, sort_order: Number(e.target.value) })
                    }
                  />
                </CatalogField>
              </CatalogPanel>
            </CatalogFormSidebar>
          </CatalogFormGrid>
        </fieldset>
      </AdminForm>
      {event.id>0&&pagination&&<AppointmentManager
                  event={event}
                  canEdit={canEdit}
                  slots={slots}
                  pagination={pagination}
                  onNotice={form.apply}
                />}
      </section>
    </EditorContext.Provider></AdminFormProvider>
  );
}

function AppointmentManager({
  event,
  canEdit,
  slots,
  pagination,
  onNotice,
}: {
  event: EventRecord;
  canEdit: boolean;
  slots: EventSlotRecord[];
  pagination: SubmissionPagination;
  onNotice: (result: { ok: boolean; message: string }) => void;
}) {
  const navigation = useCrudNavigation(pagination)
  const router = useRouter(),
    today = event.starts_at.slice(0, 10),
    [data, setData] = useState({
      eventId: event.id,
      date: today,
      startTime: "09:00",
      endTime: "17:00",
      duration: 30,
    }),
    form = useAdminForm(data),
    busy=form.submitting;
  const deletion=useAdminForm(null);
  const generate=async(formData=new FormData())=>{
    formData.set('eventId',String(data.eventId));formData.set('date',data.date);formData.set('startTime',data.startTime);formData.set('endTime',data.endTime);formData.set('duration',String(data.duration))
    const result=await form.run(()=>generateEventSlotsAction(formData));
    if(result?.ok){onNotice(result);router.refresh()}
  };
  const formatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: event.timezone,
  });
  return (
    <AdminFormProvider form={form}><AdminForm onSubmit={event=>{event.preventDefault();if(canEdit)void generate(new FormData(event.currentTarget))}}><CatalogPanel title="Appointments"><FormNotice result={form.result}/><FormNotice result={deletion.result}/>
      <p className="catalog-help">
        Generate explicit dated slots. Reserved slots remain protected and show
        the booking details below.
      </p>
      <fieldset className="catalog-form-grid news-crud-fields" disabled={!canEdit || busy}>
        <CatalogField name="date">
          <span>Date</span>
          <input
            type="date"
            value={data.date}
            onChange={(e) => setData({ ...data, date: e.target.value })}
          />
        </CatalogField>
        <CatalogField name="startTime">
          <span>Start time</span>
          <input
            type="time"
            value={data.startTime}
            onChange={(e) => setData({ ...data, startTime: e.target.value })}
          />
        </CatalogField>
        <CatalogField name="endTime">
          <span>End time</span>
          <input
            type="time"
            value={data.endTime}
            onChange={(e) => setData({ ...data, endTime: e.target.value })}
          />
        </CatalogField>
        <CatalogField name="duration">
          <span>Minutes</span>
          <input
            type="number"
            min="10"
            max="240"
            value={data.duration}
            onChange={(e) =>
              setData({ ...data, duration: Number(e.target.value) })
            }
          />
        </CatalogField>
      </fieldset>
      <CatalogButton
        type="button"
        disabled={!canEdit || busy}
        onClick={() => void generate()}
      >
        {busy ? "Generating..." : "Generate slots"}
      </CatalogButton>
      <CrudToolbar title="appointments" navigation={navigation} filters={[{key: 'status', label: 'Status', options: [{value: 'available', label: 'Available'}, {value: 'reserved', label: 'Reserved'}]}]}/>
      <CatalogTable
        head={
          <tr>
            <th>Appointment</th>
            <th>Status</th>
            <th>Reservation</th>
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        }
      >
        {slots.map((slot) => (
          <tr key={slot.id}>
            <td>{formatter.format(new Date(slot.startsAt))}</td>
            <td>
              <CrudStatus
                label={slot.status === "reserved" ? "Reserved" : "Available"}
                active={slot.status === "available"}
              />
            </td>
            <td>
              {slot.status === "reserved" ? (
                <>
                  <b>{slot.reservationName}</b>
                  <br />
                  <a href={`mailto:${slot.reservationEmail}`}>
                    {slot.reservationEmail}
                  </a>
                  <br />
                  <small>
                    {slot.reservationCompany} · {slot.reservationPhone}
                  </small>
                </>
              ) : (
                "—"
              )}
            </td>
            <td>
              {canEdit && slot.status === "available" && (
                <CatalogButton
                  type="button"
                  disabled={!canEdit || busy}
                  onClick={async () => {
                    const result=await deletion.run(()=>deleteEventSlotAction(slot.id));
                    if(result?.ok)router.refresh();
                  }}
                >
                  Remove
                </CatalogButton>
              )}
            </td>
          </tr>
        ))}
        {slots.length === 0 && (
          <tr>
            <td colSpan={4} className="catalog-empty">
              No appointment slots yet.
            </td>
          </tr>
        )}
      </CatalogTable>
      <CrudPagination meta={pagination.meta} href={navigation.href} onPageSizeChange={navigation.changePageSize} pending={navigation.pending}/>
    </CatalogPanel></AdminForm></AdminFormProvider>
  );
}
