# 🐛 Debugging Guide

Guía completa para debugging y ajuste de selectores cuando CVG cambia.

## Modo Debug

### Activar Debug

```bash
DEBUG_MODE=true npm run debug:browser
```

**Qué pasa:**
1. Abre Playwright en modo visible
2. Intenta login (email + contraseña)
3. Navega al dashboard
4. **Guarda snapshots HTML en `storage/debug/`**
5. **Guarda screenshots en `storage/debug/`**

### Archivos Generados

```
storage/debug/
├── auth-before-email.html         # Antes de escribir email
├── auth-before-submit.html         # Antes de submit
├── auth-error.html / .png         # Si falla auth
├── dashboard.html / .png          # Dashboard (lista de cursos)
├── course-{id}.html / .png        # Contenido de materia
├── calendar.html / .png           # Calendario
└── moodle-login-error.html / .png # Si fallaMoodle login
```

## Inspeccionar Snapshots

### 1. Ver HTML

```bash
# Windows
start storage/debug/dashboard.html

# macOS
open storage/debug/dashboard.html

# Linux
firefox storage/debug/dashboard.html
```

### 2. Abre en tu Editor

```bash
# VS Code
code storage/debug/dashboard.html

# Vim
vim storage/debug/dashboard.html
```

### 3. Buscar selectores

En el HTML abierto, busca (Ctrl+F):
- `course` - elementa relacionados a cursos
- `activity` - elementos de actividades
- `assignment`, `quiz`, `forum`
- `calendar`, `event`, `due`

## Identificar Selectores Nuevos

### Opción 1: DevTools en el navegador

Mientras se ejecuta `npm run debug:browser`:

```javascript
// En la consola (F12)

// Buscar cursos
document.querySelectorAll('a[href*="/course/view.php"]')
// Result: NodeList(5) [a, a, a, a, a] ✓

// Si no encuentra nada, intentar alternativas
document.querySelectorAll('.course')     // prueba 1
document.querySelectorAll('[data-course]')  // prueba 2
document.querySelectorAll('li.course-item') // prueba 3
```

### Opción 2: Inspeccionar elemento

Abre DevTools (F12) → Abre HTML snapshot → Busca elemento de curso:
```html
<!-- Ejemplo de lo que podrías ver -->
<a href="/course/view.php?id=123" class="course-link">Matemática</a>
<!-- Selector: a.course-link -->
<!-- O más específico: a[href*="/course/view.php"] -->
```

## Actualizar Selectores

### Archivo a editar: `src/scraper/selectors.ts`

Estructura:
```typescript
export const AUTH_SELECTORS = {
  microsoftEmailInput: 'input[type="email"]',  // ← Cambiar si no encuentra
  // ...
};

export const DASHBOARD_SELECTORS = {
  courseLinks: 'a[href*="/course/view.php"]',  // ← Cambiar si no encuentra cursos
};

export const COURSE_SELECTORS = {
  activityItem: '[data-type], .activity',      // ← Cambiar si no encuentra actividades
  // ...
};

export const CALENDAR_SELECTORS = {
  calendarSection: '[class*="calendar"]',      // ← Cambiar si no encuentra calendario
  // ...
};
```

### Ejemplo 1: Curso no se encuentra

**Problema:**
```
🔐 Starting login flow...
✅ Already authenticated
📚 Scraping dashboard for courses...
⚠️ No courses found. Check DASHBOARD_SELECTORS.courseLinks
```

**Investigar:**
```bash
DEBUG_MODE=true npm run debug:browser
# Abre storage/debug/dashboard.html
# Busca (Ctrl+F) "course" o "Matemática"
```

**Si encuentras:**
```html
<div class="mycourse">
  <span class="course-name">Matemática I</span>
  <a href="/course/view.php?id=101">Ver</a>
</div>
```

**Actualiza selectores:**
```typescript
// src/scraper/selectors.ts
export const DASHBOARD_SELECTORS = {
  courseLinks: 'div.mycourse a[href*="/course/view.php"]',  // ← Más específico
};
```

**Prueba:**
```bash
npm run build
DEBUG_MODE=true npm run debug:browser
# Debería decir: "Found 5 courses"
```

### Ejemplo 2: Actividades no se encuentran

**Problema:**
```
Processing: Matemática
✗ Course {id}: 0 activities, 0 materials
```

**Investigar:**
```bash
DEBUG_MODE=true npm run debug:browser
# Abre storage/debug/course-{id}.html
# Busca actividades: "Tarea", "Quiz", "Entrega"
```

**Si encuentras estructura nueva:**
```html
<li class="assignment" data-activity-id="456">
  <h4>Tarea 1</h4>
  <span class="due-date">2026-05-10</span>
</li>
```

**Actualiza:**
```typescript
export const COURSE_SELECTORS = {
  activityItem: 'li[class*="assignment"], li[class*="quiz"]',  // ← Más específico
};
```

## Mensajes de Error Comunes

### "Email input not found. Check AUTH_SELECTORS.microsoftEmailInput"

**Causa:** Microsoft cambió el selector del input de email

**Fix:**
1. `DEBUG_MODE=true npm run debug:browser`
2. En la consola (F12): `document.querySelectorAll('input[type="email"]')`
3. Si no encuentra, prueba: `document.querySelectorAll('input')`
4. Actualiza `AUTH_SELECTORS.microsoftEmailInput` en `selectors.ts`

### "No courses found. Check DASHBOARD_SELECTORS.courseLinks"

**Causa:** Selector de cursos no coincide con HTML actual

**Fix:**
1. Abre `storage/debug/dashboard.html` en navegador
2. Busca elementos que representen cursos
3. Inspecciona: click derecho → Inspect Element
4. Copia el selector: `.course`, `a.course-link`, etc.
5. Actualiza `DASHBOARD_SELECTORS.courseLinks`

### "0 activities, 0 materials"

**Causa:** Selectores de actividades/materiales no coinciden

**Fix:**
1. Abre `storage/debug/course-{id}.html`
2. Busca "Tarea", "Quiz", "Foro", etc.
3. Inspecciona (click derecho → Inspect)
4. Anota el selector (class, data-*, tag)
5. Actualiza `COURSE_SELECTORS.activityItem`

## Testing Rápido de Selectores

### Sin hacer login completo

```typescript
// En src/scraper/selectors.ts, temporalmente:

export const DASHBOARD_SELECTORS = {
  // Prueba varios selectores
  courseLinks: 'a[href*="/course/view.php"]',
  // courseLinks: 'div.course',  // alternativa
  // courseLinks: '[data-course-id]',  // alternativa
};
```

Luego:
```bash
npm run build
npm run sync
```

Si dice "Found N courses" → selector OK
Si dice "No courses found" → selector incorrecto, vuelve a probar otro

## Console Debugging en Debug Mode

Mientras `npm run debug:browser` se ejecuta:

```javascript
// En consola de DevTools (F12)

// Contar cursos detectables
document.querySelectorAll('a[href*="/course/view.php"]').length

// Ver primer curso
document.querySelector('a[href*="/course/view.php"]').textContent

// Contar actividades
document.querySelectorAll('[data-type], .activity').length

// Listar todos los data-type disponibles
Array.from(document.querySelectorAll('[data-type]')).map(el => el.getAttribute('data-type'))
// Output: ["assign", "quiz", "forum", "resource", ...]
```

## Git Secrets: No guardes snapshots privados

Los snapshots se guardan SIN:
- ✅ Credenciales
- ✅ Cookies
- ✅ Tokens
- ✅ Datos personales sensibles

Pero contienen:
- ✅ Nombres de materias
- ✅ Nombres de actividades
- ✅ Estructuras HTML públicas

`storage/debug/` está en `.gitignore`, pero verifica antes de compartir:

```bash
grep -r "password\|token\|secret" storage/debug/
# Si no encuentra nada → seguro compartir
```

## Registro de cambios de selectores

Crea un archivo `SELECTORS_CHANGELOG.md`:

```markdown
# Cambios de Selectores

## 2026-05-03
- Cambié DASHBOARD_SELECTORS.courseLinks de `a[href*="/course/view.php"]` a `div.mycourse a`
- Razón: CVG actualizó estructura HTML
- Resultado: Ahora detecta 5 cursos correctamente

## 2026-05-10
- Cambié COURSE_SELECTORS.activityItem de `[data-type]` a `li.activity-item`
- Resultado: Detecta actividades nuevamente
```

---

**Need help?** Comparte los archivos en `storage/debug/` (sin credenciales) y descripción del error.
