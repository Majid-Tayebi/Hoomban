/// <reference path="../pb_data/types.d.ts" />

const AUDITED = new Set(["clinical_notes", "patient_profiles"]);

function actorFromRequest(e) {
  const auth = e.requestInfo?.auth;
  if (!auth?.id) return { actorId: "", actorRole: "" };
  return {
    actorId: auth.id,
    actorRole: String(auth.get("role") || "")
  };
}

function patientIdFromRecord(collectionName, record) {
  if (collectionName === "clinical_notes") {
    return String(record.get("patient") || "");
  }
  if (collectionName === "patient_profiles") {
    return String(record.get("user") || "");
  }
  return "";
}

function writeAudit(e, action, record, summary) {
  const collectionName = e.record?.collection()?.name || "";
  if (!AUDITED.has(collectionName)) return;

  const { actorId, actorRole } = actorFromRequest(e);
  const patientId = patientIdFromRecord(collectionName, record);
  const audit = $app.findCollectionByNameOrId("audit_log");
  const row = new Record(audit);

  row.set("actor", actorId);
  row.set("actor_role", actorRole);
  row.set("action", action);
  row.set("resource", collectionName);
  row.set("resource_id", record.id);
  row.set("patient", patientId);
  row.set("summary", summary);
  row.set(
    "metadata",
    JSON.stringify({
      doctor: record.get("doctor") || null,
      session_date: record.get("session_date") || null
    })
  );
  row.set("ip", String(e.requestInfo?.clientIp || ""));

  $app.save(row);
}

onRecordAfterCreateSuccess((e) => {
  writeAudit(e, "create", e.record, "ایجاد رکورد");
}, "clinical_notes");

onRecordAfterUpdateSuccess((e) => {
  writeAudit(e, "update", e.record, "ویرایش رکورد");
}, "clinical_notes");

onRecordAfterDeleteSuccess((e) => {
  writeAudit(e, "delete", e.record, "حذف رکورد");
}, "clinical_notes");

onRecordAfterCreateSuccess((e) => {
  writeAudit(e, "create", e.record, "ایجاد پروفایل بیمار");
}, "patient_profiles");

onRecordAfterUpdateSuccess((e) => {
  writeAudit(e, "update", e.record, "ویرایش پروفایل بیمار");
}, "patient_profiles");

onRecordAfterDeleteSuccess((e) => {
  writeAudit(e, "delete", e.record, "حذف پروفایل بیمار");
}, "patient_profiles");
