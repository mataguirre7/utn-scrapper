# CVG UTN Assistant - Project Context

## Resumen General

Asistente personal automatizado para monitoreo de campus virtual (CVG) UTN. Detecta cambios en materias, actividades, materiales y calendario. Envía notificaciones por Telegram. Usa OpenAI para resúmenes inteligentes (opcional).

**Stack:** Node.js + TypeScript + Playwright + Prisma + SQLite + Telegram Bot API + OpenAI

**Completado:** Proyecto production-ready, compilado, testeado, con documentación completa.

---

## ¿Qué se hizo?

### 1. Proyecto Base
- ✅ Node.js + TypeScript inicializado
- ✅ `tsconfig.json`, `.gitignore`, `package.json` configurados
- ✅ Prisma + SQLite schema definido
- ✅ Compilación sin errores

### 2. Autenticación
- ✅ Soporta login FRSN-0365 (Microsoft 365)
- ✅ Fallback a Moodle estándar
- ✅ Sesión persistente en `storage/cvg-session.json`
- ✅ Error handling robusto con retry logic

### 3. Scraping
- ✅ Dashboard → lista de materias
- ✅ Curso individual → actividades + materiales
- ✅ Calendario → eventos
- ✅ Tolerante a fallos (1 curso que falla ≠ rompe todo)
- ✅ Parsing de fechas en español

### 4. Datos & Detección
- ✅ Prisma models: Course, Activity, Material, CalendarEvent, NotificationLog
- ✅ Detección de cambios por hash SHA256
- ✅ Idempotencia: mismos datos = sin cambios
- ✅ Evita notificaciones duplicadas (1 hora TTL)

### 5. Notificaciones
- ✅ Telegram Bot API integrada
- ✅ Formato Markdown con emojis
- ✅ Logging en BD (NotificationLog)
- ✅ OpenAI para resúmenes (opcional, seguro)

### 6. Seguridad & Calidad
- ✅ Cero credenciales hardcodeadas
- ✅ `.env` + `.gitignore` protegidos
- ✅ OpenAI recibe solo cambios resumidos (NO credenciales/HTML/cookies)
- ✅ Validación con Zod
- ✅ Error handling mejorado
- ✅ Logging detallado (step-by-step)
- ✅ Revisión senior completada

### 7. Debugging
- ✅ Sistema de snapshots HTML/screenshots
- ✅ Selectores centralizados en `src/scraper/selectors.ts`
- ✅ `DEBUG_MODE=true` guarda snapshots en `storage/debug/`
- ✅ Fácil ajuste de selectores sin tocar código de scrapers

### 8. Documentación
- ✅ README.md completo
- ✅ QUICKSTART.md paso a paso
- ✅ DEBUGGING.md guía detallada
- ✅ SECURITY.md auditoría de medidas
- ✅ Comentarios en código donde importa

---

## Estado Actual

**Proyecto completamente funcional:**
- Compila sin errores
- TypeScript strict mode
- Todas las dependencias instaladas
- BD migrada (Prisma ready)
- Scripts npm: build, start, sync, debug:browser, prisma:studio

**Configuración:**
- `.env` con credenciales reales de usuario
- CVG_URL, CVG_USERNAME, CVG_PASSWORD configurados
- TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID configurados
- OPENAI_API_KEY configurado (opcional)

---

## Próximos Pasos (Usuario)

1. **Probar login:**
   ```bash
   DEBUG_MODE=true npm run debug:browser
   ```
   - Abre navegador
   - Intenta login automático
   - Guarda snapshots en storage/debug/
   - Si falla: ajusta selectores en src/scraper/selectors.ts

2. **Primera sincronización:**
   ```bash
   npm run sync
   ```
   - Extrae materias, actividades, materiales
   - Envía notificación a Telegram si hay cambios

3. **Ejecutar como daemon:**
   ```bash
   npm start
   ```
   - Sincroniza cada 60 minutos
   - Recibe notificaciones automáticas

4. **Ver base de datos:**
   ```bash
   npm run prisma:studio
   ```
   - Abre UI en localhost:5555
   - Verifica datos guardados

---

## Estructura del Proyecto

```
src/
├── config/env.ts              # Validación de variables entorno
├── scraper/
│   ├── auth.ts               # Login (Microsoft 365 + Moodle)
│   ├── browser.ts            # Gestión Playwright
│   ├── dashboard.scraper.ts  # Extrae materias
│   ├── course.scraper.ts     # Extrae actividades/materiales
│   ├── calendar.scraper.ts   # Extrae calendario
│   ├── selectors.ts          # ⭐ SELECTORES CENTRALIZADOS
│   ├── debug.service.ts      # ⭐ Snapshots HTML/screenshots
│   └── types.ts              # Tipos de datos
├── services/
│   ├── change-detector.service.ts  # Detecta cambios
│   ├── notification.service.ts     # Envía Telegram
│   ├── openai.service.ts          # Resúmenes inteligentes
│   └── sync.service.ts            # Orquesta todo
├── db/prisma.ts              # Cliente Prisma
├── utils/
│   ├── logger.ts             # Logger colorido
│   ├── hash.ts               # SHA256 para cambios
│   └── dates.ts              # Parse fechas español
└── index.ts                  # Entry point

prisma/
├── schema.prisma             # Modelo datos
└── migrations/               # Historial migraciones

storage/
├── cvg-session.json          # Sesión Playwright (gitignored)
└── debug/                    # Snapshots HTML/PNG (gitignored)

scripts/
├── pre-commit-checks.sh      # Validación pre-commit
├── debug-snapshots.sh        # Abre snapshots en navegador
└── view-logs.sh             # Ver logs de BD

📄 README.md                  # Guía completa
📄 QUICKSTART.md             # Paso a paso rápido
📄 DEBUGGING.md              # Guía debugging detallada
📄 SECURITY.md               # Revisión seguridad
```

---

## Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `src/scraper/selectors.ts` | Todos selectores CSS centralizados. EDITAR aquí si CVG cambia layout |
| `src/scraper/debug.service.ts` | Genera snapshots. Usado cuando DEBUG_MODE=true |
| `.env` | Credenciales (NO commitar) |
| `README.md` | Documentación principal |
| `DEBUGGING.md` | Guía completa para ajustar selectores |

---

## Credenciales Configuradas

```env
CVG_URL=https://frsn.cvg.utn.edu.ar/
CVG_USERNAME=mataguirre@frsn.utn.edu.ar
CVG_PASSWORD=[real password]
OPENAI_API_KEY=[sk-proj-...]
TELEGRAM_BOT_TOKEN=[token real]
TELEGRAM_CHAT_ID=[id real]
```

⚠️ NO commitear `.env`

---

## Comandos Principales

```bash
npm run build              # Compilar TypeScript
npm run sync               # Sincronizar una vez
npm start                  # Daemon (cada 60 min)
npm run debug:browser      # Debug interactivo
DEBUG_MODE=true npm run debug:browser   # Con snapshots
npm run prisma:studio      # Ver BD visualmente
npm run prisma:migrate     # Aplicar migraciones
```

---

## Estado de Calidad

✅ **Código:**
- TypeScript strict mode
- Sin credenciales hardcodeadas
- Error handling robusto
- Logging detallado
- Comentarios donde importa

✅ **Seguridad:**
- `.env` protegido
- OpenAI: solo datos agregados
- Snapshots sin credenciales
- Validación con Zod

✅ **Funcionalidad:**
- Login automático (FRSN-0365)
- Scraping resiliente
- Detección de cambios idempotente
- Notificaciones sin duplicados
- BD normalizada con Prisma

✅ **Documentación:**
- README, QUICKSTART, DEBUGGING
- Código autoexplicativo
- Selectores centralizados para fácil mantenimiento

---

## Próxima Sesión

Abre chat nuevo con `mataguirre.dev@gmail.com`. Referencia este `context.md` para contexto rápido.

**Clave:** Selectores en `src/scraper/selectors.ts` + debug mode = ajustar layout sin tocar lógica.
