/// <reference path="../pb_data/types.d.ts" />

/** Clinic inventory — equipment and consumables (admin + secretary). */
migrate((app) => {
  const adminOrSec =
    "@request.auth.role = 'admin' || @request.auth.role = 'secretary'";

  const pkField = (id) => ({
    id,
    name: "id",
    type: "text",
    primaryKey: true,
    required: true,
    autogeneratePattern: "[a-z0-9]{15}",
    min: 15,
    max: 15,
    pattern: "^[a-z0-9]+$"
  });

  let inventory;
  try {
    inventory = app.findCollectionByNameOrId("inventory_items");
  } catch {
    inventory = new Collection({
      id: "pbc_inventory_items",
      name: "inventory_items",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_inv_id")]
    });
    app.save(inventory);
    inventory = app.findCollectionByNameOrId("inventory_items");
  }

  const addField = (def) => {
    if (!inventory.fields.getByName(def.name)) {
      inventory.fields.add(new Field(def));
    }
  };

  addField({ id: "text_inv_name", name: "name", type: "text", required: true, max: 200 });
  addField({ id: "text_inv_sku", name: "sku", type: "text", required: true, max: 50 });
  addField({ id: "text_inv_category", name: "category", type: "text", required: true, max: 100 });
  addField({ id: "num_inv_qty", name: "quantity", type: "number", required: false, min: 0 });
  addField({ id: "text_inv_unit", name: "unit", type: "text", required: true, max: 30 });
  addField({ id: "num_inv_min", name: "min_stock", type: "number", required: true, min: 0 });
  addField({ id: "text_inv_loc", name: "location", type: "text", required: false, max: 120 });

  app.save(inventory);

  inventory = app.findCollectionByNameOrId("inventory_items");
  inventory.listRule = adminOrSec;
  inventory.viewRule = adminOrSec;
  inventory.createRule = adminOrSec;
  inventory.updateRule = adminOrSec;
  inventory.deleteRule = "@request.auth.role = 'admin'";
  app.save(inventory);

  const seed = [
    ["NF-EL-01", "الکترود نوروفیدبک", "تجهیزات", 48, "عدد", 20, "اتاق نوروتراپی"],
    ["NF-GEL-02", "ژل رسانا", "مصرفی", 8, "بطری", 12, "انبار اصلی"],
    ["MED-GL-03", "دستکش یک‌بارمصرف", "مصرفی", 0, "بسته", 10, "پذیرش"],
    ["TD-HS-04", "هدست TDCS", "تجهیزات", 6, "دستگاه", 2, "اتاق نوروتراپی"],
    ["ADM-FM-05", "فرم رضایت‌نامه چاپی", "اداری", 120, "برگ", 50, "منشی"],
    ["MED-MSK-06", "ماسک سه‌لایه", "مصرفی", 15, "بسته", 20, "انبار اصلی"]
  ];

  for (const [sku, name, category, quantity, unit, minStock, location] of seed) {
    try {
      app.findFirstRecordByFilter("inventory_items", `sku = "${sku}"`);
    } catch {
      const row = new Record(inventory);
      row.set("sku", sku);
      row.set("name", name);
      row.set("category", category);
      row.set("quantity", Number(quantity));
      row.set("unit", unit);
      row.set("min_stock", Number(minStock));
      row.set("location", location);
      app.save(row);
    }
  }
});
