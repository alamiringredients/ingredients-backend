import assert from 'node:assert/strict'
import {test} from 'node:test'
import {chromium} from 'playwright'

const origin = process.env.BACKEND_URL ?? 'http://localhost:8000'

test('failed Holo login preserves email and remember selection', async () => {
  const browser = await chromium.launch({channel: process.env.BROWSER_CHANNEL ?? 'chrome', headless: true})
  try {
    const page = await browser.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${origin}/admin/settings?section=general`)
    await page.waitForURL(`${origin}/admin/login?redirect=%2Fadmin%2Fsettings%3Fsection%3Dgeneral`)
    const email = `login-regression-${Date.now()}@example.invalid`
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password', {exact: true}).fill('invalid-regression-password')
    await page.getByLabel('Keep me signed in').check()
    await page.getByRole('button', {name: 'Sign in', exact: true}).click()
    await page.locator('#email-error').filter({hasText: 'These credentials do not match our records.'}).waitFor()
    assert.equal(await page.getByLabel('Email address').inputValue(), email)
    assert.equal(await page.getByLabel('Keep me signed in').isChecked(), true)
    assert.equal(await page.getByRole('button', {name: 'Sign in', exact: true}).isEnabled(), true)
    assert.deepEqual(errors, [])
  } finally {
    await browser.close()
  }
})
