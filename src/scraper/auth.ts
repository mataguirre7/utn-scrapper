import { BrowserContext, Page } from 'playwright';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { saveSessionState, navigateWithRetry } from './browser';
import { AUTH_SELECTORS } from './selectors';
import { saveHtmlSnapshot, saveScreenshot } from './debug.service';

export async function ensureAuthenticated(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();

  try {
    await navigateWithRetry(page, config.cvg.url);

    // Check if already authenticated
    const isAuthenticated = await checkIfAuthenticated(page);
    if (isAuthenticated) {
      logger.success('✅ Already authenticated');
      return page;
    }

    logger.log('🔐 Starting login flow (FRSN-0365)...');
    await performLogin(page);

    // Save session after successful login
    await saveSessionState(context);
    logger.success('✅ Login successful');

    return page;
  } catch (error) {
    await page.close();
    throw error;
  }
}

async function checkIfAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check current URL for login indicators
    const url = page.url();
    if (url.includes('login.microsoftonline.com') || url.includes('login')) {
      return false;
    }

    // Check for Moodle user menu or logged-in indicators (most reliable)
    const userMenu = await page.$(AUTH_SELECTORS.userMenu);
    if (userMenu) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

async function performLogin(page: Page): Promise<void> {
  try {
    const currentUrl = page.url();
    logger.log(`Current URL: ${currentUrl}`);

    // If on login page (Moodle form visible), proceed directly
    if (currentUrl.includes('login/index.php')) {
      logger.log('🔑 On Moodle login page');
      await performMoodleLogin(page);
    }
    // If on Microsoft login page, proceed directly
    else if (currentUrl.includes('login.microsoftonline.com')) {
      logger.log('🔑 On Microsoft 365 login page');
      await performMicrosoftLogin(page);
    }
    // Otherwise, we're on homepage - need to click login button
    else {
      logger.log('🔑 On homepage, need to click login button');

      // Try clicking FRSN-O365 button first
      const o365Button = await page.$('a[href*="auth/oidc"]');
      if (o365Button) {
        logger.log('🔑 Found FRSN-O365 button, clicking...');
        await o365Button.click();
        await page.waitForTimeout(2000);

        // Now we should be on Microsoft login
        const newUrl = page.url();
        if (newUrl.includes('login.microsoftonline.com')) {
          await performMicrosoftLogin(page);
        }
      } else {
        // Fallback to Moodle manual login button
        const moodleButton = await page.$('a[href*="login/index.php"]');
        if (moodleButton) {
          logger.log('🔑 Found Moodle login button, clicking...');
          await moodleButton.click();
          await page.waitForTimeout(2000);
          await performMoodleLogin(page);
        } else {
          throw new Error('No login buttons found on page');
        }
      }
    }

    // Wait for navigation and redirect back to CVG
    await page.waitForNavigation({ waitUntil: 'networkidle' }).catch(() => {
      logger.debug('Navigation timeout (expected)');
    });

    // Give time for redirect chains to complete
    await page.waitForTimeout(3000);
  } catch (error) {
    logger.error('Login failed', error);
    throw error;
  }
}

async function performMicrosoftLogin(page: Page): Promise<void> {
  logger.log('📧 Entering Microsoft 365 credentials');

  try {
    // Save debug snapshot before login
    if (process.env.DEBUG_MODE === 'true') {
      await saveHtmlSnapshot(page, 'auth-before-email.html');
    }

    // Step 1: Email input
    const emailInput = await page.waitForSelector(AUTH_SELECTORS.microsoftEmailInput, { timeout: 10000 });
    if (!emailInput) {
      throw new Error('Email input not found. Check AUTH_SELECTORS.microsoftEmailInput');
    }

    await emailInput.fill(config.cvg.username);
    logger.log('✓ Email entered');

    // Click Next button
    const nextButton = await page.$(AUTH_SELECTORS.microsoftNextButton);
    if (nextButton) {
      await nextButton.click();
    } else {
      await page.keyboard.press('Enter');
    }

    // Wait for password screen
    await page.waitForTimeout(2000);

    // Step 2: Password input
    const passwordInput = await page.waitForSelector(AUTH_SELECTORS.microsoftPasswordInput, { timeout: 10000 });
    if (!passwordInput) {
      throw new Error('Password input not found. Check AUTH_SELECTORS.microsoftPasswordInput');
    }

    await passwordInput.fill(config.cvg.password);
    logger.log('✓ Password entered');

    if (process.env.DEBUG_MODE === 'true') {
      await saveScreenshot(page, 'auth-before-submit.png');
    }

    // Click login button
    const loginButton = await page.$(AUTH_SELECTORS.microsoftLoginButton);
    if (loginButton) {
      await loginButton.click();
    } else {
      await page.keyboard.press('Enter');
    }

    // Wait for "Stay signed in?" dialog with retry
    let staySignedInAttempts = 0;
    let staySignedInButton = null;

    while (staySignedInAttempts < 3 && !staySignedInButton) {
      await page.waitForTimeout(1000);
      staySignedInButton = await page.$(AUTH_SELECTORS.microsoftStaySignedButton);
      staySignedInAttempts++;
    }

    // Step 3: Handle "¿Quiere mantener la sesión iniciada?" dialog
    if (staySignedInButton) {
      logger.log('✓ Confirming session');
      await staySignedInButton.click();
    } else {
      logger.log('⊘ Stay signed in dialog not found, trying getByRole...');
      // Fallback: use getByRole which works better in Playwright
      try {
        const yesButton = page.getByRole('button', { name: 'Sí' });
        const isVisible = await yesButton.isVisible().catch(() => false);
        if (isVisible) {
          logger.log('✓ Found Sí button with getByRole, clicking...');
          await yesButton.click();
        }
      } catch {
        logger.log('⊘ Sí button not found (might be auto-skipped)');
      }
    }

    logger.log('✓ Microsoft login completed');
  } catch (error) {
    if (process.env.DEBUG_MODE === 'true') {
      await saveScreenshot(page, 'auth-error.png').catch(() => {});
      await saveHtmlSnapshot(page, 'auth-error.html').catch(() => {});
    }
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Microsoft login failed: ${errorMsg}`);
    throw error;
  }
}

async function performMoodleLogin(page: Page): Promise<void> {
  logger.log('🔐 Attempting Moodle login');

  try {
    // Try to find Moodle login form using centralized selectors
    const usernameInput = await page.$(AUTH_SELECTORS.moodleUsernameInput);

    if (!usernameInput) {
      throw new Error('Username input not found. Check AUTH_SELECTORS.moodleUsernameInput');
    }

    await usernameInput.fill(config.cvg.username);
    logger.log('✓ Username entered');

    const passwordInput = await page.$(AUTH_SELECTORS.moodlePasswordInput);

    if (!passwordInput) {
      throw new Error('Password input not found. Check AUTH_SELECTORS.moodlePasswordInput');
    }

    await passwordInput.fill(config.cvg.password);
    logger.log('✓ Password entered');

    if (process.env.DEBUG_MODE === 'true') {
      await saveScreenshot(page, 'moodle-login-form.png').catch(() => {});
    }

    const submitButton = await page.$(AUTH_SELECTORS.moodleSubmitButton);

    if (!submitButton) {
      throw new Error('Submit button not found. Check AUTH_SELECTORS.moodleSubmitButton');
    }

    await submitButton.click();
    logger.log('✓ Moodle login submitted');
  } catch (error) {
    if (process.env.DEBUG_MODE === 'true') {
      await saveScreenshot(page, 'moodle-login-error.png').catch(() => {});
      await saveHtmlSnapshot(page, 'moodle-login-error.html').catch(() => {});
    }
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Moodle login failed: ${errorMsg}`);
    throw error;
  }
}
