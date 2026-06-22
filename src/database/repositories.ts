import type {
  AttendanceEvent,
  EventType,
  LinkedDevice,
  LoginEvent,
  OpenVisit,
  Supermarket,
  SyncStatus,
  User,
  UserPreferences,
  UserRole,
} from '@/types';
import { generateId } from '@/utils/crypto';
import { parseJsonColumn, stringifyJson } from '@/utils/json';
import { cleanRut } from '@/utils/rut';

import { getDatabase } from './client';
import { execute, queryAll, queryFirst } from './query';

function mapUser(row: Record<string, unknown>): User {
  return {
    rut: row.rut as string,
    name: row.name as string,
    email: row.email as string,
    passwordLast4: row.password_last4 as string,
    role: row.role as UserRole,
  };
}

function mapSupermarket(row: Record<string, unknown>): Supermarket {
  return {
    id: row.id as string,
    name: row.name as string,
    commune: row.commune as string,
    address: row.address as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    geofenceRadiusM: row.geofence_radius_m as number,
  };
}

function mapAttendance(row: Record<string, unknown>): AttendanceEvent {
  return {
    id: row.id as string,
    userRut: row.user_rut as string,
    supermarketId: row.supermarket_id as string,
    eventType: row.event_type as EventType,
    recordedAtLocal: row.recorded_at_local as string,
    timezone: row.timezone as string,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    locationAccuracyM: row.location_accuracy_m as number | undefined,
    ipAddress: row.ip_address as string | undefined,
    deviceBrand: row.device_brand as string,
    deviceModel: row.device_model as string,
    deviceOs: row.device_os as string,
    deviceSerial: row.device_serial as string | undefined,
    photoUri: row.photo_uri as string | undefined,
    syncStatus: row.sync_status as SyncStatus,
    syncedAt: row.synced_at as string | undefined,
    serverId: row.server_id as string | undefined,
    integrityHash: row.integrity_hash as string | undefined,
    createdAt: row.created_at as string,
  };
}

export const userRepo = {
  async findByRut(rut: string): Promise<User | null> {
    const db = getDatabase();
    const row = await queryFirst<Record<string, unknown>>(
      db,
      'SELECT * FROM users WHERE rut = ?',
      cleanRut(rut),
    );
    return row ? mapUser(row) : null;
  },

  async validateCredentials(rut: string, last4: string): Promise<User | null> {
    const user = await this.findByRut(rut);
    if (!user || user.passwordLast4 !== last4) return null;
    return user;
  },
};

export const supermarketRepo = {
  async findByUserRut(rut: string): Promise<Supermarket[]> {
    const db = getDatabase();
    const rows = await queryAll<Record<string, unknown>>(
      db,
      `SELECT s.* FROM supermarkets s
       JOIN user_supermarkets us ON us.supermarket_id = s.id
       WHERE us.user_rut = ?`,
      cleanRut(rut),
    );
    return rows.map(mapSupermarket);
  },

  async findById(id: string): Promise<Supermarket | null> {
    const db = getDatabase();
    const row = await queryFirst<Record<string, unknown>>(
      db,
      'SELECT * FROM supermarkets WHERE id = ?',
      id,
    );
    return row ? mapSupermarket(row) : null;
  },

  async findAll(): Promise<Supermarket[]> {
    const db = getDatabase();
    const rows = await queryAll<Record<string, unknown>>(db, 'SELECT * FROM supermarkets');
    return rows.map(mapSupermarket);
  },
};

export const preferencesRepo = {
  async get(userRut: string): Promise<UserPreferences> {
    const db = getDatabase();
    const row = await queryFirst<Record<string, unknown>>(
      db,
      'SELECT * FROM user_preferences WHERE user_rut = ?',
      cleanRut(userRut),
    );
    if (!row) {
      return {
        userRut: cleanRut(userRut),
        biometricEnabled: false,
        permissionsCompleted: false,
        deviceAlertSent: false,
      };
    }
    return {
      userRut: row.user_rut as string,
      biometricEnabled: row.biometric_enabled === 1,
      permissionsCompleted: row.permissions_completed === 1,
      deviceAlertSent: row.device_alert_sent === 1,
    };
  },

  async setBiometric(userRut: string, enabled: boolean): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      'UPDATE user_preferences SET biometric_enabled = ? WHERE user_rut = ?',
      enabled ? 1 : 0,
      cleanRut(userRut),
    );
  },

  async setPermissionsCompleted(userRut: string, completed: boolean): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      'UPDATE user_preferences SET permissions_completed = ? WHERE user_rut = ?',
      completed ? 1 : 0,
      cleanRut(userRut),
    );
  },

  async setDeviceAlertSent(userRut: string, sent: boolean): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      'UPDATE user_preferences SET device_alert_sent = ? WHERE user_rut = ?',
      sent ? 1 : 0,
      cleanRut(userRut),
    );
  },
};

export const deviceRepo = {
  async getActiveDevice(userRut: string): Promise<LinkedDevice | null> {
    const db = getDatabase();
    const row = await queryFirst<Record<string, unknown>>(
      db,
      'SELECT * FROM linked_devices WHERE user_rut = ? AND is_active = 1 LIMIT 1',
      cleanRut(userRut),
    );
    if (!row) return null;
    return {
      id: row.id as string,
      userRut: row.user_rut as string,
      phoneNumber: row.phone_number as string | undefined,
      serial: row.serial as string | undefined,
      imei: row.imei as string | undefined,
      brand: row.brand as string,
      model: row.model as string,
      osName: row.os_name as string,
      osVersion: row.os_version as string | undefined,
      isActive: row.is_active === 1,
      linkedAt: row.linked_at as string,
    };
  },

  async linkDevice(device: LinkedDevice): Promise<void> {
    const db = getDatabase();
    await execute(db, 'UPDATE linked_devices SET is_active = 0 WHERE user_rut = ?', device.userRut);
    await execute(
      db,
      `INSERT INTO linked_devices
       (id, user_rut, phone_number, serial, imei, brand, model, os_name, os_version, is_active, linked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      device.id,
      device.userRut,
      device.phoneNumber ?? null,
      device.serial ?? null,
      device.imei ?? null,
      device.brand,
      device.model,
      device.osName,
      device.osVersion ?? null,
      device.linkedAt,
    );
  },

  async auditLinkChange(
    userRut: string,
    oldDeviceId: string | null,
    newDeviceId: string,
    action: string,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      `INSERT INTO device_link_audit (id, user_rut, old_device_id, new_device_id, action, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      generateId(),
      cleanRut(userRut),
      oldDeviceId,
      newDeviceId,
      action,
      stringifyJson(metadata),
    );
  },
};

export const loginRepo = {
  async insert(event: LoginEvent): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      `INSERT INTO login_events
       (id, user_rut, session_id, recorded_at_local, timezone, latitude, longitude,
        location_accuracy_m, ip_address, device_brand, device_model, device_os, device_serial,
        sync_status, integrity_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      event.id,
      event.userRut,
      event.sessionId,
      event.recordedAtLocal,
      event.timezone,
      event.latitude ?? null,
      event.longitude ?? null,
      event.locationAccuracyM ?? null,
      event.ipAddress ?? null,
      event.deviceBrand,
      event.deviceModel,
      event.deviceOs,
      event.deviceSerial ?? null,
      event.syncStatus,
      null,
    );
  },
};

export const attendanceRepo = {
  async insert(event: AttendanceEvent): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      `INSERT INTO attendance_events
       (id, user_rut, supermarket_id, event_type, recorded_at_local, timezone,
        latitude, longitude, location_accuracy_m, ip_address, device_brand, device_model,
        device_os, device_serial, photo_uri, sync_status, integrity_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      event.id,
      event.userRut,
      event.supermarketId,
      event.eventType,
      event.recordedAtLocal,
      event.timezone,
      event.latitude,
      event.longitude,
      event.locationAccuracyM ?? null,
      event.ipAddress ?? null,
      event.deviceBrand,
      event.deviceModel,
      event.deviceOs,
      event.deviceSerial ?? null,
      event.photoUri ?? null,
      event.syncStatus,
      event.integrityHash ?? null,
    );
  },

  async getOpenVisit(userRut: string): Promise<OpenVisit | null> {
    const db = getDatabase();
    const row = await queryFirst<Record<string, unknown>>(
      db,
      `SELECT ae.supermarket_id, ae.recorded_at_local, s.name as supermarket_name
       FROM attendance_events ae
       JOIN supermarkets s ON s.id = ae.supermarket_id
       WHERE ae.user_rut = ? AND ae.event_type = 'INGRESO'
       AND NOT EXISTS (
         SELECT 1 FROM attendance_events ae2
         WHERE ae2.user_rut = ae.user_rut
           AND ae2.supermarket_id = ae.supermarket_id
           AND ae2.event_type = 'SALIDA'
           AND ae2.recorded_at_local > ae.recorded_at_local
       )
       ORDER BY ae.recorded_at_local DESC LIMIT 1`,
      cleanRut(userRut),
    );
    if (!row) return null;
    return {
      supermarketId: row.supermarket_id as string,
      supermarketName: row.supermarket_name as string,
      ingresoAt: row.recorded_at_local as string,
    };
  },

  async getTodayEvents(userRut: string): Promise<AttendanceEvent[]> {
    const db = getDatabase();
    const today = new Date().toISOString().slice(0, 10);
    const rows = await queryAll<Record<string, unknown>>(
      db,
      `SELECT id, user_rut, supermarket_id, event_type, recorded_at_local, timezone,
              latitude, longitude, location_accuracy_m, ip_address, device_brand,
              device_model, device_os, device_serial, photo_uri, sync_status,
              synced_at, server_id, integrity_hash, created_at
       FROM attendance_events
       WHERE user_rut = ? AND recorded_at_local LIKE ?
       ORDER BY recorded_at_local DESC`,
      cleanRut(userRut),
      `${today}%`,
    );
    return rows.map(mapAttendance);
  },

  async getPendingCount(): Promise<number> {
    const db = getDatabase();
    const attendance = await queryFirst<{ c: number }>(
      db,
      `SELECT COUNT(*) as c FROM attendance_events WHERE sync_status = 'pending'`,
    );
    const logins = await queryFirst<{ c: number }>(
      db,
      `SELECT COUNT(*) as c FROM login_events WHERE sync_status = 'pending'`,
    );
    return (attendance?.c ?? 0) + (logins?.c ?? 0);
  },

  async getAllForDate(date: string): Promise<AttendanceEvent[]> {
    const db = getDatabase();
    const rows = await queryAll<Record<string, unknown>>(
      db,
      `SELECT ae.id, ae.user_rut, ae.supermarket_id, ae.event_type, ae.recorded_at_local,
              ae.timezone, ae.latitude, ae.longitude, ae.location_accuracy_m, ae.ip_address,
              ae.device_brand, ae.device_model, ae.device_os, ae.device_serial, ae.photo_uri,
              ae.sync_status, ae.synced_at, ae.server_id, ae.integrity_hash, ae.created_at
       FROM attendance_events ae
       WHERE ae.recorded_at_local LIKE ?
       ORDER BY ae.recorded_at_local`,
      `${date}%`,
    );
    return rows.map(mapAttendance);
  },

  async markSynced(
    id: string,
    entityType: 'attendance' | 'login',
    serverId: string,
    ip?: string,
  ): Promise<void> {
    const db = getDatabase();
    const table = entityType === 'attendance' ? 'attendance_events' : 'login_events';
    await execute(
      db,
      `UPDATE ${table} SET sync_status = 'synced', synced_at = datetime('now'), server_id = ?, ip_address = COALESCE(?, ip_address) WHERE id = ?`,
      serverId,
      ip ?? null,
      id,
    );
  },
};

export const syncQueueRepo = {
  async enqueue(
    id: string,
    entityType: string,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      `INSERT OR REPLACE INTO sync_queue (id, entity_type, entity_id, payload_json) VALUES (?, ?, ?, ?)`,
      id,
      entityType,
      entityId,
      stringifyJson(payload),
    );
  },

  async getPending(): Promise<
    Array<{
      id: string;
      entityType: string;
      entityId: string;
      payload: Record<string, unknown>;
      attempts: number;
      lastError?: string;
    }>
  > {
    const db = getDatabase();

    try {
      const rows = await queryAll<Record<string, unknown>>(
        db,
        `SELECT id, entity_type, entity_id, payload_json, attempts, last_error
         FROM sync_queue ORDER BY created_at ASC`,
      );

      const pending: Array<{
        id: string;
        entityType: string;
        entityId: string;
        payload: Record<string, unknown>;
        attempts: number;
        lastError?: string;
      }> = [];

      for (const row of rows) {
        const rowId = row.id as string;
        const payload = parseJsonColumn(row.payload_json);

        if (!payload) {
          await execute(db, 'DELETE FROM sync_queue WHERE id = ?', rowId);
          continue;
        }

        pending.push({
          id: rowId,
          entityType: row.entity_type as string,
          entityId: row.entity_id as string,
          payload,
          attempts: row.attempts as number,
          lastError: (row.last_error as string) || undefined,
        });
      }

      return pending;
    } catch (error) {
      console.warn('[sync_queue] cola corrupta, se limpia:', error);
      try {
        await execute(db, 'DELETE FROM sync_queue');
      } catch {
        // ignorar
      }
      return [];
    }
  },

  async remove(id: string): Promise<void> {
    const db = getDatabase();
    await execute(db, 'DELETE FROM sync_queue WHERE id = ?', id);
  },

  async incrementAttempts(id: string, error: string): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      'UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
      error,
      id,
    );
  },
};

export const emailQueueRepo = {
  async enqueue(
    id: string,
    toEmail: string,
    subject: string,
    bodyHtml: string,
    templateType: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const db = getDatabase();
    await execute(
      db,
      `INSERT INTO email_queue (id, to_email, subject, body_html, template_type, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      toEmail,
      subject,
      bodyHtml,
      templateType,
      metadata ? stringifyJson(metadata) : null,
    );
  },

  async getPending(): Promise<
    Array<{
      id: string;
      toEmail: string;
      subject: string;
      bodyHtml: string;
      templateType: string;
      attempts: number;
    }>
  > {
    const db = getDatabase();

    try {
      const rows = await queryAll<Record<string, unknown>>(
        db,
        `SELECT id, to_email, subject, body_html, template_type, attempts
         FROM email_queue WHERE sent_at IS NULL ORDER BY created_at ASC`,
      );

      return rows.map((row) => ({
        id: row.id as string,
        toEmail: row.to_email as string,
        subject: row.subject as string,
        bodyHtml: row.body_html as string,
        templateType: row.template_type as string,
        attempts: row.attempts as number,
      }));
    } catch (error) {
      console.warn('[email_queue] cola corrupta, se limpia:', error);
      try {
        await execute(db, 'DELETE FROM email_queue');
      } catch {
        // ignorar
      }
      return [];
    }
  },

  async markSent(id: string): Promise<void> {
    const db = getDatabase();
    await execute(db, 'UPDATE email_queue SET sent_at = datetime("now") WHERE id = ?', id);
  },
};
