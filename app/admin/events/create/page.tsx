import { EventEditor } from "@/components/admin/event-manager";
import { requireAdminPagePermission } from "@/server/admin/authorization";
import { newEvent } from "@/lib/events/contracts";

export default async function Page() {
  await requireAdminPagePermission("events", "create");
  return <EventEditor initial={newEvent()} slots={[]} canEdit />;
}
