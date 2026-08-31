/// <reference path="../pb_data/types.d.ts" />

/** Link testimonials to doctors for per-specialist reviews on landing. */
migrate((app) => {
  let testimonials;
  try {
    testimonials = app.findCollectionByNameOrId("testimonials");
  } catch {
    return;
  }

  if (!testimonials.fields.getByName("doctor")) {
    testimonials.fields.add(
      new Field({
        id: "rel_tm_doctor",
        name: "doctor",
        type: "relation",
        required: false,
        collectionId: "pbc_656799828",
        cascadeDelete: false,
        maxSelect: 1
      })
    );
    app.save(testimonials);
    testimonials = app.findCollectionByNameOrId("testimonials");
  }

  let khansari;
  try {
    khansari = app.findFirstRecordByFilter("doctors", `display_name ~ "خوانساری"`);
  } catch {
    khansari = null;
  }

  if (!khansari) return;

  const items = app.findRecordsByFilter("testimonials", "is_published = true");
  for (const rec of items) {
    if (rec.get("doctor")) continue;
    const body = String(rec.get("body") || "");
    const mentionsKhansari =
      body.includes("خوانساری") ||
      String(rec.get("sort_order") || 0) <= 5;
    if (mentionsKhansari) {
      rec.set("doctor", khansari.id);
      app.save(rec);
    }
  }
});
