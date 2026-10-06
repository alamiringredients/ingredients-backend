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

import {
saveAdminAction,
saveRoleAction
} from "@/app/admin/access-actions";
import type { AdminCapabilities } from "@/lib/admin/access";
import {
adminActions,
adminResources,
type AdminAction,
type RolePermissions,
} from "@/lib/admin/access";
import type { AdminSummary,RoleSummary } from "@/server/admin/access-data";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "./catalog-icon";
import { AdminFormProvider,FieldError,FormNotice as Notice,useAdminForm,type AdminResult } from "./form-feedback";

export function AccessManager({
  kind,
  roles = [],
  capabilities,
  initialAdmin,
  initialRole,
}: {
  kind: "admin" | "role";
  roles?: Pick<RoleSummary, "id" | "name">[];
  capabilities: AdminCapabilities;
  initialAdmin?: AdminSummary;
  initialRole?: RoleSummary;
}) {
  const router = useRouter();
  const basePath = kind === "admin" ? "/admin/admins" : "/admin/roles";
  const initial =
    kind === "admin" ? (initialAdmin ?? null) : (initialRole ?? null);
  const [admin, setAdmin] = useState<
    (AdminSummary & { password: string }) | null
  >(
    kind === "admin" && initial
      ? { ...(initial as AdminSummary), password: "" }
      : null,
  );
  const [role, setRole] = useState<RoleSummary | null>(
    kind === "role" && initial ? (initial as RoleSummary) : null,
  );
  const holoForm = useAdminForm(kind === "admin" ? admin : role);
  const busy=holoForm.submitting;
  const creating =
    kind === "admin" ? Boolean(admin && !admin.id) : Boolean(role && !role.id);
  const permissionCount = (permissions: RolePermissions) =>
    adminResources.reduce(
      (count, { key }) => count + (permissions[key]?.length ?? 0),
      0,
    );
  const run = async (action: () => Promise<AdminResult>) => {
    const response=await holoForm.run(action);
    if(response?.ok)router.refresh();
  };

  if (kind === "admin" && admin)
    return (
      <AdminFormProvider form={holoForm}><section className="catalog-admin-page catalog-edit-page">
        <AdminForm
          noValidate
          onChangeCapture={() => holoForm.change()}
          onSubmit={async (event) => {
            event.preventDefault();

            void run(
              () => saveAdminAction(admin.id, JSON.stringify(admin)),
            );
          }}
        >
          <AdminPageHeader
            backHref={basePath} eyebrow={`Access control / ${kind}s`}
            title={creating ? "Add admin" : `Edit ${admin.name}`}
            creating={creating}
            submitting={busy}
            canSave={creating ? capabilities.create : capabilities.edit}
            noun="admin" sticky
          />
          <Notice result={holoForm.result} />
          <CatalogFormGrid>
            <CatalogFormMain>
              <CatalogPanel
                title={<>Account information</>}
                description={<>The email address is used to sign in.</>}
                bodyClassName="catalog-panel-body access-fields"
              >
                <CatalogField name="name">
                  <span>Name</span>
                  <input
                    required
                    minLength={2}
                    maxLength={100}
                    value={admin.name}
                    onChange={(event) =>
                      setAdmin({ ...admin, name: event.target.value })
                    }
                  />
                </CatalogField>
                <CatalogField name="email">
                  <span>Email</span>
                  <input
                    required
                    type="email"
                    maxLength={190}
                    value={admin.email}
                    onChange={(event) =>
                      setAdmin({ ...admin, email: event.target.value })
                    }
                  />
                </CatalogField>
                <CatalogField name="password">
                  <span>{creating ? "Password" : "New password"}</span>
                  <input
                    required={creating}
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={admin.password}
                    onChange={(event) =>
                      setAdmin({ ...admin, password: event.target.value })
                    }
                  />
                  <small>
                    {creating
                      ? "At least 8 characters."
                      : "Leave blank to keep the current password."}
                  </small>
                </CatalogField>
              </CatalogPanel>
            </CatalogFormMain>
            <CatalogFormSidebar>
              <CatalogPanel
                title={<>Role</>}
                description={<>Controls this admin’s access.</>}
                bodyClassName="catalog-panel-body"
              >
                <CatalogField name="role_id">
                  <span>Assigned role</span>
                  <select
                    required
                    value={admin.role_id ?? ""}
                    onChange={(event) =>
                      setAdmin({
                        ...admin,
                        role_id: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                  >
                    <option value="">Choose a role</option>
                    {roles.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </CatalogField>
                {!roles.length && (
                  <p className="catalog-muted">
                    Create a role before adding an admin.
                  </p>
                )}
              </CatalogPanel>
            </CatalogFormSidebar>
          </CatalogFormGrid>
        </AdminForm>
      </section></AdminFormProvider>
    );

  if (!role) return null;
  const setPermission = (
    resource: string,
    action: AdminAction,
    checked: boolean,
  ) => {
    const key = resource as keyof RolePermissions;
    const current = role.permissions[key] ?? [];
    setRole({
      ...role,
      permissions: {
        ...role.permissions,
        [key]: checked
          ? [...current, action]
          : current.filter((item) => item !== action),
      },
    });
  };
  return (
    <AdminFormProvider form={holoForm}><section className="catalog-admin-page catalog-edit-page">
      <AdminForm
        noValidate
        onChangeCapture={() => holoForm.change()}
        onSubmit={async (event) => {
          event.preventDefault();

          void run(() => saveRoleAction(role.id, JSON.stringify(role)));
        }}
      >
        <AdminPageHeader
          backHref={basePath} eyebrow={`Access control / ${kind}s`}
          title={creating ? "Add role" : `Edit ${role.name}`}
          creating={creating}
          submitting={busy}
          noun="role" sticky
        />
        <Notice result={holoForm.result} />
        <CatalogFormGrid>
          <CatalogFormMain>
            <CatalogPanel
              title={<>Role details</>}
              description={
                <>Use a name that describes the admin’s responsibility.</>
              }
              bodyClassName="catalog-panel-body access-fields"
            >
              <CatalogField name="name">
                <span>Name</span>
                <input
                  required
                  minLength={2}
                  maxLength={80}
                  value={role.name}
                  onChange={(event) =>
                    setRole({ ...role, name: event.target.value })
                  }
                />
              </CatalogField>
              <CatalogField name="description">
                <span>Description</span>
                <textarea
                  maxLength={500}
                  rows={3}
                  value={role.description}
                  onChange={(event) =>
                    setRole({ ...role, description: event.target.value })
                  }
                />
              </CatalogField>
            </CatalogPanel>
            <CatalogPanel
              title={<>Model permissions</>}
              description={
                <>
                  Choose the actions this role can perform for each admin model.
                </>
              }
              bodyClassName="access-permission-wrap"
            >
              <div data-admin-field="permissions" tabIndex={-1}><FieldError name="permissions"/><table className="access-permission-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    {adminActions.map((action) => (
                      <th key={action}>{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adminResources.map((resource) => (
                    <tr key={resource.key}>
                      <th>{resource.label}</th>
                      {adminActions.map((action) => (
                        <td key={action}>
                          <label>
                            <input
                              type="checkbox"
                              checked={
                                role.permissions[resource.key]?.includes(
                                  action,
                                ) ?? false
                              }
                              onChange={(event) =>
                                setPermission(
                                  resource.key,
                                  action,
                                  event.target.checked,
                                )
                              }
                            />
                            <span aria-hidden="true">
                              <Icon name="check" />
                            </span>
                            <span className="sr-only">
                              Allow {action} for {resource.label}
                            </span>
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </CatalogPanel>
          </CatalogFormMain>
          <CatalogFormSidebar>
            <CatalogPanel
              title={<>Summary</>}
              description={<>Permissions granted by this role.</>}
              bodyClassName="catalog-panel-body"
            >
              <div className="access-permission-total">
                <b>{permissionCount(role.permissions)}</b>
                <span>
                  of {adminResources.length * adminActions.length} permissions
                </span>
              </div>
              <p className="catalog-muted">
                Role changes apply the next time an admin opens a page or
                submits a change.
              </p>
            </CatalogPanel>
          </CatalogFormSidebar>
        </CatalogFormGrid>
      </AdminForm>
    </section></AdminFormProvider>
  );
}
