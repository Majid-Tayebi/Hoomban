/// <reference path="../pb_data/types.d.ts" />

/**
 * Block public user self-registration via PocketBase API.
 * User creation remains server-only through admin PB (ensure-user, OTP, resolve-patient).
 */
migrate((app) => {
  const users = app.findCollectionByNameOrId("_pb_users_auth_");
  users.createRule = null;
  app.save(users);
});
