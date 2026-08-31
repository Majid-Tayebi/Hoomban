/// <reference path="../pb_data/types.d.ts" />

/** Seed clinic admin user for OTP login (OTP demo: 1234 in app). */
migrate((app) => {
  const staff = app.findCollectionByNameOrId("staff_registry");
  const users = app.findCollectionByNameOrId("_pb_users_auth_");

  const ensureStaff = (mobile, role, name) => {
    try {
      app.findFirstRecordByFilter("staff_registry", `mobile = "${mobile}"`);
    } catch {
      const r = new Record(staff);
      r.set("mobile", mobile);
      r.set("role", role);
      r.set("name", name);
      r.set("active", true);
      app.save(r);
    }
  };

  ensureStaff("09120000004", "admin", "مدیر کلینیک");

  // Allow admin to manage staff_registry (already admin-only from prior migration)
  staff.listRule = "@request.auth.role = 'admin'";
  staff.viewRule = "@request.auth.role = 'admin'";
  app.save(staff);
});
