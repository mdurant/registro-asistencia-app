import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

import { getApiBaseUrl, SYNC_RETRY_MAX } from '@/constants/config';
import { isDatabaseAvailable } from '@/database/client';
import { attendanceRepo, emailQueueRepo, syncQueueRepo } from '@/database/repositories';
import { generateId } from '@/utils/crypto';

export interface SyncRunResult {
  synced: number;
  failed: number;
  lastError: string | null;
}

function formatSyncError(error: unknown, apiUrl: string): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (
    raw.includes('Unable to resolve host') ||
    raw.includes('UnknownHostException') ||
    raw.includes('Network request failed')
  ) {
    return `No se alcanza el servidor en ${apiUrl}. Ejecuta "npm run api" en tu PC y verifica la misma red Wi‑Fi.`;
  }
  return raw;
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected === true && state.isInternetReachable !== false;
}

export async function processSyncQueue(): Promise<SyncRunResult> {
  if (!isDatabaseAvailable()) return { synced: 0, failed: 0, lastError: null };

  const online = await isOnline();
  if (!online) return { synced: 0, failed: 0, lastError: 'Sin conexión a internet' };

  const apiUrl = getApiBaseUrl();
  const pending = await syncQueueRepo.getPending();
  let synced = 0;
  let failed = 0;
  let lastError: string | null = null;

  for (const item of pending) {
    if (item.attempts >= SYNC_RETRY_MAX) {
      failed++;
      continue;
    }

    try {
      const response = await fetch(`${apiUrl}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: item.entityType,
          entityId: item.entityId,
          payload: item.payload,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = (await response.json()) as { serverId: string; ip?: string };

      if (item.entityType === 'attendance') {
        await attendanceRepo.markSynced(item.entityId, 'attendance', result.serverId, result.ip);
      } else if (item.entityType === 'login') {
        await attendanceRepo.markSynced(item.entityId, 'login', result.serverId, result.ip);
      }

      await syncQueueRepo.remove(item.id);
      synced++;
    } catch (error) {
      const message = formatSyncError(error, apiUrl);
      lastError = message;
      await syncQueueRepo.incrementAttempts(item.id, message);
      failed++;
    }
  }

  return { synced, failed, lastError };
}

export async function processEmailQueue(): Promise<number> {
  if (!isDatabaseAvailable()) return 0;

  const online = await isOnline();
  if (!online) return 0;

  const apiUrl = getApiBaseUrl();
  const pending = await emailQueueRepo.getPending();
  let sent = 0;

  for (const email of pending) {
    try {
      const response = await fetch(`${apiUrl}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email.toEmail,
          subject: email.subject,
          html: email.bodyHtml,
          templateType: email.templateType,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await emailQueueRepo.markSent(email.id);
      sent++;
    } catch {
      // Reintento en el próximo ciclo
    }
  }

  return sent;
}

export async function runFullSync(): Promise<SyncRunResult> {
  if (Platform.OS === 'web') {
    return { synced: 0, failed: 0, lastError: null };
  }

  const queueResult = await processSyncQueue();
  await processEmailQueue();
  return queueResult;
}

export async function mockSyncEndpoint(
  entityType: string,
  entityId: string,
  payload: Record<string, unknown>,
): Promise<{ serverId: string; ip?: string }> {
  return {
    serverId: generateId(),
    ip: (payload.ipAddress as string) ?? '127.0.0.1',
  };
}
