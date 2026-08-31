/// <reference path="../pb_data/types.d.ts" />

/**
 * In-app notifications for panel users (bell icon).
 * Created server-side only; users read/update their own records.
 */
migrate((app) => {
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

  let notifications;
  try {
    notifications = app.findCollectionByNameOrId("notifications");
  } catch {
    notifications = new Collection({
      id: "pbc_notifications",
      name: "notifications",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_notif_id")]
    });
    app.save(notifications);
    notifications = app.findCollectionByNameOrId("notifications");
  }

  const addField = (def) => {
    if (!notifications.fields.getByName(def.name)) {
      notifications.fields.add(new Field(def));
    }
  };

  addField({
    id: "rel_notif_recipient",
    name: "recipient",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: true,
    maxSelect: 1
  });
  addField({
    id: "select_notif_type",
    name: "type",
    type: "select",
    required: true,
    maxSelect: 1,
    values: [
      "appointment_created",
      "appointment_cancelled",
      "appointment_rescheduled",
      "system"
    ]
  });
  addField({
    id: "text_notif_title",
    name: "title",
    type: "text",
    required: true,
    max: 200
  });
  addField({
    id: "text_notif_body",
    name: "body",
    type: "text",
    required: false,
    max: 500
  });
  addField({
    id: "text_notif_href",
    name: "href",
    type: "text",
    required: false,
    max: 300
  });
  addField({
    id: "date_notif_read",
    name: "read_at",
    type: "date",
    required: false
  });
  addField({
    id: "select_notif_priority",
    name: "priority",
    type: "select",
    required: true,
    maxSelect: 1,
    values: ["normal", "urgent"]
  });
  addField({
    id: "json_notif_meta",
    name: "metadata",
    type: "json",
    required: false
  });

  app.save(notifications);

  notifications = app.findCollectionByNameOrId("notifications");
  const own = "recipient = @request.auth.id";
  notifications.listRule = own;
  notifications.viewRule = own;
  notifications.updateRule = own;
  notifications.createRule = null;
  notifications.deleteRule = own + " || @request.auth.role = 'admin'";
  app.save(notifications);
});
