/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  // Allow public read of doctor profiles (for landing expand)
  users.viewRule =
    "id = @request.auth.id || role = 'doctor' || @request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
  users.listRule =
    "id = @request.auth.id || role = 'doctor' || @request.auth.role = 'admin' || @request.auth.role = 'secretary'";
  app.save(users);

  // Add display_name on doctors as fallback
  const doctors = app.findCollectionByNameOrId("doctors");
  if (!doctors.fields.getByName("display_name")) {
    doctors.fields.add(
      new Field({
        id: "text_doc_display",
        name: "display_name",
        type: "text",
        required: false,
        max: 80
      })
    );
  }
  app.save(doctors);

  const docs = app.findAllRecords("doctors");
  for (const doc of docs) {
    try {
      const user = app.findRecordById("users", doc.get("user"));
      doc.set("display_name", user.getString("name"));
      app.save(doc);
    } catch {
      /* skip */
    }
  }
}, (app) => {});
