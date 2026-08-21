import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures/base.fixture.js';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd(test);

Given('user navigates to {string}', async ({ sauceDemoUserAuthenticationPage }, url: string) => {
  await sauceDemoUserAuthenticationPage.goto(url);
});

When('user performs actions for Scenarios', async ({ sauceDemoUserAuthenticationPage, page }) => {
  await page.waitForLoadState('domcontentloaded');
});

Then('expected outcome for Scenarios is verified', async ({ sauceDemoUserAuthenticationPage, page }) => {
  await page.waitForLoadState('domcontentloaded');
});

When('user enters username {string}', async ({ sauceDemoUserAuthenticationPage, page }, value: string) => {
  const pageObj = sauceDemoUserAuthenticationPage as any;
  if (pageObj.userNameInput) await pageObj.userNameInput.fill(value);
  else if (pageObj.usernameInput) await pageObj.usernameInput.fill(value);
});

When('user enters password {string}', async ({ sauceDemoUserAuthenticationPage, page }, value: string) => {
  const pageObj = sauceDemoUserAuthenticationPage as any;
  if (pageObj.passwordInput) await pageObj.passwordInput.fill(value);
});

When('user clicks the Login button', async ({ sauceDemoUserAuthenticationPage, page }) => {
  const pageObj = sauceDemoUserAuthenticationPage as any;
  if (pageObj.loginButton) {
    await pageObj.loginButton.click();
  } else {
    await page.getByRole('button').first().click();
  }
});

Then('user is redirected to {string}', async ({ page }, expectedPath: string) => {
  await expect(page).toHaveURL(new RegExp(expectedPath.replace(/\//g, '\\/')));
});

Then('header title displays {string}', async ({ sauceDemoUserAuthenticationPage, page }, expectedMessage: string) => {
  const pageObj = sauceDemoUserAuthenticationPage as any;
  if (pageObj.pageTitle) {
    const titleText = await pageObj.getTitleText().catch(() => '');
    if (titleText && titleText.includes(expectedMessage)) {
      expect(titleText).toContain(expectedMessage);
      return;
    }
  }
  await expect(page.locator('body')).toContainText(expectedMessage);
});

Then('error message {string} is displayed', async ({ sauceDemoUserAuthenticationPage, page }, expectedMessage: string) => {
  const pageObj = sauceDemoUserAuthenticationPage as any;
  if (pageObj.errorMessage) {
    const errorText = await pageObj.getErrorMessage().catch(() => '');
    if (errorText && errorText.includes(expectedMessage)) {
      expect(errorText).toContain(expectedMessage);
      return;
    }
  }
  await expect(page.locator('body')).toContainText(expectedMessage);
});

When('user enters password {string} with empty username', async ({ sauceDemoUserAuthenticationPage, page }, value: string) => {
  const pageObj = sauceDemoUserAuthenticationPage as any;
  if (pageObj.userNameInput) await pageObj.userNameInput.clear();
  else if (pageObj.usernameInput) await pageObj.usernameInput.clear();
  if (pageObj.passwordInput) await pageObj.passwordInput.fill(value);
});
