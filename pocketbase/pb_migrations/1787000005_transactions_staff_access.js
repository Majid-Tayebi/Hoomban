/// <reference path="../pb_data/types.d.ts" />

/**
 * Fix transactions collection: fields + secretary/admin API rules.
 * (1787000004 may have been marked applied before schema was persisted.)
 */
migrate((app) => {
  const adminOrSec =
    "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'secretary')";

  const transactions = app.findCollectionByNameOrId("transactions");

  const addField = (def) => {
    if (!transactions.fields.getByName(def.name)) {
      transactions.fields.add(new Field(def));
    }
  };

  addField({
    id: "rel_tx_patient",
    name: "patient",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });
  addField({
    id: "rel_tx_appointment",
    name: "appointment",
    type: "relation",
    required: false,
    collectionId: "pbc_1037645436",
    cascadeDelete: false,
    maxSelect: 1
  });
  addField({
    id: "text_tx_title",
    name: "title",
    type: "text",
    required: true,
    max: 200
  });
  addField({
    id: "num_tx_expected",
    name: "expected_amount",
    type: "number",
    required: true,
    min: 0
  });
  addField({
    id: "num_tx_paid",
    name: "paid_amount",
    type: "number",
    required: false,
    min: 0
  });
  addField({
    id: "select_tx_status",
    name: "status",
    type: "select",
    required: true,
    maxSelect: 1,
    values: ["paid", "unpaid", "partial", "waived"]
  });
  addField({
    id: "select_tx_method",
    name: "method",
    type: "select",
    required: false,
    maxSelect: 1,
    values: ["cash", "card", "transfer", "other"]
  });
  addField({
    id: "date_tx_paid_at",
    name: "paid_at",
    type: "date",
    required: false
  });
  addField({
    id: "text_tx_notes",
    name: "notes",
    type: "text",
    required: false,
    max: 500
  });
  addField({
    id: "rel_tx_created_by",
    name: "created_by",
    type: "relation",
    required: false,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });

  transactions.listRule = adminOrSec;
  transactions.viewRule = adminOrSec;
  transactions.createRule = adminOrSec;
  transactions.updateRule = adminOrSec;
  transactions.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'";

  app.save(transactions);
}, (app) => {
  /* no down migration — keep schema */
});
