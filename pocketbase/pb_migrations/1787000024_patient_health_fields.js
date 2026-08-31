/// <reference path="../pb_data/types.d.ts" />

/** Clinical vitals, allergies, medications on patient_profiles (doctor/admin only). */
migrate((app) => {
  const patientProfiles = app.findCollectionByNameOrId("patient_profiles");

  const add = (def) => {
    if (!patientProfiles.fields.getByName(def.name)) {
      patientProfiles.fields.add(new Field(def));
    }
  };

  add({ id: "json_pp_vitals", name: "vitals", type: "json", required: false });
  add({ id: "json_pp_conditions", name: "conditions", type: "json", required: false });
  add({ id: "json_pp_allergies", name: "allergies", type: "json", required: false });
  add({ id: "json_pp_medications", name: "medications", type: "json", required: false });
  add({ id: "json_pp_vitals_chart", name: "vitals_chart", type: "json", required: false });

  app.save(patientProfiles);
});
