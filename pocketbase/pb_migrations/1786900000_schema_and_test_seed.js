/// <reference path="../pb_data/types.d.ts" />

/**
 * Schema + test seed for local QA.
 * Test mobiles (OTP always 1234 in the app):
 *   09120000001 → روانشناس (دکتر احمدی)
 *   09120000002 → روانشناس (دکتر محمدی)
 *   09120000003 → منشی
 *   any other 09xxxxxxxxx → بیمار (on first login)
 */
migrate((app) => {
  // ---------- users: mobile field + rules ----------
  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  if (!users.fields.getByName("mobile")) {
    users.fields.add(new Field({
      id: "text_user_mobile",
      name: "mobile",
      type: "text",
      required: false,
      max: 15
    }));
  }
  users.listRule = "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'secretary'";
  users.viewRule = "id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
  users.createRule = "";
  users.updateRule = "id = @request.auth.id || @request.auth.role = 'admin'";
  app.save(users);

  // ---------- staff_registry ----------
  let staff;
  try {
    staff = app.findCollectionByNameOrId("staff_registry");
  } catch {
    staff = new Collection({
      id: "pbc_staff_registry",
      name: "staff_registry",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          id: "text_staff_id",
          name: "id",
          type: "text",
          primaryKey: true,
          required: true,
          autogeneratePattern: "[a-z0-9]{15}",
          min: 15,
          max: 15,
          pattern: "^[a-z0-9]+$"
        }
      ]
    });
    app.save(staff);
    staff = app.findCollectionByNameOrId("staff_registry");
  }

  const addStaffField = (def) => {
    if (!staff.fields.getByName(def.name)) staff.fields.add(new Field(def));
  };
  addStaffField({ id: "text_staff_mobile", name: "mobile", type: "text", required: true, max: 15 });
  addStaffField({ id: "text_staff_role", name: "role", type: "text", required: true, max: 20 });
  addStaffField({ id: "text_staff_name", name: "name", type: "text", required: true, max: 80 });
  addStaffField({ id: "bool_staff_active", name: "active", type: "bool", required: false });
  staff.listRule = "";
  staff.viewRule = "";
  app.save(staff);

  // ---------- doctors fields ----------
  const doctors = app.findCollectionByNameOrId("doctors");
  const addDocField = (def) => {
    if (!doctors.fields.getByName(def.name)) doctors.fields.add(new Field(def));
  };
  addDocField({
    id: "rel_doc_user",
    name: "user",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: true,
    maxSelect: 1
  });
  addDocField({ id: "text_doc_bio", name: "bio", type: "text", required: false, max: 500 });
  addDocField({ id: "num_doc_fee", name: "visit_fee", type: "number", required: false, min: 0 });
  addDocField({ id: "num_doc_slot", name: "slot_duration", type: "number", required: false, min: 15 });
  addDocField({ id: "json_doc_days", name: "working_days", type: "json", required: false });
  doctors.listRule = "";
  doctors.viewRule = "";
  doctors.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
  doctors.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || (@request.auth.role = 'doctor' && user = @request.auth.id)";
  doctors.deleteRule = "@request.auth.role = 'admin'";
  app.save(doctors);

  // ---------- appointments fields ----------
  const appointments = app.findCollectionByNameOrId("appointments");
  const addAptField = (def) => {
    if (!appointments.fields.getByName(def.name)) appointments.fields.add(new Field(def));
  };
  addAptField({
    id: "rel_apt_patient",
    name: "patient",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });
  addAptField({
    id: "rel_apt_doctor",
    name: "doctor",
    type: "relation",
    required: true,
    collectionId: "pbc_656799828",
    cascadeDelete: false,
    maxSelect: 1
  });
  addAptField({ id: "dt_apt_time", name: "date_time", type: "date", required: true });
  addAptField({ id: "text_apt_status", name: "status", type: "text", required: true, max: 30 });
  addAptField({ id: "text_apt_type", name: "type", type: "text", required: true, max: 30 });
  appointments.listRule = "@request.auth.id != ''";
  appointments.viewRule = "@request.auth.id != ''";
  appointments.createRule = "@request.auth.id != ''";
  appointments.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'doctor'";
  appointments.deleteRule = "@request.auth.role = 'admin'";
  app.save(appointments);

  // ---------- psych_tests ----------
  const psychTests = app.findCollectionByNameOrId("psych_tests");
  const addTestField = (def) => {
    if (!psychTests.fields.getByName(def.name)) psychTests.fields.add(new Field(def));
  };
  addTestField({ id: "text_test_title", name: "title", type: "text", required: true, max: 200 });
  addTestField({ id: "text_test_slug", name: "slug", type: "text", required: true, max: 80 });
  addTestField({ id: "text_test_desc", name: "description", type: "text", required: false, max: 1000 });
  addTestField({ id: "text_test_cat", name: "category", type: "text", required: false, max: 40 });
  addTestField({ id: "bool_test_active", name: "is_active", type: "bool", required: false });
  psychTests.listRule = "";
  psychTests.viewRule = "";
  psychTests.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'writer'";
  psychTests.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'writer'";
  psychTests.deleteRule = "@request.auth.role = 'admin'";
  app.save(psychTests);

  // ---------- psych_questions ----------
  const psychQuestions = app.findCollectionByNameOrId("psych_questions");
  const addQField = (def) => {
    if (!psychQuestions.fields.getByName(def.name)) psychQuestions.fields.add(new Field(def));
  };
  addQField({
    id: "rel_q_test",
    name: "test",
    type: "relation",
    required: true,
    collectionId: "pbc_3951927237",
    cascadeDelete: true,
    maxSelect: 1
  });
  addQField({ id: "text_q_text", name: "question_text", type: "text", required: true, max: 500 });
  addQField({ id: "num_q_order", name: "order", type: "number", required: false, min: 0 });
  addQField({ id: "json_q_opts", name: "options_json", type: "json", required: true });
  psychQuestions.listRule = "";
  psychQuestions.viewRule = "";
  psychQuestions.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'writer'";
  psychQuestions.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'secretary' || @request.auth.role = 'writer'";
  psychQuestions.deleteRule = "@request.auth.role = 'admin'";
  app.save(psychQuestions);

  // ---------- psych_results ----------
  const psychResults = app.findCollectionByNameOrId("psych_results");
  const addRField = (def) => {
    if (!psychResults.fields.getByName(def.name)) psychResults.fields.add(new Field(def));
  };
  addRField({
    id: "rel_r_user",
    name: "user",
    type: "relation",
    required: true,
    collectionId: "_pb_users_auth_",
    cascadeDelete: true,
    maxSelect: 1
  });
  addRField({
    id: "rel_r_test",
    name: "test",
    type: "relation",
    required: true,
    collectionId: "pbc_3951927237",
    cascadeDelete: false,
    maxSelect: 1
  });
  addRField({ id: "json_r_answers", name: "answers_json", type: "json", required: true });
  addRField({ id: "json_r_scores", name: "scores_json", type: "json", required: true });
  addRField({ id: "text_r_interp", name: "interpretation_text", type: "text", required: false, max: 2000 });
  psychResults.listRule = "user = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'doctor' || @request.auth.role = 'secretary'";
  psychResults.viewRule = "user = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'doctor' || @request.auth.role = 'secretary'";
  psychResults.createRule = "@request.auth.id != ''";
  psychResults.updateRule = "@request.auth.role = 'admin'";
  psychResults.deleteRule = "@request.auth.role = 'admin'";
  app.save(psychResults);

  // ---------- seed helpers ----------
  const DEMO_PASSWORD = "UserPassword123!";
  const weekdays = [
    { day: "شنبه", enabled: true, startTime: "09:00", endTime: "13:00" },
    { day: "یکشنبه", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "دوشنبه", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "سه‌شنبه", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "چهارشنبه", enabled: true, startTime: "09:00", endTime: "17:00" },
    { day: "پنج‌شنبه", enabled: true, startTime: "09:00", endTime: "13:00" },
    { day: "جمعه", enabled: false, startTime: "", endTime: "" }
  ];

  function ensureStaff(mobile, role, name) {
    let existing;
    try {
      existing = app.findFirstRecordByFilter("staff_registry", `mobile = "${mobile}"`);
    } catch {
      existing = null;
    }
    if (existing) {
      existing.set("role", role);
      existing.set("name", name);
      existing.set("active", true);
      app.save(existing);
      return existing;
    }
    const rec = new Record(staff);
    rec.set("mobile", mobile);
    rec.set("role", role);
    rec.set("name", name);
    rec.set("active", true);
    app.save(rec);
    return rec;
  }

  function ensureUser(mobile, role, name) {
    const email = `user_${mobile}@hoomban.com`;
    let user;
    try {
      user = app.findAuthRecordByEmail("users", email);
    } catch {
      user = null;
    }
    if (user) {
      user.set("name", name);
      user.set("role", role);
      user.set("mobile", mobile);
      user.set("emailVisibility", true);
      app.save(user);
      return user;
    }
    user = new Record(users);
    user.set("email", email);
    user.set("emailVisibility", true);
    user.set("password", DEMO_PASSWORD);
    user.set("passwordConfirm", DEMO_PASSWORD);
    user.set("name", name);
    user.set("role", role);
    user.set("mobile", mobile);
    user.set("verified", true);
    app.save(user);
    return user;
  }

  function ensureDoctor(user, bio, fee, duration) {
    let doc;
    try {
      doc = app.findFirstRecordByFilter("doctors", `user = "${user.id}"`);
    } catch {
      doc = null;
    }
    if (doc) {
      doc.set("bio", bio);
      doc.set("visit_fee", fee);
      doc.set("slot_duration", duration);
      doc.set("working_days", weekdays);
      app.save(doc);
      return doc;
    }
    doc = new Record(doctors);
    doc.set("user", user.id);
    doc.set("bio", bio);
    doc.set("visit_fee", fee);
    doc.set("slot_duration", duration);
    doc.set("working_days", weekdays);
    app.save(doc);
    return doc;
  }

  // Seed staff registry + users
  ensureStaff("09120000001", "doctor", "دکتر احمدی");
  ensureStaff("09120000002", "doctor", "دکتر محمدی");
  ensureStaff("09120000003", "secretary", "منشی کلینیک");

  const doc1User = ensureUser("09120000001", "doctor", "دکتر احمدی");
  const doc2User = ensureUser("09120000002", "doctor", "دکتر محمدی");
  ensureUser("09120000003", "secretary", "منشی کلینیک");
  const patientUser = ensureUser("09121111111", "patient", "بیمار آزمایشی");

  const doc1 = ensureDoctor(doc1User, "روانشناس بالینی — اضطراب و افسردگی", 450000, 45);
  ensureDoctor(doc2User, "روانشناس خانواده و زوج‌درمانی", 500000, 50);

  // Sample psych test
  let test;
  try {
    test = app.findFirstRecordByFilter("psych_tests", 'slug = "beck-sample"');
  } catch {
    test = null;
  }
  if (!test) {
    test = new Record(psychTests);
    test.set("title", "تست نمونه خلق‌وخو");
    test.set("slug", "mood-sample");
    test.set("description", "تست کوتاه آزمایشی برای بررسی فلو سایت (۴ سوال)");
    test.set("category", "depression");
    test.set("is_active", true);
    app.save(test);

    const questions = [
      {
        order: 1,
        text: "در هفته گذشته چقدر احساس غمگینی داشته‌اید؟",
        options: [
          { text: "اصلاً", scores: { score: 0 } },
          { text: "کم", scores: { score: 1 } },
          { text: "متوسط", scores: { score: 2 } },
          { text: "زیاد", scores: { score: 3 } }
        ]
      },
      {
        order: 2,
        text: "چقدر در به خواب رفتن مشکل داشته‌اید؟",
        options: [
          { text: "اصلاً", scores: { score: 0 } },
          { text: "کم", scores: { score: 1 } },
          { text: "متوسط", scores: { score: 2 } },
          { text: "زیاد", scores: { score: 3 } }
        ]
      },
      {
        order: 3,
        text: "سطح انرژی روزانه شما چگونه بوده است؟",
        options: [
          { text: "عالی", scores: { score: 0 } },
          { text: "خوب", scores: { score: 1 } },
          { text: "ضعیف", scores: { score: 2 } },
          { text: "خیلی ضعیف", scores: { score: 3 } }
        ]
      },
      {
        order: 4,
        text: "چقدر از فعالیت‌های روزمره لذت برده‌اید؟",
        options: [
          { text: "زیاد", scores: { score: 0 } },
          { text: "متوسط", scores: { score: 1 } },
          { text: "کم", scores: { score: 2 } },
          { text: "اصلاً", scores: { score: 3 } }
        ]
      }
    ];

    for (const q of questions) {
      const rec = new Record(psychQuestions);
      rec.set("test", test.id);
      rec.set("question_text", q.text);
      rec.set("order", q.order);
      rec.set("options_json", q.options);
      app.save(rec);
    }
  }

  // Sample appointment (patient → doctor 1)
  let aptCount = 0;
  try {
    aptCount = app.findRecordsByFilter("appointments", `patient = "${patientUser.id}"`, "-created", 1, 0).length;
  } catch {
    aptCount = 0;
  }
  if (aptCount === 0) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const apt = new Record(appointments);
    apt.set("patient", patientUser.id);
    apt.set("doctor", doc1.id);
    apt.set("date_time", tomorrow.toISOString());
    apt.set("status", "reserved");
    apt.set("type", "in_person");
    app.save(apt);
  }
}, (app) => {
  // non-destructive down: keep schema for safety
});
