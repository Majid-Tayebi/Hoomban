/// <reference path="../pb_data/types.d.ts" />

/** DB-backed OTP for mobile number change (server/admin only). */
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

  let mobileChangeOtps;
  try {
    mobileChangeOtps = app.findCollectionByNameOrId("mobile_change_otps");
  } catch {
    mobileChangeOtps = new Collection({
      id: "pbc_mobile_change_otps",
      name: "mobile_change_otps",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_mco_id")]
    });
    app.save(mobileChangeOtps);
    mobileChangeOtps = app.findCollectionByNameOrId("mobile_change_otps");
  }

  const addField = (def) => {
    if (!mobileChangeOtps.fields.getByName(def.name)) mobileChangeOtps.fields.add(new Field(def));
  };

  addField({
    id: "rel_mco_target",
    name: "target_user",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: true,
    maxSelect: 1
  });
  addField({
    id: "rel_mco_requester",
    name: "requested_by",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });
  addField({ id: "text_mco_mobile", name: "new_mobile", type: "text", required: true, max: 15 });
  addField({ id: "text_mco_code", name: "code", type: "text", required: true, max: 12 });
  addField({ id: "date_mco_expires", name: "expires_at", type: "date", required: true });
  addField({ id: "bool_mco_consumed", name: "consumed", type: "bool", required: false });
  addField({
    id: "num_mco_attempts",
    name: "verify_attempts",
    type: "number",
    required: false,
    min: 0
  });
  app.save(mobileChangeOtps);
});
