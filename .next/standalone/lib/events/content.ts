import {
  cmsLocales,
  type LocalizedDocument,
  type LocalizedValue,
} from "@/lib/cms/contracts";
import {
  validateDocument,
  type ContentDocument,
  type ContentNode,
} from "@/lib/editor/document";
import type { EventContent } from "./contracts";

const textNode = (text: string): ContentNode => ({ type: "text", text });
const paragraph = (text: string): ContentNode => ({
  type: "paragraph",
  content: text ? [textNode(text)] : [],
});

function documentFromText(
  value: string,
  inline = false,
): ContentDocument {
  const parts = inline ? [value] : value.split(/\n\s*\n/);
  return { type: "doc", content: (parts.length ? parts : [""]).map(paragraph) };
}

export function localizedDocuments(
  value: LocalizedValue,
  inline = false,
): LocalizedDocument {
  return Object.fromEntries(
    cmsLocales.map((locale) => [
      locale,
      documentFromText(value[locale], inline),
    ]),
  ) as LocalizedDocument;
}

function normalizeDocuments(value: unknown, inline = false): LocalizedDocument {
  if (!value || typeof value !== "object")
    throw new Error("Localized event content is missing.");
  return Object.fromEntries(
    cmsLocales.map((locale) => {
      const item = (value as Record<string, unknown>)[locale];
      const document = validateDocument(item);
      if (
        inline &&
        document.content.some(
          (node) =>
            node.type !== "paragraph" ||
            node.content?.some(
              (child) => child.type !== "text" && child.type !== "hardBreak",
            ),
        )
      )
        throw new Error(
          "Event titles and introductions only support inline formatting.",
        );
      return [locale, document];
    }),
  ) as LocalizedDocument;
}

export function normalizeEventContent(value: unknown): EventContent {
  if (!value || typeof value !== "object")
    throw new Error("The event content is not valid.");
  const content = value as EventContent;
  if (
    !content.title ||
    !content.summary ||
    !content.body ||
    !content.heroCaption ||
    !content.seo
  )
    throw new Error("The event content is not valid.");
  return {
    ...(Number.isInteger(content.seedVersion)
      ? { seedVersion: content.seedVersion }
      : {}),
    title: normalizeDocuments(content.title, true),
    eyebrow: content.eyebrow,
    summary: content.summary,
    location: content.location,
    venue: content.venue,
    stand: content.stand,
    body: normalizeDocuments(content.body),
    heroImage: content.heroImage,
    heroAlt: content.heroAlt,
    heroCaption: content.heroCaption,
    seo: content.seo,
  };
}
