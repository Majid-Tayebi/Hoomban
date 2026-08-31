/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3174063690");

  return app.delete(collection);
}, (app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'secretary')",
    "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "rel_tx_patient",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "patient",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_1037645436",
        "hidden": false,
        "id": "rel_tx_appointment",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "appointment",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_tx_title",
        "max": 200,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "num_tx_expected",
        "max": null,
        "min": 0,
        "name": "expected_amount",
        "onlyInt": false,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "num_tx_paid",
        "max": null,
        "min": 0,
        "name": "paid_amount",
        "onlyInt": false,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": false,
        "id": "select_tx_status",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "paid",
          "unpaid",
          "partial",
          "waived"
        ]
      },
      {
        "hidden": false,
        "id": "select_tx_method",
        "maxSelect": 1,
        "name": "method",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "cash",
          "card",
          "transfer",
          "other"
        ]
      },
      {
        "hidden": false,
        "id": "date_tx_paid_at",
        "max": "",
        "min": "",
        "name": "paid_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text_tx_notes",
        "max": 500,
        "min": 0,
        "name": "notes",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "rel_tx_created_by",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "created_by",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      }
    ],
    "id": "pbc_3174063690",
    "indexes": [],
    "listRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'secretary')",
    "name": "transactions",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'secretary')",
    "viewRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'secretary')"
  });

  return app.save(collection);
})
