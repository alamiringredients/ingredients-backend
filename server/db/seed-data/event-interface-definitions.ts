import type { TranslationEntry } from "@/lib/translation-catalog";
import { getNewsInterfaceDefinitions } from "./news-interface-definitions";

const localized = (
  key: string,
  source: string,
  ar: string,
  fr: string,
  previousTranslations?: TranslationEntry["translations"],
): TranslationEntry => ({
  key: `event.interface.${key}`,
  page: "event-interface",
  source,
  translations: { en: source, ar, fr },
  ...(previousTranslations ? { previousTranslations } : {}),
});

export function getEventInterfaceDefinitions(): TranslationEntry[] {
  const news = new Map(
    getNewsInterfaceDefinitions().map((entry) => [
      entry.key.replace("news.interface.", ""),
      entry,
    ]),
  );
  const shared = ["home", "breadcrumb", "toc", "shareX", "shareLinkedIn", "copy", "copied"].map(
    (key) => {
      const entry = news.get(key)!;
      return { ...entry, key: `event.interface.${key}`, page: "event-interface" };
    },
  );
  return [
    ...shared,
    ...getEventFormErrorDefinitions(),
    localized("events", "Events", "الفعاليات", "Événements"),
    localized("tradeShow", "Trade show", "معرض تجاري", "Salon professionnel"),
    localized("eventRecap", "Event recap", "ملخص الفعالية", "Retour sur l’événement", { en: "Event recap", ar: "Event recap", fr: "Event recap" }),
    localized("bookMeeting", "Book a meeting", "احجز اجتماعاً", "Réserver un rendez-vous", { en: "Book a meeting", ar: "Book a meeting", fr: "Book a meeting" }),
    localized("allEvents", "All events", "جميع الفعاليات", "Tous les événements", { en: "All events", ar: "جميع الأحداث", fr: "Tous les événements" }),
    localized(
      "arrangeStandMeeting",
      "Arrange a stand meeting",
      "احجز اجتماعاً في الجناح",
      "Organiser un rendez-vous sur le stand",
      { en: "Arrange a stand meeting", ar: "ترتيب اجتماع الوقوف", fr: "Organiser une réunion de stand" },
    ),
    localized("requestQuote", "Request a quote", "طلب عرض أسعار", "Demander un devis"),
  ];
}

export function getEventFormErrorDefinitions(): TranslationEntry[] {
  return [
    localized("invalid", "Please check the required fields and choose a meeting time.", "يرجى مراجعة الحقول المطلوبة واختيار موعد للاجتماع.", "Veuillez vérifier les champs obligatoires et choisir un créneau."),
    localized("failed", "Could not book your meeting. Please try again.", "تعذر حجز اجتماعك. يرجى المحاولة مرة أخرى.", "Impossible de réserver votre rendez-vous. Veuillez réessayer."),
    localized("rate", "Please wait before trying to book again.", "يرجى الانتظار قبل محاولة الحجز مرة أخرى.", "Veuillez patienter avant de réessayer de réserver."),
  ]
}
