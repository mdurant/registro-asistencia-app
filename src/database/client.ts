// Metro resuelve client.native.ts / client.web.ts en runtime.
// Este archivo existe para que TypeScript resuelva los tipos.
export { getDatabase, initDatabase, isDatabaseAvailable } from './client.native';
