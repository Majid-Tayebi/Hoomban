/// <reference path="../pb_data/types.d.ts" />

/** Internal staff messaging inbox (not SMS / not system notifications). */
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

  let messages;
  try {
    messages = app.findCollectionByNameOrId("internal_messages");
  } catch {
    messages = new Collection({
      id: "pbc_internal_messages",
      name: "internal_messages",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_imsg_id")]
    });
    app.save(messages);
    messages = app.findCollectionByNameOrId("internal_messages");
  }

  const addField = (def) => {
    if (!messages.fields.getByName(def.name)) {
      messages.fields.add(new Field(def));
    }
  };

  addField({
    id: "rel_imsg_sender",
    name: "sender",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });
  addField({
    id: "rel_imsg_recipient",
    name: "recipient",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });
  addField({ id: "text_imsg_subject", name: "subject", type: "text", required: true, max: 200 });
  addField({ id: "text_imsg_body", name: "body", type: "text", required: true, max: 10000 });
  addField({ id: "date_imsg_read", name: "read_at", type: "date", required: false });
  addField({ id: "bool_imsg_star", name: "starred", type: "bool", required: false });

  app.save(messages);

  messages = app.findCollectionByNameOrId("internal_messages");
  const participant =
    "sender = @request.auth.id || recipient = @request.auth.id";
  messages.listRule = participant;
  messages.viewRule = participant;
  messages.createRule = "sender = @request.auth.id";
  messages.updateRule = participant;
  messages.deleteRule =
    "sender = @request.auth.id || @request.auth.role = 'admin'";
  app.save(messages);

  function findUser(mobile) {
    try {
      return app.findFirstRecordByFilter("users", `mobile = "${mobile}"`);
    } catch {
      return null;
    }
  }

  const admin = findUser("09120000004");
  const secretary = findUser("09120000003");
  const doctor = findUser("09120000001");

  if (admin && secretary) {
    try {
      app.findFirstRecordByFilter(
        "internal_messages",
        `subject = "هماهنگی شیفت هفته آینده"`
      );
    } catch {
      const row = new Record(messages);
      row.set("sender", admin.id);
      row.set("recipient", secretary.id);
      row.set("subject", "هماهنگی شیفت هفته آینده");
      row.set(
        "body",
        "سلام،\n\nلطفاً برنامه نوروفیدبک را تا چهارشنبه نهایی کنید و لیست بیماران را در تقویم به‌روز نگه دارید.\n\nبا تشکر،\nمدیر کلینیک"
      );
      row.set("starred", true);
      app.save(row);
    }
  }

  if (doctor && admin) {
    try {
      app.findFirstRecordByFilter(
        "internal_messages",
        `subject = "درخواست سفارش ژل رسانا"`
      );
    } catch {
      const row = new Record(messages);
      row.set("sender", doctor.id);
      row.set("recipient", admin.id);
      row.set("subject", "درخواست سفارش ژل رسانا");
      row.set(
        "body",
        "با توجه به موجودی کم ژل رسانا، لطفاً ۱۰ بطری سفارش دهید."
      );
      row.set("starred", false);
      app.save(row);
    }
  }
});
