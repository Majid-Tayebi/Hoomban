/// <reference path="../pb_data/types.d.ts" />

/**
 * UI-wave schema debt:
 * - doctors: license_number, license_expiry, certificates (multi-file)
 * - ensure clinical_notes.doctor relation targets doctors collection
 */
migrate((app) => {
  const doctors = app.findCollectionByNameOrId("doctors");

  const addDocField = (def) => {
    if (!doctors.fields.getByName(def.name)) doctors.fields.add(new Field(def));
  };

  addDocField({
    id: "text_doc_license_no",
    name: "license_number",
    type: "text",
    required: false,
    max: 80
  });
  addDocField({
    id: "date_doc_license_exp",
    name: "license_expiry",
    type: "date",
    required: false
  });
  addDocField({
    id: "file_doc_certificates",
    name: "certificates",
    type: "file",
    required: false,
    maxSelect: 10,
    maxSize: 10485760,
    mimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ]
  });

  app.save(doctors);

  // Re-save clinical_notes rules after ensuring doctor relation exists
  try {
    const clinicalNotes = app.findCollectionByNameOrId("clinical_notes");
    const doctorField = clinicalNotes.fields.getByName("doctor");
    if (doctorField) {
      doctorField.collectionId = "pbc_656799828";
      doctorField.maxSelect = 1;
    }
    const noteAccess =
      "@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && doctor.user = @request.auth.id)";
    clinicalNotes.listRule = noteAccess;
    clinicalNotes.viewRule = noteAccess;
    clinicalNotes.createRule = noteAccess;
    clinicalNotes.updateRule = noteAccess;
    clinicalNotes.deleteRule =
      "@request.auth.role = 'admin' || (@request.auth.role = 'doctor' && doctor.user = @request.auth.id)";
    app.save(clinicalNotes);
  } catch (_) {
    /* collection may not exist in older DBs */
  }
}, (app) => {
  const doctors = app.findCollectionByNameOrId("doctors");
  for (const name of ["license_number", "license_expiry", "certificates"]) {
    const f = doctors.fields.getByName(name);
    if (f) doctors.fields.removeById(f.id);
  }
  app.save(doctors);
});
