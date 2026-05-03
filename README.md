# CVG UTN Assistant 🎓

Asistente personal automatizado para monitoreo de tu cuenta de estudiante en CVG/Moodle UTN.

**Soporta login FRSN-0365 (Microsoft 365)** ✅

**Características:**
- ✅ Login automático con Microsoft 365 (FRSN-0365)
- ✅ Sesión persistente reutilizable
- ✅ Extrae materias activas, actividades, materiales y calendario
- ✅ Detecta cambios y nuevos items
- ✅ Notificaciones por Telegram
- ✅ Resúmenes inteligentes con OpenAI (opcional)
- ✅ Sincronización programada
- ✅ Almacenamiento local con SQLite + Prisma

---

## Instalación

### 1. Clonar y configurar

```bash
# Clonar repositorio
git clone <repo-url>
cd cvg-utn-assistant

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### 2. Crear bot de Telegram

1. Abre **Telegram** y busca `@BotFather`
2. Envía `/newbot` y sigue las instrucciones
3. Copia el **Bot Token** → `TELEGRAM_BOT_TOKEN` en `.env`
4. Obtén tu **Chat ID**:
   - Envía un mensaje a tu bot en Telegram
   - Abre: `https://api.telegram.org/botTU_TOKEN/getUpdates`
   - Busca `"chat":{"id":123456789}` → ese es tu `TELEGRAM_CHAT_ID`

### 3. OpenAI API (opcional)

Si deseas resúmenes inteligentes:
1. Ve a [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Crea una API key
3. Copia en `OPENAI_API_KEY` en `.env`

### 4. Configurar credenciales CVG

Edita `.env`:
```env
CVG_URL=https://campus.utn.edu.ar
CVG_USERNAME=tu_usuario_moodle
CVG_PASSWORD=tu_contraseña
SCRAPE_INTERVAL_MINUTES=60
```

### 5. Configurar credenciales CVG (FRSN-0365)

El sistema soporta login automático con **Microsoft 365 (FRSN-0365)**:

```env
CVG_URL=https://frsn.cvg.utn.edu.ar/
CVG_USERNAME=tu_email@frsn.utn.edu.ar    # Email Microsoft
CVG_PASSWORD=tu_contraseña              # Contraseña Microsoft
```

**Nota:** El sistema detecta automáticamente si se necesita login FRSN-0365 y maneja:
- Ingreso de correo electrónico
- Ingreso de contraseña Microsoft
- Confirmación de "mantener sesión iniciada"

### 6. Inicializar base de datos

```bash
npm run prisma:migrate
```

---

## Uso

### Sincronizar una vez
```bash
npm run sync
```

### Ejecutar como daemon (cada hora, por defecto)
```bash
npm start
# Ctrl+C para detener
```

### Cambiar intervalo de sincronización
Edita `.env`: `SCRAPE_INTERVAL_MINUTES=30`

### Debug interactivo
```bash
npm run debug:browser
# Abre Playwright headful para inspeccionar el campus
```

---

## Variables de Entorno

| Variable | Obligatorio | Descripción |
|----------|------------|-----------|
| `CVG_URL` | ✅ | URL del campus (ej: `https://campus.utn.edu.ar`) |
| `CVG_USERNAME` | ✅ | Usuario del campus |
| `CVG_PASSWORD` | ✅ | Contraseña |
| `TELEGRAM_BOT_TOKEN` | ✅ | Token del bot de Telegram |
| `TELEGRAM_CHAT_ID` | ✅ | Tu Chat ID de Telegram |
| `OPENAI_API_KEY` | ❌ | API key de OpenAI (para resúmenes inteligentes) |
| `SCRAPE_INTERVAL_MINUTES` | ❌ | Intervalo de sincronización (default: 60) |
| `PLAYWRIGHT_HEADLESS` | ❌ | Ejecutar browser en headless (default: true) |
| `DEBUG_MODE` | ❌ | Mostrar logs de debug (default: false) |

---

## Modelo de Datos

### Course (Materia)
- ID único, nombre, URL
- Detecta nuevas materias y cambios en nombre/URL

### Activity (Actividad/Tarea)
- Título, tipo (tarea, quiz, foro, etc)
- Fecha de vencimiento
- URL de acceso
- Detecta nuevas actividades y cambios de fecha

### Material (Recurso)
- Título, tipo (PDF, URL, archivo, etc)
- Detecta nuevos recursos

### CalendarEvent (Evento)
- Título, fecha
- Detecta nuevos eventos del calendario

---

## Seguridad

⚠️ **IMPORTANTE:**

✅ **Lo que hace bien:**
- Almacena credenciales SOLO en `.env` local (no en git)
- Usa cookies/sesiones de Playwright (no re-autentica cada vez)
- NO envía credenciales ni HTML privado a OpenAI
- NO intenta evadir CAPTCHA ni 2FA
- Respeta rate limits, scraping gentil

⚠️ **Consideraciones:**
- `.env` contiene credenciales: **nunca commitear**
- Asegúrate de que `storage/cvg-session.json` no se publique (incluida en `.gitignore`)
- Si tus credenciales se exponen, cámbialas en el campus inmediatamente
- OpenAI recibe SOLO datos agregados (cambios detectados), no HTML ni credenciales

**No hará:**
- ❌ Fuerza bruta
- ❌ Scraping agresivo
- ❌ Evasión de CAPTCHA/2FA
- ❌ Almacenar credenciales hardcodeadas en código

---

## Ajustar Selectores (si el CVG cambió de layout)

Cuando CVG cambia el HTML, necesitas actualizar los selectores CSS. El proyecto tiene un sistema de debugging:

### 1️⃣ Modo Debug con Snapshots

```bash
DEBUG_MODE=true npm run debug:browser
```

Esto:
- Abre el navegador con el campus
- Intenta autenticar
- **Guarda snapshots HTML en `storage/debug/`:**
  - `dashboard.html` - lista de materias
  - `course-{id}.html` - contenido de una materia
  - `calendar.html` - calendario
- **Guarda screenshots en `storage/debug/`:**
  - `dashboard.png` - visual de dashboard
  - `course-{id}.png` - visual de materia
  - `*.png` - errores durante scraping

### 2️⃣ Inspeccionar Snapshots

```bash
# Abre el HTML en tu editor/navegador
cat storage/debug/dashboard.html

# O copia el HTML a tu navegador y abre DevTools (F12)
```

### 3️⃣ Identificar Selectores Correctos

En DevTools (F12):
```javascript
// Buscar cursos (debería encontrar N elementos)
document.querySelectorAll('a[href*="/course/view.php"]')

// Buscar actividades
document.querySelectorAll('[data-type], .activity')

// Buscar calendario
document.querySelectorAll('[class*="calendar"]')
```

### 4️⃣ Actualizar Selectores

Edita `src/scraper/selectors.ts`:

```typescript
// ANTES (no encuentra nada)
courseLinks: 'a[href*="/course/view.php"]',

// DESPUÉS (si el selector cambió)
courseLinks: 'a.course-link, div[data-course-id]',
```

Selectores que puedes necesitar cambiar:
- `AUTH_SELECTORS` - login Microsoft/Moodle
- `DASHBOARD_SELECTORS` - lista de materias
- `COURSE_SELECTORS` - actividades y materiales dentro de materia
- `CALENDAR_SELECTORS` - eventos de calendario

### 5️⃣ Probar Cambios

```bash
npm run build
DEBUG_MODE=true npm run debug:browser
# Verifica que ahora detecta los elementos
```

### Ejemplo: Curso no se detecta

**Error:** `⚠️ No courses found`

**Diagnóstico:**
```bash
DEBUG_MODE=true npm run debug:browser
# Abre storage/debug/dashboard.html en navegador
# Inspecciona: ¿hay un elemento que represente los cursos?
# ¿Cuál es su selector CSS?
```

**Fix:**
```typescript
// En src/scraper/selectors.ts
export const DASHBOARD_SELECTORS = {
  courseLinks: 'div.courselist > a.course-item', // actualiza aquí
};
```

---

**Pro tip:** Los snapshots se guardan SIN contraseñas ni cookies (seguro compartir para debugging)

### "No courses found on dashboard"
→ Los selectores de cursos necesitan ajuste en `src/scraper/dashboard.scraper.ts`

### "Telegram not configured"
→ Verifica `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en `.env`

### Base de datos vacía
→ Ejecuta: `npm run prisma:migrate`

### Ver logs de sincronización
```bash
DEBUG_MODE=true npm run sync
```

---

## Scripts npm

| Script | Descripción |
|--------|-----------|
| `npm run build` | Compilar TypeScript a JavaScript |
| `npm run sync` | Ejecutar sincronización una vez |
| `npm start` | Ejecutar como daemon con intervalo |
| `npm run debug:browser` | Abrir navegador en modo debug |
| `npm run prisma:migrate` | Crear/actualizar base de datos |
| `npm run prisma:studio` | Abrir UI visual de base de datos |
| `npm run prisma:generate` | Regenerar cliente de Prisma |

---

## Estructura del Proyecto

```
src/
├── config/
│   └── env.ts              # Validación y configuración
├── scraper/
│   ├── browser.ts          # Gestión de navegador
│   ├── auth.ts             # Login y autenticación
│   ├── dashboard.scraper.ts # Extrae materias
│   ├── course.scraper.ts    # Extrae actividades/materiales
│   ├── calendar.scraper.ts  # Extrae calendario
│   └── types.ts            # Tipos de datos
├── services/
│   ├── change-detector.service.ts # Detecta cambios
│   ├── notification.service.ts    # Envía notificaciones
│   ├── openai.service.ts         # Resumen inteligente
│   └── sync.service.ts           # Orquesta sincronización
├── db/
│   └── prisma.ts           # Cliente de BD
├── utils/
│   ├── logger.ts           # Utilidades de logging
│   ├── hash.ts             # Funciones de hash
│   └── dates.ts            # Parsing de fechas
└── index.ts                # Entry point

prisma/
├── schema.prisma           # Esquema de BD
└── dev.db                  # BD SQLite (auto-generada)

storage/
└── cvg-session.json        # Sesión de Playwright (no commitar)
```

---

## Extensiones Futuras

- 📱 App móvil
- 📧 Notificaciones por email
- 🔐 Soporte para 2FA
- 📊 Dashboard web
- 🔔 Alertas personalizadas
- 📅 Integración con Google Calendar

---

## Licencia

MIT

---

## Support

Reporta issues en GitHub o abre una PR. Para cambios de layout del CVG, ajusta los selectores en `src/scraper/`.
