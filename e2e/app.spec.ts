import { expect, test } from '@playwright/test';

test('Demo: Registrierung, Training und gespeicherte Auswertung', async ({ page }) => {
  await page.goto('/');
  await page.locator('ion-segment-button[value="register"]').click();
  await page.getByLabel('Anzeigename').fill('Test Lernende');
  await page.getByLabel('E-Mail-Adresse').fill('test@example.org');
  await page.getByLabel('Passwort').fill('sicheres-passwort');
  await page.getByRole('button', { name: 'Kostenlos registrieren' }).click();
  await expect(page.getByRole('status')).toContainText('Dein Konto wurde erfolgreich erstellt.');
  await expect(page.getByRole('heading', { name: 'Hallo, Test Lernende.' })).toBeVisible();
  await page.getByRole('link', { name: /Trainieren/ }).click();
  await page.getByRole('checkbox', { name: /Private Vorsorge & AV/ }).check();
  await expect(page.getByText('22 Fragen verfügbar')).toBeVisible();
  await page.getByRole('button', { name: 'Training starten' }).click();

  for (let index = 0; index < 10; index += 1) {
    await page.getByRole('group', { name: 'Antwortmöglichkeiten' }).getByRole('button').first().click();
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  }
  await expect(page.getByText('Runde abgeschlossen', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Zurück zur Übersicht' }).click();
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

test('Admin wird nach der Anmeldung direkt zum Adminbereich geleitet', async ({ page }) => {
  await page.goto('/auth');
  await page.getByLabel('E-Mail-Adresse').fill('admin+test@example.org');
  await page.getByLabel('Passwort').fill('sicheres-passwort');
  await page.getByRole('button', { name: 'Einloggen' }).click();
  await expect(page).toHaveURL(/\/admin$/);
});
