import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://127.0.0.1:8090');

/** Prevent concurrent client requests from aborting each other. */
export const PB_NO_AUTO_CANCEL = { $autoCancel: false as const };
