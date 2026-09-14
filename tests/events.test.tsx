import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  EventDetailBody,
  EventsPageBody,
} from "../components/events/public-content";
import { textContent } from "../lib/editor/document";
import { getEventSeedRecords } from "../server/db/seeders/EventSeeder";

const labels = {
  home: "Home",
  events: "Events",
  breadcrumb: "Breadcrumb",
  toc: "In this article",
  shareX: "Share on X",
  shareLinkedIn: "Share on LinkedIn",
  copy: "Copy link",
  copied: "Link copied",
  tradeShow: "Trade show",
  eventRecap: "Event recap",
  arrangeStandMeeting: "Arrange a stand meeting",
  requestQuote: "Request a quote",
  allEvents: "All events",
};

test("event details use the News article shell and one TipTap body", () => {
  const seed = getEventSeedRecords()[0];
  const event = {
    ...seed,
    id: 1,
  };
  const html = renderToStaticMarkup(
    <EventDetailBody event={event} locale="en" labels={labels} />,
  );
  assert.match(html, /class="art-hero"/);
  assert.match(html, /class="wrap art-lead"/);
  assert.match(html, /class="wrap art-grid"/);
  assert.match(html, /data-rich-content/);
  assert.doesNotMatch(html, /class="page-hero"/);
  assert.match(html, /What we will have on the stand/);
  assert.match(html, /Aseptic filling at the Sadat City facility/);
});

test("event seeding contains the complete reference event and recap bodies", () => {
  const seeds = getEventSeedRecords();
  const event = seeds.find((seed) => seed.slug === "gulfood-manufacturing-2026")!;
  const recap = seeds.find((seed) => seed.slug === "anuga-2025")!;
  assert.match(
    textContent(event.content.body.en),
    /Every sample on the stand is drawn from a real production batch/,
  );
  assert.match(
    textContent(recap.content.body.en),
    /Sampling programmes opened with buyers across Europe and the GCC/,
  );
  assert.equal(
    recap.content.body.en.content.some((node) => node.type === "gallery"),
    true,
  );
});

test("event cards display the CMS introduction without prepending location", () => {
  const seeds = getEventSeedRecords();
  const recap = seeds.find((item) => item.slug === "anuga-2025")!;
  const upcoming = seeds.find((item) => item.slug === "fruit-logistica-2027")!;
  const html = renderToStaticMarkup(
    <EventsPageBody
      events={[
        { ...recap, id: 4 },
        { ...upcoming, id: 2 },
      ]}
      locale="en"
    />,
  );
  assert.match(html, new RegExp(recap.content.summary.en));
  assert.doesNotMatch(
    html,
    new RegExp(`${recap.content.location.en} — ${recap.content.summary.en}`),
  );
  assert.match(html, new RegExp(upcoming.content.summary.en));
  assert.doesNotMatch(
    html,
    new RegExp(
      `${upcoming.content.location.en} — ${upcoming.content.summary.en}`,
    ),
  );
});
