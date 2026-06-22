import type { SQLiteDatabase } from 'expo-sqlite';

import { cleanRut } from '@/utils/rut';

/** Supermercado demo principal — Calle San Nicolás 1033, San Miguel */
export const DEMO_SUPERMARKET_SAN_MIGUEL = {
  id: 'sm-demo-san-miguel',
  name: 'Supermercado Demo San Miguel',
  commune: 'San Miguel',
  address: 'Calle San Nicolás 1033',
  latitude: -33.4988,
  longitude: -70.6551,
  geofenceRadiusM: 250,
} as const;

const DEMO_USERS = [
  {
    rut: '123456785',
    name: 'María González',
    email: 'maria.gonzalez@empresa.cl',
    passwordLast4: '5678',
    role: 'colaborador',
  },
  {
    rut: '111111111',
    name: 'Carlos Supervisor',
    email: 'carlos.supervisor@empresa.cl',
    passwordLast4: '1111',
    role: 'supervisor',
  },
  {
    rut: '987654325',
    name: 'Ana Administradora',
    email: 'ana.admin@empresa.cl',
    passwordLast4: '5432',
    role: 'admin',
  },
];

const DEMO_SUPERMARKETS = [
  DEMO_SUPERMARKET_SAN_MIGUEL,
  {
    id: 'sm-jumbo-providencia',
    name: 'Jumbo Providencia',
    commune: 'Providencia',
    address: 'Av. Providencia 2350',
    latitude: -33.4263,
    longitude: -70.6107,
    geofenceRadiusM: 200,
  },
  {
    id: 'sm-lider-nunoa',
    name: 'Líder Ñuñoa',
    commune: 'Ñuñoa',
    address: 'Av. Grecia 5655',
    latitude: -33.4569,
    longitude: -70.5975,
    geofenceRadiusM: 200,
  },
];

function insertSeedDataSync(
  run: (sql: string, ...params: (string | number)[]) => void,
): void {
  for (const user of DEMO_USERS) {
    run(
      `INSERT INTO users (rut, name, email, password_last4, role) VALUES (?, ?, ?, ?, ?)`,
      cleanRut(user.rut),
      user.name,
      user.email,
      user.passwordLast4,
      user.role,
    );
    run(`INSERT INTO user_preferences (user_rut) VALUES (?)`, cleanRut(user.rut));
  }

  for (const sm of DEMO_SUPERMARKETS) {
    run(
      `INSERT INTO supermarkets (id, name, commune, address, latitude, longitude, geofence_radius_m)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      sm.id,
      sm.name,
      sm.commune,
      sm.address,
      sm.latitude,
      sm.longitude,
      sm.geofenceRadiusM,
    );
  }

  const mariaRut = cleanRut('123456785');
  for (const sm of DEMO_SUPERMARKETS) {
    run(`INSERT INTO user_supermarkets (user_rut, supermarket_id) VALUES (?, ?)`, mariaRut, sm.id);
  }

  for (const sm of DEMO_SUPERMARKETS) {
    run(
      `INSERT INTO user_supermarkets (user_rut, supermarket_id) VALUES (?, ?)`,
      cleanRut('111111111'),
      sm.id,
    );
    run(
      `INSERT INTO user_supermarkets (user_rut, supermarket_id) VALUES (?, ?)`,
      cleanRut('987654325'),
      sm.id,
    );
  }
}

async function insertSeedDataAsync(
  run: (sql: string, ...params: (string | number)[]) => Promise<unknown>,
): Promise<void> {
  for (const user of DEMO_USERS) {
    await run(
      `INSERT INTO users (rut, name, email, password_last4, role) VALUES (?, ?, ?, ?, ?)`,
      cleanRut(user.rut),
      user.name,
      user.email,
      user.passwordLast4,
      user.role,
    );
    await run(`INSERT INTO user_preferences (user_rut) VALUES (?)`, cleanRut(user.rut));
  }

  for (const sm of DEMO_SUPERMARKETS) {
    await run(
      `INSERT INTO supermarkets (id, name, commune, address, latitude, longitude, geofence_radius_m)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      sm.id,
      sm.name,
      sm.commune,
      sm.address,
      sm.latitude,
      sm.longitude,
      sm.geofenceRadiusM,
    );
  }

  const mariaRut = cleanRut('123456785');
  for (const sm of DEMO_SUPERMARKETS) {
    await run(`INSERT INTO user_supermarkets (user_rut, supermarket_id) VALUES (?, ?)`, mariaRut, sm.id);
  }

  for (const sm of DEMO_SUPERMARKETS) {
    await run(
      `INSERT INTO user_supermarkets (user_rut, supermarket_id) VALUES (?, ?)`,
      cleanRut('111111111'),
      sm.id,
    );
    await run(
      `INSERT INTO user_supermarkets (user_rut, supermarket_id) VALUES (?, ?)`,
      cleanRut('987654325'),
      sm.id,
    );
  }
}

export function seedDatabase(db: SQLiteDatabase): void {
  const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM users');
  if (count && count.c > 0) return;

  insertSeedDataSync((sql, ...params) => {
    db.runSync(sql, ...params);
  });
}

export async function seedDatabaseAsync(db: SQLiteDatabase): Promise<void> {
  const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM users');
  if (count && count.c > 0) return;

  await insertSeedDataAsync((sql, ...params) => db.runAsync(sql, ...params));
}
