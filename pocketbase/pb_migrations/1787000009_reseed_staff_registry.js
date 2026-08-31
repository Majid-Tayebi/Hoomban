/// <reference path="../pb_data/types.d.ts" />

/** Re-seed test staff_registry rows when DB was reset without seed data. */
migrate((app) => {
  const staff = app.findCollectionByNameOrId("staff_registry");
  const users = app.findCollectionByNameOrId("_pb_users_auth_");

  function upsertStaff(mobile, role, name) {
    let row;
    try {
      row = app.findFirstRecordByFilter("staff_registry", `mobile = "${mobile}"`);
    } catch {
      row = null;
    }
    if (!row) {
      row = new Record(staff);
    }
    row.set("mobile", mobile);
    row.set("role", role);
    row.set("name", name);
    row.set("active", true);
    app.save(row);
  }

  upsertStaff("09120000001", "doctor", "دکتر احمدی");
  upsertStaff("09120000002", "doctor", "دکتر محمدی");
  upsertStaff("09120000003", "secretary", "منشی کلینیک");
  upsertStaff("09120000004", "admin", "مدیر کلینیک");

  function fixUserRole(mobile, role, fallbackName) {
    const email = `user_${mobile}@hoomban.com`;
    let user;
    try {
      user = app.findFirstRecordByFilter("users", `email = "${email}"`);
    } catch {
      try {
        user = app.findFirstRecordByFilter("users", `mobile = "${mobile}"`);
      } catch {
        return;
      }
    }
    const currentRole = String(user.get("role") || "");
    if (currentRole === "patient" && role !== "patient") {
      user.set("role", role);
      if (!String(user.get("name") || "").trim()) {
        user.set("name", fallbackName);
      }
      app.save(user);
    }
  }

  fixUserRole("09120000003", "secretary", "منشی کلینیک");
  fixUserRole("09120000004", "admin", "مدیر کلینیک");
  fixUserRole("09120000001", "doctor", "دکتر احمدی");
  fixUserRole("09120000002", "doctor", "دکتر محمدی");
});
