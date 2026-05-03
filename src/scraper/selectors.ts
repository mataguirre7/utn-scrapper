/**
 * Centralized CSS selectors for CVG/Moodle
 * Update these if CVG layout changes
 */

// ============================================
// AUTHENTICATION SELECTORS (Microsoft 365)
// ============================================

export const AUTH_SELECTORS = {
  // Microsoft 365 login
  microsoftEmailInput: 'input[type="email"]',
  microsoftPasswordInput: 'input[type="password"]',
  microsoftNextButton: 'button:has-text("Siguiente"), button[type="submit"]',
  microsoftLoginButton: 'button:has-text("Iniciar sesión"), button[type="submit"]',
  microsoftStaySignedButton: 'button:has-text("Sí"), button[aria-label*="Sí"]',

  // Standard Moodle login (fallback)
  moodleUsernameInput: 'input[name="username"], input[id*="username"], input[type="email"]',
  moodlePasswordInput: 'input[name="password"], input[id*="password"], input[type="password"]',
  moodleSubmitButton: 'button[type="submit"], input[type="submit"], button:has-text("Entrar"), button:has-text("Iniciar")',

  // Authentication check
  userMenu: '.usermenu, [aria-label*="usuario"], [aria-label*="user"]',
  mainContent: '[role="main"], .maincontent, .content',
};

// ============================================
// DASHBOARD SELECTORS (List of courses)
// ============================================

export const DASHBOARD_SELECTORS = {
  // Course links on dashboard
  courseLinks: 'a[href*="/course/view.php"]',
  courseContainer: '[data-course], .course-card, .course-item',
};

// ============================================
// COURSE SELECTORS (Individual course page)
// ============================================

export const COURSE_SELECTORS = {
  // Activities (assignments, quizzes, forums, etc)
  activityItem: '[data-type], .activity, .resource, [class*="activity"]',
  activityLink: 'a[href*="/mod/"]',
  activityType: '[data-type], [class*="type"]',
  activityDueDate: '.due, .duedateinfo, [class*="due"], .duedate',

  // Materials/Resources
  materialItem: '[data-type="resource"], [data-type="folder"], [data-type="url"], .resource, .folder',
  materialLink: 'a[href*="/mod/"]',

  // Generic selectors (fallback)
  allLinks: 'a',
};

// ============================================
// CALENDAR SELECTORS
// ============================================

export const CALENDAR_SELECTORS = {
  // Calendar section
  calendarSection: '[class*="calendar"], [id*="calendar"], .block-calendar',
  eventItem: '[class*="event"], a[class*="cal"], .calendar-event',
  eventDate: '[data-date], .date, [class*="date"]',
};

// ============================================
// SHARED SELECTORS
// ============================================

export const SHARED_SELECTORS = {
  text: 'textContent',
  href: 'href',
};

/**
 * Helper to extract course ID from URL
 * CVG uses: /course/view.php?id=12345
 */
export function extractCourseIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('id') || url.split('/').pop() || null;
  } catch {
    return null;
  }
}

/**
 * Helper to extract activity type from URL pattern
 * Moodle uses: /mod/{type}/view.php?id=xyz
 * Examples: /mod/assign/, /mod/quiz/, /mod/forum/
 */
export function extractActivityTypeFromUrl(url: string): string {
  const match = url.match(/\/mod\/([^\/]+)\//);
  return match?.[1] || 'activity';
}

/**
 * Helper to extract resource type from class names or attributes
 */
export function extractTypeFromClassName(className: string, url: string): string {
  if (className.includes('assign') || url.includes('/mod/assign/')) return 'assignment';
  if (className.includes('quiz') || url.includes('/mod/quiz/')) return 'quiz';
  if (className.includes('forum') || url.includes('/mod/forum/')) return 'forum';
  if (className.includes('resource') || url.includes('/mod/resource/')) return 'file';
  if (className.includes('folder') || url.includes('/mod/folder/')) return 'folder';
  if (className.includes('url') || url.includes('/mod/url/')) return 'url';
  return extractActivityTypeFromUrl(url);
}
