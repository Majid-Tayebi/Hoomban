/// <reference path="../pb_data/types.d.ts" />

/**
 * Secretary must NOT access patient_profiles (medical record shell).
 * Contact info remains visible via appointments expand only.
 */
migrate((app) => {
  const patientProfiles = app.findCollectionByNameOrId("patient_profiles");
  patientProfiles.listRule =
    "@request.auth.role = 'admin' || @request.auth.role = 'doctor'";
  patientProfiles.viewRule =
    "@request.auth.role = 'admin' || @request.auth.role = 'doctor' || user = @request.auth.id";
  patientProfiles.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'doctor'";
  patientProfiles.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'doctor'";
  patientProfiles.deleteRule = "@request.auth.role = 'admin'";
  app.save(patientProfiles);
});
