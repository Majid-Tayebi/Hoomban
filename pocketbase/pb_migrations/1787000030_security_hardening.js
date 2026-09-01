/// <reference path="../pb_data/types.d.ts" />

/**
 * Security hardening:
 * - login_otps: DB-backed OTP store (server/admin only)
 * - audit_log: clinical_notes + patient_profiles access trail
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

  // ---------- login_otps (admin/server only — rules null) ----------
  let loginOtps;
  try {
    loginOtps = app.findCollectionByNameOrId("login_otps");
  } catch {
    loginOtps = new Collection({
      id: "pbc_login_otps",
      name: "login_otps",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_otp_id")]
    });
    app.save(loginOtps);
    loginOtps = app.findCollectionByNameOrId("login_otps");
  }

  const addOtpField = (def) => {
    if (!loginOtps.fields.getByName(def.name)) loginOtps.fields.add(new Field(def));
  };

  addOtpField({ id: "text_otp_mobile", name: "mobile", type: "text", required: true, max: 15 });
  addOtpField({ id: "text_otp_code", name: "code", type: "text", required: true, max: 12 });
  addOtpField({
    id: "select_otp_mode",
    name: "mode",
    type: "select",
    required: true,
    maxSelect: 1,
    values: ["login", "recovery"]
  });
  addOtpField({ id: "date_otp_expires", name: "expires_at", type: "date", required: true });
  addOtpField({ id: "bool_otp_consumed", name: "consumed", type: "bool", required: false });
  addOtpField({ id: "num_otp_attempts", name: "verify_attempts", type: "number", required: false, min: 0 });
  app.save(loginOtps);

  // ---------- audit_log (admin read, server write) ----------
  let auditLog;
  try {
    auditLog = app.findCollectionByNameOrId("audit_log");
  } catch {
    auditLog = new Collection({
      id: "pbc_audit_log",
      name: "audit_log",
      type: "base",
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [pkField("text_audit_id")]
    });
    app.save(auditLog);
    auditLog = app.findCollectionByNameOrId("audit_log");
  }

  const addAuditField = (def) => {
    if (!auditLog.fields.getByName(def.name)) auditLog.fields.add(new Field(def));
  };

  addAuditField({
    id: "rel_audit_actor",
    name: "actor",
    type: "relation",
    required: false,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });
  addAuditField({ id: "text_audit_role", name: "actor_role", type: "text", required: false, max: 30 });
  addAuditField({ id: "text_audit_action", name: "action", type: "text", required: true, max: 20 });
  addAuditField({ id: "text_audit_resource", name: "resource", type: "text", required: true, max: 60 });
  addAuditField({ id: "text_audit_resource_id", name: "resource_id", type: "text", required: false, max: 30 });
  addAuditField({
    id: "rel_audit_patient",
    name: "patient",
    type: "relation",
    required: false,
    collectionId: "_pb_users_auth_",
    cascadeDelete: false,
    maxSelect: 1
  });
  addAuditField({ id: "text_audit_summary", name: "summary", type: "text", required: false, max: 500 });
  addAuditField({ id: "json_audit_meta", name: "metadata", type: "json", required: false });
  addAuditField({ id: "text_audit_ip", name: "ip", type: "text", required: false, max: 64 });
  app.save(auditLog);
});
