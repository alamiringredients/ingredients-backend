import { emptyDocument } from "@/lib/editor/document";
import type {
  HomeSeoContent,
  LocalizedDocument,
  LocalizedValue,
} from "@/lib/cms/contracts";

export type EventKind = "event" | "recap";
export type EventContent = {
  seedVersion?: number;
  title: LocalizedDocument;
  eyebrow: LocalizedValue;
  summary: LocalizedValue;
  location: LocalizedValue;
  venue: LocalizedValue;
  stand: LocalizedValue;
  body: LocalizedDocument;
  heroImage: string;
  heroAlt: LocalizedValue;
  heroCaption: LocalizedValue;
  seo: HomeSeoContent;
};
export type EventRecord = {
  id: number;
  slug: string;
  kind: EventKind;
  published: boolean;
  sort_order: number;
  starts_at: string;
  ends_at: string;
  timezone: string;
  content: EventContent;
  created_at?: string;
  updated_at?: string;
};
export type EventSlotStatus = "available" | "reserved";
export type PublicEventSlot = {
  id: number;
  eventId: number;
  startsAt: string;
  endsAt: string;
  status: EventSlotStatus;
};
export type EventSlotRecord = PublicEventSlot & {
  reservationName: string;
  reservationCompany: string;
  reservationEmail: string;
  reservationCountry: string;
  reservationDialCode: string;
  reservationPhone: string;
  reservationTopic: string;
  reservationMessage: string;
  reservationLocale: string;
  mailStatus: string;
  messageId: string;
  reservedAt: string | null;
};

const emptyLocalized = (): LocalizedValue => ({ en: "", ar: "", fr: "" });
const emptyDocuments = () => ({
  en: emptyDocument(),
  ar: emptyDocument(),
  fr: emptyDocument(),
});
export const newEvent = (): EventRecord => ({
  id: 0,
  slug: "",
  kind: "event",
  published: false,
  sort_order: 0,
  starts_at: new Date().toISOString(),
  ends_at: new Date(Date.now() + 86400000).toISOString(),
  timezone: "Africa/Cairo",
  content: {
    title: emptyDocuments(),
    eyebrow: { en: "Event", ar: "فعالية", fr: "Événement" },
    summary: emptyLocalized(),
    location: emptyLocalized(),
    venue: emptyLocalized(),
    stand: emptyLocalized(),
    body: emptyDocuments(),
    heroImage: "",
    heroAlt: emptyLocalized(),
    heroCaption: emptyLocalized(),
    seo: {
      title: emptyLocalized(),
      description: emptyLocalized(),
      socialTitle: emptyLocalized(),
      socialDescription: emptyLocalized(),
      socialImage: "",
    },
  },
});
