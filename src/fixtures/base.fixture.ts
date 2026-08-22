import { test as baseTest } from 'playwright-bdd';
import { SauceDemoUserAuthenticationPage } from '../pages/saucedemo-user-authentication.page.js';

type Pages = {
  sauceDemoUserAuthenticationPage: SauceDemoUserAuthenticationPage;
};

export const test = baseTest.extend<Pages>({
  sauceDemoUserAuthenticationPage: async ({ page }, use) => {
    await use(new SauceDemoUserAuthenticationPage(page));
  },
});

export { expect } from '@playwright/test';
