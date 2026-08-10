import { expect, test } from '@playwright/test';

test('Demo: Registrierung, Training und gespeicherte Auswertung', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Registrieren', { exact: true }).click();
  await page.getByLabel('Anzeigename').fill('Test Lernende');
  await page.getByLabel('E-Mail-Adresse').fill('test@example.org');
  await page.getByLabel('Passwort').fill('sicheres-passwort');
  await page.getByRole('button', { name: 'Kostenlos registrieren' }).click();
  await expect(page.getByRole('heading', { name: 'Hallo, Test Lernende.' })).toBeVisible();
  await page.getByRole('link', { name: /Trainieren/ }).click();
  await page.getByLabel(/Private Vorsorge & AV/).check();
  await expect(page.getByText('10 Fragen verfügbar')).toBeVisible();
  await page.getByRole('button', { name: 'Training starten' }).click();

  for (let index = 0; index < 10; index += 1) {
    await page.getByRole('button', { name: /A Testantwort A/ }).click();
    await page.getByRole('button', { name: 'Weiter' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Runde abgeschlossen' })).toBeVisible();
  await page.getByRole('button', { name: 'Zurück zur Übersicht' }).click();
  await expect(page.getByText('10', { exact: true }).first()).toBeVisible();
});

test('Adminroute wird für Lernende abgewehrt', async ({ page }) => {
  await page.goto('/auth');
  await page.getByLabel('E-Mail-Adresse').fill('learner@example.org');
  await page.getByLabel('Passwort').fill('sicheres-passwort');
  await page.getByRole('button', { name: 'Einloggen' }).click();
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/home$/);
});
