/// <reference path="../pb_data/types.d.ts" />

/**
 * Web Push subscriptions for PWA notifications (panel users).
 * Created/updated server-side via SvelteKit API; users manage via subscribe/unsubscribe.
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

  let subs;
  try {
    subs = app.findCollectionByNameOrId("push_subscriptions");
  } catch {
    subs = new Collection({
      id: "pbc_push_subs",
      name: "push_subscriptions",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_pushsub_id")]
    });
    app.save(subs);
    subs = app.findCollectionByNameOrId("push_subscriptions");
  }

  const addField = (def) => {
    if (!subs.fields.getByName(def.name)) {
      subs.fields.add(new Field(def));
    }
  };

  addField({
    id: "rel_pushsub_user",
    name: "user",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: true,
    maxSelect: 1
  });
  addField({
    id: "text_pushsub_endpoint",
    name: "endpoint",
    type: "text",
    required: true,
    max: 2048
  });
  addField({
    id: "text_pushsub_p256dh",
    name: "p256dh",
    type: "text",
    required: true,
    max: 512
  });
  addField({
    id: "text_pushsub_auth",
    name: "auth",
    type: "text",
    required: true,
    max: 512
  });
  addField({
    id: "text_pushsub_ua",
    name: "user_agent",
    type: "text",
    required: false,
    max: 500
  });
  addField({
    id: "bool_pushsub_enabled",
    name: "enabled",
    type: "bool",
    required: false
  });

  app.save(subs);

  subs = app.findCollectionByNameOrId("push_subscriptions");
  const own = "user = @request.auth.id";
  subs.listRule = own;
  subs.viewRule = own;
  subs.createRule = null;
  subs.updateRule = null;
  subs.deleteRule = own + " || @request.auth.role = 'admin'";
  app.save(subs);
});
