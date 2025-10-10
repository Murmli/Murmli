import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://murmli.de/');
  await page.getByRole('link', { name: 'Kalorienrechner' }).click();
  await page.getByRole('heading', { name: 'Kalorienrechner nach der' }).click({
    button: 'right'
  });
  await expect(page.locator('#calorie-calculator')).toContainText('Kalorienrechner nach der Murmli Methode');
});