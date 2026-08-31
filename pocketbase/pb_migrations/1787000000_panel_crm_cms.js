/// <reference path="../pb_data/types.d.ts" />

/**
 * Panel CRM/CMS schema: patient profiles, clinical notes (doctor+admin only),
 * file fields, tighter appointment rules, scoring_rules, sms_outbox.
 *
 * Rules that reference fields are applied ONLY after those fields exist.
 */
migrate((app) => {
  const adminOrSec = "@request.auth.role = 'admin' || @request.auth.role = 'secretary'";
  const adminOrWriterOrSec =
    "@request.auth.role = 'admin' || @request.auth.role = 'writer' || @request.auth.role = 'secretary'";
  const noteAccess =
    "@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && doctor.user = @request.auth.id)";
  const aptList =
    "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || (@request.auth.role = 'doctor' && doctor.user = @request.auth.id) || patient = @request.auth.id";

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

  // ---------- users ----------
  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  users.listRule =
    "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
  users.viewRule =
    "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
  users.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'";
  users.createRule = "";
  app.save(users);

  // ---------- staff_registry ----------
  const staff = app.findCollectionByNameOrId("staff_registry");
  staff.listRule = "@request.auth.role = 'admin'";
  staff.viewRule = "@request.auth.role = 'admin'";
  staff.createRule = "@request.auth.role = 'admin'";
  staff.updateRule = "@request.auth.role = 'admin'";
  staff.deleteRule = "@request.auth.role = 'admin'";
  app.save(staff);

  // ---------- doctors: photo ----------
  const doctors = app.findCollectionByNameOrId("doctors");
  if (!doctors.fields.getByName("photo")) {
    doctors.fields.add(
      new Field({
        id: "file_doc_photo",
        name: "photo",
        type: "file",
        required: false,
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"]
      })
    );
  }
  doctors.listRule = "";
  doctors.viewRule = "";
  doctors.createRule = adminOrSec;
  doctors.updateRule =
    adminOrSec + " || (@request.auth.role = 'doctor' && user = @request.auth.id)";
  doctors.deleteRule = "@request.auth.role = 'admin'";
  app.save(doctors);

  // ---------- appointments ----------
  const appointments = app.findCollectionByNameOrId("appointments");
  if (!appointments.fields.getByName("notes_public")) {
    appointments.fields.add(
      new Field({
        id: "text_apt_notes_pub",
        name: "notes_public",
        type: "text",
        required: false,
        max: 1000
      })
    );
  }
  appointments.listRule = aptList;
  appointments.viewRule = aptList;
  appointments.createRule = "@request.auth.id != ''";
  appointments.updateRule = adminOrSec + " || @request.auth.role = 'doctor'";
  appointments.deleteRule = "@request.auth.role = 'admin'";
  app.save(appointments);

  // ---------- articles ----------
  const articles = app.findCollectionByNameOrId("articles");
  if (!articles.fields.getByName("cover")) {
    articles.fields.add(
      new Field({
        id: "file_art_cover",
        name: "cover",
        type: "file",
        required: false,
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"]
      })
    );
  }
  if (!articles.fields.getByName("author")) {
    articles.fields.add(
      new Field({
        id: "rel_art_author",
        name: "author",
        type: "relation",
        required: false,
        collectionId: "_pb_users_auth_",
        cascadeDelete: false,
        maxSelect: 1
      })
    );
  }
  articles.listRule = "";
  articles.viewRule = "";
  articles.createRule = adminOrWriterOrSec;
  articles.updateRule = adminOrWriterOrSec;
  articles.deleteRule = "@request.auth.role = 'admin'";
  app.save(articles);

  // ---------- psych_tests: scoring_rules ----------
  const psychTests = app.findCollectionByNameOrId("psych_tests");
  if (!psychTests.fields.getByName("scoring_rules")) {
    psychTests.fields.add(
      new Field({
        id: "json_test_scoring",
        name: "scoring_rules",
        type: "json",
        required: false
      })
    );
  }
  app.save(psychTests);

  // ---------- patient_profiles (create with null rules, then fields, then rules) ----------
  let patientProfiles;
  try {
    patientProfiles = app.findCollectionByNameOrId("patient_profiles");
  } catch {
    patientProfiles = new Collection({
      id: "pbc_patient_profiles",
      name: "patient_profiles",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_pp_id")]
    });
    app.save(patientProfiles);
    patientProfiles = app.findCollectionByNameOrId("patient_profiles");
  }

  const addPp = (def) => {
    if (!patientProfiles.fields.getByName(def.name)) patientProfiles.fields.add(new Field(def));
  };
  addPp({
    id: "rel_pp_user",
    name: "user",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: true,
    maxSelect: 1
  });
  addPp({ id: "text_pp_nid", name: "national_id", type: "text", required: false, max: 20 });
  addPp({ id: "dt_pp_birth", name: "birth_date", type: "date", required: false });
  addPp({ id: "text_pp_emerg", name: "emergency_contact", type: "text", required: false, max: 200 });
  addPp({ id: "text_pp_summary", name: "summary", type: "text", required: false, max: 5000 });
  addPp({ id: "json_pp_tags", name: "tags", type: "json", required: false });
  app.save(patientProfiles);

  patientProfiles = app.findCollectionByNameOrId("patient_profiles");
  patientProfiles.listRule =
    "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
  patientProfiles.viewRule =
    "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor' || user = @request.auth.id";
  patientProfiles.createRule = adminOrSec + " || @request.auth.role = 'doctor'";
  patientProfiles.updateRule = adminOrSec + " || @request.auth.role = 'doctor'";
  patientProfiles.deleteRule = "@request.auth.role = 'admin'";
  app.save(patientProfiles);

  // ---------- clinical_notes ----------
  let clinicalNotes;
  try {
    clinicalNotes = app.findCollectionByNameOrId("clinical_notes");
  } catch {
    clinicalNotes = new Collection({
      id: "pbc_clinical_notes",
      name: "clinical_notes",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_cn_id")]
    });
    app.save(clinicalNotes);
    clinicalNotes = app.findCollectionByNameOrId("clinical_notes");
  }

  const addCn = (def) => {
    if (!clinicalNotes.fields.getByName(def.name)) clinicalNotes.fields.add(new Field(def));
  };
  addCn({
    id: "rel_cn_patient",
    name: "patient",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: true,
    maxSelect: 1
  });
  addCn({
    id: "rel_cn_doctor",
    name: "doctor",
    type: "relation",
    required: true,
    collectionId: "pbc_656799828",
    cascadeDelete: false,
    maxSelect: 1
  });
  addCn({
    id: "rel_cn_apt",
    name: "appointment",
    type: "relation",
    required: false,
    collectionId: "pbc_1037645436",
    cascadeDelete: false,
    maxSelect: 1
  });
  addCn({ id: "dt_cn_session", name: "session_date", type: "date", required: false });
  addCn({ id: "text_cn_text", name: "text", type: "text", required: false, max: 20000 });
  addCn({ id: "text_cn_plan", name: "treatment_plan", type: "text", required: false, max: 5000 });
  addCn({
    id: "file_cn_audio",
    name: "audio",
    type: "file",
    required: false,
    maxSelect: 5,
    maxSize: 20971520,
    mimeTypes: ["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav", "audio/x-wav"]
  });
  addCn({
    id: "rel_cn_created",
    name: "created_by",
    type: "relation",
    required: false,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });
  app.save(clinicalNotes);

  clinicalNotes = app.findCollectionByNameOrId("clinical_notes");
  clinicalNotes.listRule = noteAccess;
  clinicalNotes.viewRule = noteAccess;
  clinicalNotes.createRule = noteAccess;
  clinicalNotes.updateRule = noteAccess;
  clinicalNotes.deleteRule =
    "@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && doctor.user = @request.auth.id)";
  app.save(clinicalNotes);

  // ---------- sms_outbox ----------
  let smsOutbox;
  try {
    smsOutbox = app.findCollectionByNameOrId("sms_outbox");
  } catch {
    smsOutbox = new Collection({
      id: "pbc_sms_outbox",
      name: "sms_outbox",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_sms_id")]
    });
    app.save(smsOutbox);
    smsOutbox = app.findCollectionByNameOrId("sms_outbox");
  }

  const addSms = (def) => {
    if (!smsOutbox.fields.getByName(def.name)) smsOutbox.fields.add(new Field(def));
  };
  addSms({ id: "text_sms_to", name: "to", type: "text", required: true, max: 15 });
  addSms({ id: "text_sms_tpl", name: "template", type: "text", required: true, max: 60 });
  addSms({ id: "json_sms_payload", name: "payload", type: "json", required: false });
  addSms({ id: "text_sms_body", name: "body", type: "text", required: false, max: 500 });
  addSms({ id: "text_sms_status", name: "status", type: "text", required: true, max: 30 });
  addSms({ id: "text_sms_err", name: "error", type: "text", required: false, max: 500 });
  app.save(smsOutbox);

  smsOutbox = app.findCollectionByNameOrId("sms_outbox");
  smsOutbox.listRule = adminOrSec;
  smsOutbox.viewRule = adminOrSec;
  smsOutbox.createRule = adminOrSec;
  smsOutbox.updateRule = "@request.auth.role = 'admin'";
  smsOutbox.deleteRule = "@request.auth.role = 'admin'";
  app.save(smsOutbox);
});
