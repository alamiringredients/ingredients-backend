"use server";

import { requireAdminPermission } from "@/server/admin/authorization";
import {adminActionError,redirectCreatedRecord} from '@/server/admin/form-actions';
import { normalizeEventContent } from "@/lib/events/content";
import type { EventKind } from "@/lib/events/contracts";
import {eventForm,eventSlotGeneratorForm} from "@/server/http/controllers/event-schema";
import Event from "@/server/models/Event";
import EventSlot from "@/server/models/EventSlot";
import { validate } from "@holo-js/forms";
import { revalidatePath } from "next/cache";

const resultError=adminActionError;

export async function saveEventAction(id:number,payload:string) {
  try {
    await requireAdminPermission('events',id?'edit':'create');
    if(!Number.isSafeInteger(id)||id<0||payload.length>1000000)throw new Error('Invalid event request.');
    const submitted=JSON.parse(payload);
    const data={...submitted,...await validate(submitted,eventForm)};
    if(Date.parse(data.ends_at)<=Date.parse(data.starts_at))return {ok:false,message:'Please correct the highlighted fields.',errors:{ends_at:['The event must end after it starts.']}};
    const duplicate=await Event.where('slug',data.slug).firstJson();
    if(duplicate&&Number(duplicate.id)!==id)return {ok:false,message:'Please correct the highlighted fields.',errors:{slug:['This event slug is already in use.']}};
    const values={slug:data.slug,kind:data.kind as EventKind,published:Boolean(data.published),sort_order:data.sort_order,starts_at:new Date(data.starts_at),ends_at:new Date(data.ends_at),timezone:data.timezone,content:normalizeEventContent(data.content)};
    let savedId=id;
    if(id)await (await Event.findOrFail(id)).update(values);
    else savedId=Number((await Event.create(values)).id);
    
    revalidatePath('/admin/events');
    await redirectCreatedRecord(id,savedId,'/admin/events','events');
    return {ok:true as const,message:'Event saved.',id:savedId};
  }catch(error){return resultError(error)}
}

function zonedUtc(date: string, time: string, timeZone: string) {
  const [year, month, day] = date.split("-").map(Number),
    [hour, minute] = time.split(":").map(Number);
  const desired = Date.UTC(year, month - 1, day, hour, minute),
    formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  let guess = desired;
  for (let attempt = 0; attempt < 2; attempt++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(guess))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, Number(part.value)]),
    );
    const observed = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    guess += desired - observed;
  }
  return new Date(guess);
}

export async function generateEventSlotsAction(formData: FormData) {
  try {
    await requireAdminPermission("events", "edit");
    const data = await validate(formData, eventSlotGeneratorForm),
      event = await Event.findOrFail(Number(data.eventId));
    const start = zonedUtc(
        String(data.date),
        String(data.startTime),
        event.timezone,
      ),
      end = zonedUtc(String(data.date), String(data.endTime), event.timezone),
      duration = Number(data.duration);
    if (end <= start)
      return {ok:false,message:'Please correct the highlighted fields.',errors:{endTime:['The appointment window must end after it starts.']}};
    let created = 0;
    for (
      let cursor = +start;
      cursor + duration * 60000 <= +end;
      cursor += duration * 60000
    ) {
      const startsAt = new Date(cursor),
        row = await EventSlot.where("event_id", Number(event.id))
          .where("starts_at", startsAt)
          .firstJson();
      if (row) continue;
      await EventSlot.create({
        event_id: Number(event.id),
        starts_at: startsAt,
        ends_at: new Date(cursor + duration * 60000),
        status: "available",
      });
      created++;
    }
    
    revalidatePath(`/admin/events/${event.id}/edit`);
    return {
      ok: true as const,
      message: created
        ? `${created} appointment slots added.`
        : "Every slot in that window already exists.",
    };
  } catch (error) {
    return resultError(error);
  }
}

export async function deleteEventSlotAction(id: number) {
  try {
    await requireAdminPermission("events", "edit");
    const slot = await EventSlot.findOrFail(id);
    if (slot.status !== "available")
      throw new Error("Reserved appointments cannot be deleted.");
    await slot.delete();
    
    return { ok: true as const, message: "Appointment slot removed." };
  } catch (error) {
    return resultError(error);
  }
}
export async function deleteEventAction(id: number) {
  try {
    await requireAdminPermission("events", "delete");
    const reserved = await EventSlot.where("event_id", id)
      .where("status", "reserved")
      .count();
    if (reserved)
      throw new Error(
        "This event has reservations and cannot be deleted. Unpublish it instead.",
      );
    await (await Event.findOrFail(id)).delete();
    
    return { ok: true as const, message: "Event deleted." };
  } catch (error) {
    return resultError(error);
  }
}
