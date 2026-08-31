/// <reference path="../pb_data/types.d.ts" />

/**
 * Ensure transactions collection exists with full schema + secretary/admin ACL.
 * Recreates the collection when the broken stub (id-only) is detected.
 */
migrate((app) => {
  const adminOrSec =
    "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'secretary')";

  const fieldDefs = [
    {
      id: "rel_tx_patient",
      name: "patient",
      type: "relation",
      required: true,
      collectionId: "_pb_users_auth_",
      cascadeDelete: false,
      maxSelect: 1
    },
    {
      id: "rel_tx_appointment",
      name: "appointment",
      type: "relation",
      required: false,
      collectionId: "pbc_1037645436",
      cascadeDelete: false,
      maxSelect: 1
    },
    {
      id: "text_tx_title",
      name: "title",
      type: "text",
      required: true,
      max: 200
    },
    {
      id: "num_tx_expected",
      name: "expected_amount",
      type: "number",
      required: true,
      min: 0
    },
    {
      id: "num_tx_paid",
      name: "paid_amount",
      type: "number",
      required: false,
      min: 0
    },
    {
      id: "select_tx_status",
      name: "status",
      type: "select",
      required: true,
      maxSelect: 1,
      values: ["paid", "unpaid", "partial", "waived"]
    },
    {
      id: "select_tx_method",
      name: "method",
      type: "select",
      required: false,
      maxSelect: 1,
      values: ["cash", "card", "transfer", "other"]
    },
    {
      id: "date_tx_paid_at",
      name: "paid_at",
      type: "date",
      required: false
    },
    {
      id: "text_tx_notes",
      name: "notes",
      type: "text",
      required: false,
      max: 500
    },
    {
      id: "rel_tx_created_by",
      name: "created_by",
      type: "relation",
      required: false,
      collectionId: "_pb_users_auth_",
      cascadeDelete: false,
      maxSelect: 1
    }
  ];

  let transactions;
  try {
    transactions = app.findCollectionByNameOrId("transactions");
  } catch {
    transactions = null;
  }

  const needsRecreate =
    !transactions || !transactions.fields.getByName("patient");

  if (needsRecreate) {
    if (transactions) {
      app.delete(transactions);
    }

    const collection = new Collection({
      id: "pbc_3174063690",
      name: "transactions",
      type: "base",
      listRule: adminOrSec,
      viewRule: adminOrSec,
      createRule: adminOrSec,
      updateRule: adminOrSec,
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        {
          id: "text3208210256",
          name: "id",
          type: "text",
          primaryKey: true,
          required: true,
          autogeneratePattern: "[a-z0-9]{15}",
          min: 15,
          max: 15,
          pattern: "^[a-z0-9]+$"
        },
        ...fieldDefs
      ]
    });

    app.save(collection);
    return;
  }

  for (const def of fieldDefs) {
    if (!transactions.fields.getByName(def.name)) {
      transactions.fields.add(new Field(def));
    }
  }

  transactions.listRule = adminOrSec;
  transactions.viewRule = adminOrSec;
  transactions.createRule = adminOrSec;
  transactions.updateRule = adminOrSec;
  transactions.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'";
  app.save(transactions);
}, (app) => {
  /* keep schema on rollback */
});
