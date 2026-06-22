import type { Supermarket, TraceabilityPayload, User } from '@/types';
import { formatRut } from '@/utils/rut';
import { generateId } from '@/utils/crypto';
import { emailQueueRepo } from '@/database/repositories';

const BRAND = {
  primary: '#14B8A6',
  primaryDark: '#0D9488',
  background: '#F5F7FA',
  text: '#1A1A2E',
  textSecondary: '#60646C',
  textMuted: '#909399',
  border: '#E8ECF0',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
  error: '#EF4444',
  errorBg: '#FEE2E2',
} as const;

type EmailEventType = 'INGRESO' | 'SALIDA' | 'ATRASO' | 'LOGIN' | 'ALERTA' | 'REPORTE';

const EVENT_STYLES: Record<
  EmailEventType,
  { label: string; bg: string; color: string; icon: string }
> = {
  INGRESO: { label: 'Ingreso registrado', bg: BRAND.successBg, color: BRAND.success, icon: '✓' },
  SALIDA: { label: 'Salida registrada', bg: BRAND.infoBg, color: BRAND.info, icon: '↩' },
  ATRASO: { label: 'Atraso detectado', bg: BRAND.warningBg, color: BRAND.warning, icon: '⏰' },
  LOGIN: { label: 'Inicio de sesión', bg: BRAND.infoBg, color: BRAND.info, icon: '🔐' },
  ALERTA: { label: 'Alerta de seguridad', bg: BRAND.errorBg, color: BRAND.error, icon: '⚠' },
  REPORTE: { label: 'Reporte diario', bg: BRAND.background, color: BRAND.primaryDark, icon: '📊' },
};

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.textSecondary};font-size:14px;width:42%">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:600;text-align:right">${value}</td>
  </tr>`;
}

function detailsTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">${rows}</table>`;
}

function emailWrapper(eventType: EmailEventType, title: string, body: string): string {
  const ev = EVENT_STYLES[eventType];
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body style="margin:0;padding:24px;background:${BRAND.background};font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06)">
        <tr>
          <td style="background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});padding:24px 28px">
            <div style="color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px">Mi Asistencia</div>
            <div style="color:rgba(255,255,255,.85);font-size:13px;margin-top:4px">Registro de asistencia en ruta</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px">
            <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:${ev.bg};color:${ev.color};font-size:12px;font-weight:700;margin-bottom:14px">
              ${ev.icon} ${ev.label}
            </span>
            <h1 style="margin:0 0 8px;font-size:20px;color:${BRAND.text};font-weight:700;line-height:1.3">${title}</h1>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid ${BRAND.border};text-align:center;color:${BRAND.textMuted};font-size:12px;line-height:1.5">
            Correo automático de Mi Asistencia · No responder a este mensaje
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function formatDateTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

async function enqueueEmail(
  toEmail: string,
  subject: string,
  html: string,
  templateType: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await emailQueueRepo.enqueue(generateId(), toEmail, subject, html, templateType, metadata);
}

export async function queueLoginEmail(
  user: User,
  trace: TraceabilityPayload,
): Promise<void> {
  const formatted = formatDateTime(trace.recordedAtLocal, trace.timezone);

  const html = emailWrapper(
    'LOGIN',
    'Inicio de sesión confirmado',
    detailsTable(`
      ${detailRow('Colaborador', user.name)}
      ${detailRow('RUT', formatRut(user.rut))}
      ${detailRow('Fecha y hora', formatted)}
      ${detailRow('Dispositivo', `${trace.deviceBrand} ${trace.deviceModel}`)}
      ${detailRow('Sistema', trace.deviceOs)}
      ${trace.ipAddress ? detailRow('IP', trace.ipAddress) : ''}
      ${trace.latitude ? detailRow('Ubicación', `${trace.latitude.toFixed(5)}, ${trace.longitude?.toFixed(5)}`) : ''}
    `),
  );

  await enqueueEmail(
    user.email,
    `Inicio de sesión — ${formatted}`,
    html,
    'login',
    { userRut: user.rut },
  );
}

export async function queueIngresoEmail(
  user: User,
  supermarket: Supermarket,
  trace: TraceabilityPayload,
): Promise<void> {
  const formatted = formatDateTime(trace.recordedAtLocal, trace.timezone);

  const html = emailWrapper(
    'INGRESO',
    `Ingreso en ${supermarket.name}`,
    detailsTable(`
      ${detailRow('Colaborador', user.name)}
      ${detailRow('RUT', formatRut(user.rut))}
      ${detailRow('Supermercado', supermarket.name)}
      ${detailRow('Comuna', supermarket.commune)}
      ${detailRow('Dirección', supermarket.address)}
      ${detailRow('Hora de ingreso', formatted)}
      ${detailRow('Dispositivo', `${trace.deviceBrand} ${trace.deviceModel}`)}
      ${detailRow('GPS', `${trace.latitude?.toFixed(5)}, ${trace.longitude?.toFixed(5)}`)}
    `),
  );

  await enqueueEmail(
    user.email,
    `Ingreso — ${supermarket.name} — ${formatted}`,
    html,
    'ingreso',
    { supermarketId: supermarket.id, userRut: user.rut },
  );
}

export async function queueSalidaEmail(
  user: User,
  supermarket: Supermarket,
  ingresoAt: string,
  salidaTrace: TraceabilityPayload,
): Promise<void> {
  const salidaDate = new Date(salidaTrace.recordedAtLocal);
  const ingresoDate = new Date(ingresoAt);
  const durationMin = Math.floor((salidaDate.getTime() - ingresoDate.getTime()) / 60_000);
  const formattedSalida = formatDateTime(salidaTrace.recordedAtLocal, salidaTrace.timezone);
  const formattedIngreso = formatDateTime(ingresoAt, salidaTrace.timezone);

  const html = emailWrapper(
    'SALIDA',
    `Salida de ${supermarket.name}`,
    detailsTable(`
      ${detailRow('Colaborador', user.name)}
      ${detailRow('RUT', formatRut(user.rut))}
      ${detailRow('Supermercado', supermarket.name)}
      ${detailRow('Comuna', supermarket.commune)}
      ${detailRow('Dirección', supermarket.address)}
      ${detailRow('Ingreso', formattedIngreso)}
      ${detailRow('Salida', formattedSalida)}
      ${detailRow('Duración en local', `${durationMin} min`)}
      ${detailRow('Dispositivo', `${salidaTrace.deviceBrand} ${salidaTrace.deviceModel}`)}
      ${detailRow('GPS', `${salidaTrace.latitude?.toFixed(5)}, ${salidaTrace.longitude?.toFixed(5)}`)}
    `),
  );

  await enqueueEmail(
    user.email,
    `Salida — ${supermarket.name} — ${formattedSalida}`,
    html,
    'salida',
    { supermarketId: supermarket.id },
  );
}

export async function queueAtrasoEmail(
  user: User,
  supermarket: Supermarket,
  trace: TraceabilityPayload,
  minutesLate: number,
  expectedStart: string,
  supervisorEmail: string,
): Promise<void> {
  const formatted = formatDateTime(trace.recordedAtLocal, trace.timezone);

  const body = detailsTable(`
    ${detailRow('Colaborador', user.name)}
    ${detailRow('RUT', formatRut(user.rut))}
    ${detailRow('Supermercado', supermarket.name)}
    ${detailRow('Hora esperada', expectedStart)}
    ${detailRow('Hora de ingreso', formatted)}
    ${detailRow('Atraso', `${minutesLate} min`)}
    ${detailRow('Comuna', supermarket.commune)}
  `);

  const html = emailWrapper('ATRASO', `Atraso en ingreso — ${supermarket.name}`, body);

  await enqueueEmail(
    user.email,
    `Atraso — ${minutesLate} min — ${supermarket.name}`,
    html,
    'atraso',
    { userRut: user.rut, minutesLate },
  );

  await enqueueEmail(
    supervisorEmail,
    `[Supervisión] Atraso ${user.name} — ${minutesLate} min`,
    html,
    'atraso_supervisor',
    { userRut: user.rut, minutesLate },
  );
}

export async function queueDeviceAlertEmail(user: User): Promise<void> {
  const html = emailWrapper(
    'ALERTA',
    'Dispositivo no vinculado',
    `<p style="color:${BRAND.textSecondary};font-size:14px;line-height:1.6;margin:0 0 16px">
      Se detectó un acceso desde un dispositivo no vinculado. Debes gestionar la vinculación en la app.
    </p>
    ${detailsTable(`
      ${detailRow('Usuario', user.name)}
      ${detailRow('RUT', formatRut(user.rut))}
      ${detailRow('Acción', 'Gestionar en la app')}
    `)}`,
  );

  await enqueueEmail(
    user.email,
    'Alerta — Dispositivo no vinculado',
    html,
    'device_alert',
    { userRut: user.rut },
  );
}

export async function queueDailyReportEmail(
  toEmail: string,
  date: string,
  reportHtml: string,
): Promise<void> {
  await enqueueEmail(
    toEmail,
    `Reporte diario de asistencia — ${date}`,
    emailWrapper('REPORTE', `Reporte del ${date}`, reportHtml),
    'daily_report',
    { date },
  );
}

export function buildDailyReportHtml(
  date: string,
  events: Array<{
    userName: string;
    supermarketName: string;
    eventType: string;
    time: string;
    status: string;
  }>,
): string {
  const rows = events
    .map(
      (e) =>
        `<tr>
          <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.text}">${e.userName}</td>
          <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.text}">${e.supermarketName}</td>
          <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.text}">${e.eventType}</td>
          <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.text}">${e.time}</td>
          <td style="padding:10px 8px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.text}">${e.status}</td>
        </tr>`,
    )
    .join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:8px">
      <thead>
        <tr style="background:${BRAND.background}">
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:${BRAND.textSecondary}">Colaborador</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:${BRAND.textSecondary}">Supermercado</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:${BRAND.textSecondary}">Evento</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:${BRAND.textSecondary}">Hora</th>
          <th style="padding:10px 8px;text-align:left;font-size:12px;color:${BRAND.textSecondary}">Estado</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" style="padding:20px;text-align:center;color:${BRAND.textMuted}">Sin registros</td></tr>`}</tbody>
    </table>`;
}

export function getIngresoLateness(
  recordedAtLocal: string,
  timezone: string,
  expectedHour: number,
  expectedMinute: number,
): { isLate: boolean; minutesLate: number; expectedLabel: string } {
  const recorded = new Date(recordedAtLocal);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(recorded);

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const recordedMinutes = hour * 60 + minute;
  const expectedMinutes = expectedHour * 60 + expectedMinute;
  const minutesLate = recordedMinutes - expectedMinutes;

  const expectedLabel = `${String(expectedHour).padStart(2, '0')}:${String(expectedMinute).padStart(2, '0')}`;

  return {
    isLate: minutesLate > 0,
    minutesLate: Math.max(0, minutesLate),
    expectedLabel,
  };
}

/** @deprecated Usar queueSalidaEmail */
export const queueLogoutEmail = queueSalidaEmail;
