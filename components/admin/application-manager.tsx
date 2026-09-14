"use client";
import {
deleteApplication,
replyToApplication,
setApplicationStatus,
} from "@/app/admin/career-actions";
import type { AdminCapabilities } from "@/lib/admin/access";
import type {
ApplicationRecord,
ReplyRecord
} from "@/lib/careers/contracts";
import { useRouter } from "next/navigation";
import { CatalogButtonLink } from "./catalog-button";
import { Icon } from "./catalog-icon";
import {
CatalogFormGrid,
CatalogFormMain,
CatalogFormSidebar,
} from "./catalog-layout";
import {AdminPageHeader} from './admin-page-header'
import { CatalogPanel } from "./catalog-panel";
import { CrudIdentity,CrudList,CrudStatus } from "./crud-list";
import { FormNotice,useAdminForm } from "./form-feedback";
import { SubmissionReplyForm,SubmissionStatusForm } from "./submission-forms";
import { SubmissionDetails,SubmissionReplyHistory } from "./submission-inbox";
import type {ApplicationSummary,SubmissionPagination} from "@/lib/admin/submission-list";
export function ApplicationsList({
  applications,
  capabilities,
  pagination,
  counts,
}: {
  applications: ApplicationSummary[];
  pagination: SubmissionPagination;
  counts: Record<string,number>;
  capabilities: AdminCapabilities;
}) {
  const router = useRouter(),
    mutation=useAdminForm(null), result=mutation.result, busy=mutation.submitting;
  return (
    <section className="catalog-admin-page">
      <CrudList
        pagination={pagination}
        title="Applications"
        section="Recruitment"
        icon="people"
        description="Review applications and reply to applicants."
        notice={<FormNotice result={result} />}
        busy={busy}
        stats={(["pending", "accepted", "declined"] as const).map((s) => ({
          label: s[0].toUpperCase() + s.slice(1),
          value: counts[s]??0,
          icon: "people",
        }))}
        filters={[
          {
            key: "status",
            label: "Status",
            options: ["pending", "accepted", "declined"].map((value) => ({
              value,
              label: value[0].toUpperCase() + value.slice(1),
            })),
          },
        ]}
        columns={["Applicant", "Role", "Status", "Received"]}
        empty="No applications yet."
        rows={applications.map((a) => ({
          id: a.id,
          name: a.name,
          searchText: [a.name, a.email, a.job_title, a.department].join(" "),
          filterValues: { status: a.status },
          viewHref: `/admin/applications/${a.id}`,
          cells: [
            <CrudIdentity
              key="name"
              name={a.name}
              subtitle={a.email}
              icon="people"
              href={`/admin/applications/${a.id}`}
            />,
            a.job_title || "Speculative application",
            <CrudStatus
              key="status"
              label={a.status[0].toUpperCase() + a.status.slice(1)}
              active={a.status === "accepted"}
            />,
            new Date(a.created_at).toLocaleDateString("en-GB"),
          ],
          deletion: capabilities.delete
            ? {
                description:
                  "The application, CV and reply history will be permanently deleted.",
                onConfirm: async () => {
                  await mutation.run(()=>deleteApplication(a.id));
                    router.refresh();
                },
              }
            : undefined,
        }))}
      />
    </section>
  );
}

export function ApplicationDetails({
  application: a,
  replies,
  canEdit,
}: {
  application: ApplicationRecord;
  replies: ReplyRecord[];
  canEdit: boolean;
}) {
  const received = new Date(a.created_at);
  const details = [
    { label: "Email", value: <a href={`mailto:${a.email}`}>{a.email}</a> },
    { label: "Phone", value: <a href={`tel:${a.phone}`}>{a.phone}</a> },
    { label: "Role", value: a.job_title || "Speculative application" },
    { label: "Department", value: a.department || "Not specified" },
    { label: "Language", value: a.locale.toUpperCase() },
    {
      label: "Received",
      value: (
        <time dateTime={received.toISOString()}>
          {received.toLocaleString("en-GB")}
        </time>
      ),
    },
  ];
  return (
    <section className="catalog-admin-page catalog-edit-page application-detail-page">
      <AdminPageHeader
        title={a.name}
        actions={
          <CatalogButtonLink href="/admin/applications">
            Back to applications
          </CatalogButtonLink>
        }
        sticky
      />
      <CatalogFormGrid>
        <CatalogFormMain>
          <SubmissionDetails items={details} message={a.letter} messageLabel="Cover letter" />
          <CatalogPanel title="Application file">
              <CatalogButtonLink
                className="application-download"
                href={`/admin/applications/${a.id}/cv`}
                variant="view"
              >
                <span className="application-download-icon">
                  <Icon name="download" />
                </span>
                <span>
                  <b>Download CV</b>
                  <small>{a.cv_name}</small>
                </span>
              </CatalogButtonLink>
          </CatalogPanel>
          <SubmissionReplyHistory replies={replies} />
          {canEdit && (
            <CatalogPanel title="Email reply">
              <SubmissionReplyForm kind="application" id={a.id} email={a.email} initialSubject={`Your application${a.job_title?': '+a.job_title:''}`} action={replyToApplication}/>
            </CatalogPanel>
          )}
        </CatalogFormMain>
        <CatalogFormSidebar>
          <CatalogPanel title="Review status">
            <SubmissionStatusForm kind="application" id={a.id} initialStatus={a.status} canEdit={canEdit} action={setApplicationStatus}/>
          </CatalogPanel>
        </CatalogFormSidebar>
      </CatalogFormGrid>
    </section>
  );
}
