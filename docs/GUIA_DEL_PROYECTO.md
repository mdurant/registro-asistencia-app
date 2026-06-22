# Guía del proyecto — Mi Asistencia

Documento orientado a dueños de negocio, supervisores y equipos que implementarán la solución. Explica **de qué se trata**, **cómo se usa** y **hasta dónde llega** el proyecto, sin entrar en detalles de programación.

---

## Datos del proyecto

| | |
|---|---|
| **Nombre** | Mi Asistencia |
| **Propietario** | IntegralTech Consulting Spa |
| **CTO** | Mauricio Durán Torres |
| **Contacto** | [mauriciodurant@gmail.com](mailto:mauriciodurant@gmail.com) |
| **País / contexto** | Chile (RUT, comunas, supermercados en ruta) |
| **Versión actual** | Demo funcional (junio 2026) |

---

## En pocas palabras

Imagina a María, promotora de un supermercado en San Miguel. Llega al local, abre la app en su celular, confirma su **ingreso** con la cámara y la ubicación. Al terminar la jornada en ese punto, registra la **salida**. Todo queda guardado en el teléfono y, cuando hay internet, se envía al sistema de la empresa. María y su supervisor reciben correos con el detalle. Si María llega tarde, el sistema puede avisar con un correo de **atraso**.

Eso es **Mi Asistencia**: control de presencia en terreno, con evidencia y trazabilidad, pensado para quienes no están en una oficina fija.

---

## ¿Qué problema resuelve?

- Saber **quién estuvo** en cada supermercado y **a qué hora** entró y salió.
- Tener **evidencia** (ubicación, dispositivo, foto en el registro) ante auditorías o reclamos.
- Trabajar **sin depender del internet** en el momento del marcaje; la app guarda y sincroniza después.
- **Un solo celular por persona**, para evitar que alguien marque desde otro dispositivo sin autorización.
- Informar por **correo** a colaboradores y supervisores sin que tengan que revisar la app todo el día.

---

## ¿Cómo funciona el flujo? (vista del colaborador)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Login     │ ──► │  Permisos    │ ──► │  Inicio (home)  │
│ RUT + PIN   │     │ cámara, GPS  │     │ mis supermercados│
│ o huella    │     │ biometría    │     └────────┬────────┘
└─────────────┘     └──────────────┘              │
                                                  ▼
                                        ┌─────────────────┐
                                        │ Registrar       │
                                        │ INGRESO o SALIDA│
                                        │ (cámara + GPS)  │
                                        └────────┬────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    ▼                            ▼                            ▼
            ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
            │ Historial    │            │ Sync al      │            │ Correos      │
            │ del día      │            │ servidor     │            │ ingreso,     │
            │              │            │ (cuando hay  │            │ salida,      │
            │              │            │  red)        │            │ atraso       │
            └──────────────┘            └──────────────┘            └──────────────┘
```

### Paso a paso en lenguaje cotidiano

1. **Entrar a la app** — Con RUT chileno y los últimos 4 dígitos del RUT como clave, o con huella/Face ID si ya la configuró (modo demo).
2. **Aceptar permisos** — La app necesita cámara y ubicación para validar que el registro es real.
3. **Ver sus supermercados** — Solo aparecen los puntos que tiene asignados.
4. **Marcar ingreso** — Al llegar, toca el supermercado, confirma con la cámara. La app verifica que está en la comuna o cerca del local.
5. **Marcar salida** — Al irse, mismo proceso para cerrar la visita.
6. **Revisar historial** — Ve sus movimientos del día.
7. **Sincronización** — En segundo plano, cuando hay Wi‑Fi o datos, los registros suben al servidor de prueba.

---

## Roles en la aplicación

| Rol | ¿Quién es? | ¿Qué puede hacer hoy? |
|-----|------------|------------------------|
| **Colaborador** | Persona en terreno que visita supermercados | Login, marcar ingreso/salida, ver historial propio, recibir correos |
| **Supervisor** | Jefe de equipo o zona | Todo lo del colaborador + panel de **Supervisión**: ver resumen del día y generar reporte (demo) |
| **Administrador** | Responsable del sistema o RR.HH. | Igual que supervisor en esta versión demo; en producción tendrá más herramientas de gestión |

### Usuarios demo incluidos en la app

| Nombre | RUT | PIN | Correo demo |
|--------|-----|-----|-------------|
| María González | 12.345.678-5 | 5678 | maria.gonzalez@empresa.cl |
| Carlos Supervisor | 11.111.111-1 | 1111 | carlos.supervisor@empresa.cl |
| Ana Administradora | 98.765.432-5 | 5432 | ana.admin@empresa.cl |

**Supermercado principal de la demo:** Supermercado Demo San Miguel — Calle San Nicolás 1033, comuna San Miguel.

---

## Funcionalidades

### Ya disponibles en la demo

- Login con **RUT + 4 dígitos** y validación del dígito verificador.
- **Huella / Face ID** (opcional): se puede guardar en demo sin volver a pedir el PIN cada vez.
- **Permisos** guiados (cámara, ubicación, biometría opcional).
- **Un dispositivo por usuario**: si entra desde otro celular, debe vincularlo o ver alerta.
- **Ingreso y salida** con foto, GPS, datos del equipo y hora local.
- Validación de ubicación: en el local o dentro de la **comuna** asignada (demo: San Miguel).
- **Base de datos en el celular** para trabajar offline.
- **Cola de sincronización** hacia servidor de prueba en la computadora del desarrollador.
- **Correos automáticos** (diseño alineado a la app, color teal):
  - Inicio de sesión
  - Ingreso a supermercado
  - Salida (con duración de la visita)
  - Atraso (si ingresa después de las 09:00 — configurable)
  - Alerta de dispositivo no vinculado
- Pantallas: **Inicio**, **Historial**, **Supervisión**, **Perfil**.
- Cierre de sesión.

### Alcance final del proyecto (visión completa)

Lo que se busca cuando el producto esté listo para operar en producción:

| Área | Objetivo final |
|------|----------------|
| **Asistencia** | Registro confiable de ingreso/salida en todos los puntos asignados, con geocerca por local |
| **Offline** | Cero pérdida de marcajes sin señal; sincronización automática al volver la red |
| **Seguridad** | Un dispositivo activo por persona, auditoría de cambios, datos sensibles protegidos |
| **Comunicación** | Correos y reporte **PDF diario** para supervisores (asistencias, inasistencias, atrasos) |
| **Administración** | Panel web o app para altas de usuarios, supermercados y asignaciones |
| **Cumplimiento** | Políticas de privacidad, consentimiento de cámara/GPS, alineación a normativa chilena de datos |
| **Despliegue** | App publicada en App Store y Google Play (o distribución empresarial MDM) |
| **Operación** | Servidor en la nube, respaldos, monitoreo de errores |

La demo actual cubre el **núcleo del negocio** (marcaje + trazabilidad + correos de prueba). El backend en la nube, PDFs, panel admin completo y publicación en tiendas son la siguiente etapa.

---

## Tecnologías (resumen para no técnicos)

| Pieza | Qué es en simple |
|-------|------------------|
| **App móvil** | Programa para Android e iPhone, hecho con Expo (herramienta moderna para apps multiplataforma) |
| **Base de datos en el celular** | SQLite: un “archivo inteligente” que guarda usuarios, marcajes y cola de envío sin internet |
| **Servidor de prueba** | Un programa en la computadora del desarrollador que recibe sincronizaciones y envía correos |
| **Correos** | Mailtrap en demo (bandeja de prueba); en producción sería el correo real de la empresa |
| **Diseño** | Colores y componentes tipo TeamHub: verde menta, tarjetas blancas, alertas verdes/amarillas/rojas según el mensaje |

Detalle técnico para el equipo de desarrollo: Expo SDK 56, React Native, TypeScript, expo-sqlite, expo-camera, expo-location, expo-local-authentication, Node.js en el backend de demo.

---

## Demo en video

Si prefieres ver la app antes de instalarla, hay un recorrido grabado con el flujo completo (login, permisos, ingreso, historial y salida).

**[▶ Abrir demo en video — enlace externo (MP4)](https://github.com/mdurant/registro-asistencia-app/raw/main/docs/video-demo.mp4)**

Página del demo con resumen y credenciales: [DEMO.md](./DEMO.md)

---

## Demo en Android

### Requisitos

- Celular Android con **Expo Go** versión compatible con **SDK 56** (recomendado: APK [Expo Go 56.0.0](https://github.com/expo/expo-go-releases/releases/tag/Expo-Go-56.0.0) — la versión de Play Store a veces no coincide).
- PC y teléfono en la **misma red Wi‑Fi**.
- Node.js instalado en la PC.

### Pasos

1. En la PC, clonar o abrir el proyecto e instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar configuración:
   ```bash
   cp .env.example .env
   ```
   Editar `.env` con la IP de tu PC y credenciales SMTP si quieres probar correos (ver Mailtrap).
3. Iniciar la app:
   ```bash
   npm start
   ```
4. Iniciar el servidor de prueba (otra terminal):
   ```bash
   npm run api:3002
   ```
5. En el Android, abrir **Expo Go** y escanear el **código QR** de la terminal.
6. Iniciar sesión como **María González** (tabla de usuarios arriba).
7. Conceder permisos de cámara y ubicación.
8. Tocar **Supermercado Demo San Miguel** → **Registrar Ingreso**.
9. Para probar correos, revisar la bandeja en [mailtrap.io](https://mailtrap.io).

### Si algo falla en Android

| Síntoma | Qué hacer |
|---------|-----------|
| “SDK incompatible” | Usar Expo Go 56.0.0 desde GitHub, no Play Store |
| No sincroniza | Verificar `EXPO_PUBLIC_API_URL` en `.env` con la IP de la PC y el mismo puerto del servidor (ej. `http://192.168.1.x:3002` con `npm run api:3002`) |
| Ubicación rechazada | Activar GPS; en demo debe estar en comuna San Miguel o usar modo supervisión (usuario admin) |

---

## Demo en iPhone

### Requisitos

- iPhone con **Expo Go** para SDK 56 (instalación vía enlace de [expo.dev/go](https://expo.dev/go) o TestFlight según disponibilidad de Expo).
- Misma red Wi‑Fi que la PC.

### Pasos

Los mismos que en Android (comandos `npm install`, `npm start`, `npm run api:3002`, escanear QR). En iPhone el lector QR suele estar en la app Cámara o dentro de Expo Go.

**Nota:** La biometría (Face ID) se prueba mejor en iPhone físico que en simulador.

---

## Puesta en marcha para el equipo técnico (setup)

### 1. Requisitos en la computadora

- Node.js 20 o superior (recomendado)
- npm
- Opcional para compilar app nativa: Android Studio o Xcode

### 2. Instalación

```bash
git clone <url-del-repositorio>
cd mi-asistencia-app
npm install
cp .env.example .env
```

### 3. Variables de entorno (`.env`)

| Variable | Uso |
|----------|-----|
| `EXPO_PUBLIC_API_URL` | Dirección del servidor en la PC, vista desde el celular (ej. `http://192.168.1.166:3001`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Envío de correos de prueba (Mailtrap) |
| `SMTP_FROM` | Nombre que aparece como remitente |

### 4. Ejecutar en desarrollo

| Terminal 1 | `npm start` |
| Terminal 2 | `npm run api:3002` (o `npm run api` si usas puerto 3001 en `.env`) |

### 5. Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | App en Expo Go |
| `npm run api` | Servidor sync + correos (puerto 3001 por defecto) |
| `npm run api:3002` | Mismo servidor en puerto 3002 (recomendado; coincide con `.env.example`) |
| `npm run web` | Vista web (limitada, sin todas las funciones del móvil) |

---

## Escenario de demo sugerido (presentación a cliente)

Duración aproximada: **10 minutos**.

1. **Contexto (1 min)** — “María visita supermercados en ruta; la app registra su llegada y salida con evidencia.”
2. **Login (1 min)** — RUT 12.345.678-5, PIN 5678. Opcional: mostrar huella si ya está configurada.
3. **Permisos (30 s)** — Explicar por qué pide cámara y GPS.
4. **Ingreso (2 min)** — Elegir San Miguel, mostrar validación de ubicación, confirmar con cámara.
5. **Historial (1 min)** — Mostrar el registro del día.
6. **Salida (2 min)** — Cerrar la visita en el mismo supermercado.
7. **Correos (2 min)** — Abrir Mailtrap y mostrar correos de ingreso y salida con el diseño corporativo.
8. **Supervisor (1 min)** — Entrar como Carlos (11.111.111-1 / 1111) y mostrar panel de supervisión.

---

## Seguridad y privacidad (mensaje para el negocio)

- Los datos de marcaje incluyen **ubicación y foto**: deben usarse solo para fines laborales acordados con los trabajadores.
- En producción se requiere **política de privacidad** y cumplimiento de la ley chilena de protección de datos personales.
- La demo usa servidores y correos de **prueba**; no debe usarse con datos reales de clientes finales sin el entorno productivo adecuado.

---

## Roadmap resumido

| Etapa | Estado |
|-------|--------|
| Diseño y login | ✅ Demo |
| Permisos y dispositivo vinculado | ✅ Demo |
| Ingreso / salida con GPS y cámara | ✅ Demo |
| Offline y sincronización | ✅ Demo |
| Correos (ingreso, salida, atraso) | ✅ Demo |
| Panel supervisión básico | ✅ Demo |
| Backend en la nube | 🔜 Pendiente |
| Reporte PDF diario | 🔜 Pendiente |
| Publicación App Store / Play Store | 🔜 Pendiente |
| Cifrado y auditoría avanzada | 🔜 Pendiente |

El detalle de tareas técnicas está en `todoList.md` del repositorio.

---

## Contacto y soporte del proyecto

**IntegralTech Consulting Spa**  
**Mauricio Durán Torres** — CTO  
Correo: [mauriciodurant@gmail.com](mailto:mauriciodurant@gmail.com)

Para consultas de alcance comercial, ampliación de funcionalidades o paso a producción, contactar directamente al CTO.

---

*Documento generado para IntegralTech Consulting Spa — Mi Asistencia — junio 2026*
