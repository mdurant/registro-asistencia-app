# Mi Asistencia

Aplicación móvil para que colaboradores en terreno registren su **ingreso y salida** en supermercados asignados, con evidencia de ubicación, trazabilidad y notificaciones por correo.

**Propietario:** IntegralTech Consulting Spa  
**CTO:** Mauricio Durán Torres · [mauriciodurant@gmail.com](mailto:mauriciodurant@gmail.com)

---

## ¿Qué es?

**Mi Asistencia** es una app pensada para equipos que visitan puntos de venta (supermercados) en Chile. Cada persona puede marcar cuándo llega y cuándo se va, desde su celular, incluso si en ese momento no hay internet. La información queda respaldada y, cuando hay conexión, se sincroniza con el servidor de la empresa.

La experiencia visual sigue una línea moderna y clara (verde menta / teal), similar a aplicaciones corporativas tipo TeamHub: tarjetas limpias, estados con color y mensajes fáciles de entender.

---

## Documentación completa

Para dueños de negocio, supervisores y equipo de implementación:

📄 **[Guía del proyecto](docs/GUIA_DEL_PROYECTO.md)** — qué hace la app, flujos, roles, demo en Android e iPhone, alcance actual vs. futuro y puesta en marcha.

---

## Demo rápida (5 minutos)

### Usuarios de prueba

| Perfil | RUT | PIN (4 dígitos) |
|--------|-----|-----------------|
| Colaboradora | 12.345.678-5 | 5678 |
| Supervisor | 11.111.111-1 | 1111 |
| Administradora | 98.765.432-5 | 5432 |

**Supermercado demo:** San Nicolás 1033, San Miguel (comuna San Miguel).

### En el celular (Android o iPhone)

1. Instala **Expo Go** compatible con SDK 56 (ver [guía](docs/GUIA_DEL_PROYECTO.md#demo-en-android)).
2. En la computadora de desarrollo: `npm install` y luego `npm start`.
3. Escanea el código QR con Expo Go (misma red Wi‑Fi que la PC).
4. Inicia sesión con María González y registra un **Ingreso** en el supermercado demo.

### Servidor de prueba (sync y correos)

En otra terminal:

```bash
npm run api:3002
```

(El puerto debe coincidir con `EXPO_PUBLIC_API_URL` en tu `.env`.)

Configura las variables en `.env` (copia desde `.env.example`). Los correos de demo se envían a **Mailtrap** (bandeja de pruebas, no llegan al cliente real).

---

## Comandos útiles

| Comando | Para qué sirve |
|---------|----------------|
| `npm start` | Abre la app en Expo Go |
| `npm run api` | Levanta el servidor local (sync + correos) |
| `npm run web` | Vista previa en navegador (funciones limitadas) |

---

## Estructura del repositorio (resumen)

| Carpeta | Contenido |
|---------|-----------|
| `src/app/` | Pantallas de la app (login, inicio, historial, etc.) |
| `src/database/` | Base de datos local y datos demo |
| `src/services/` | Lógica de asistencia, sync, correos |
| `backend/` | Servidor de prueba (API + envío SMTP) |
| `database/` | Esquema SQL de referencia |
| `docs/` | Documentación para negocio y operación |

---

## Estado del proyecto

Versión demo funcional: login, permisos, registro ingreso/salida con GPS y cámara, historial, panel de supervisión básico, cola de sincronización y correos con plantilla corporativa.

Pendiente para producción: backend definitivo en la nube, PDF de reportes, cifrado avanzado, publicación en App Store / Play Store y cumplimiento legal completo. Detalle en la [guía del proyecto](docs/GUIA_DEL_PROYECTO.md#alcance-final-del-proyecto).

---

## Contacto

**IntegralTech Consulting Spa**  
Mauricio Durán Torres — CTO  
[mauriciodurant@gmail.com](mailto:mauriciodurant@gmail.com)

---

*Última actualización: junio 2026*
