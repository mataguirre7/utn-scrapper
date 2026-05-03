# ⚡ Quick Start

## 1️⃣ Configurar Telegram

1. Abre Telegram → busca `@BotFather`
2. Envía `/newbot` → sigue pasos → copia el **Bot Token**
3. En tu navegador: `https://api.telegram.org/botTU_TOKEN/getUpdates`
   - Envía primero un mensaje a tu bot
   - Busca `"chat":{"id":123456789}`
   - Eso es tu **Chat ID**

## 2️⃣ Editar `.env`

```bash
# Abre .env y reemplaza con tus datos CVG:
CVG_URL=https://frsn.cvg.utn.edu.ar/                  # URL del campus
CVG_USERNAME=tu_email@frsn.utn.edu.ar                 # Email Microsoft (FRSN-0365)
CVG_PASSWORD=tu_contraseña                             # Contraseña Microsoft
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...                  # Del paso 1
TELEGRAM_CHAT_ID=123456789                             # Del paso 1

# Opcional:
# OPENAI_API_KEY=sk-...                               # Resúmenes inteligentes
# SCRAPE_INTERVAL_MINUTES=60                          # Intervalo de sincronización
```

**Nota:** El sistema maneja automáticamente login FRSN-0365 (Microsoft 365)

## 3️⃣ Probar sincronización

```bash
# Una sola vez
npm run sync

# Como daemon (cada hora)
npm start

# Debug interactivo
npm run debug:browser
```

## 📊 Ver base de datos

```bash
npm run prisma:studio
```

---

## ⚠️ Importante

✅ **Seguridad:**
- `.env` tiene credenciales → **nunca commitear**
- `storage/cvg-session.json` → incluida en `.gitignore`
- Si credenciales se exponen → cámbialas en el campus

❌ **No hará:**
- Evasión de CAPTCHA/2FA
- Scraping agresivo
- Almacenar credenciales en código

---

## 🆘 Troubleshooting

**"No courses found" / "0 activities"**
→ Selectores del CVG cambiaron

```bash
# 1. Activar modo debug con snapshots
DEBUG_MODE=true npm run debug:browser

# 2. Inspecciona los snapshots guardados
storage/debug/dashboard.html         # Abre en navegador
storage/debug/course-{id}.html       # Para actividades

# 3. Identifica los selectores correctos (F12 DevTools)
# 4. Actualiza src/scraper/selectors.ts

# 5. Prueba cambios
npm run build
DEBUG_MODE=true npm run debug:browser
```

Ver **[DEBUGGING.md](DEBUGGING.md)** para guía detallada.

**"Login failed" / "Email input not found"**
→ Mismo proceso: debug mode → inspecciona → actualiza selectores en `AUTH_SELECTORS`

**"Telegram not configured"**
→ Verifica `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en `.env`

---

**¡Listo!** El proyecto está compilado y listo. Configura `.env` y ejecuta `npm run sync`.
