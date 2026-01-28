#!/usr/bin/env node
/**
 * Chaos test script for Slavic Survivors
 * Uses Playwright directly without test runner
 * SAFETY: No permanent changes - only UI/navigation testing
 */
const { chromium } = require('playwright');

async function runChaosTest() {
  console.log('🚀 Starting Slavic Survivors Chaos Test...');
  console.log('🔒 SAFETY MODE: Only testing UI/navigation - no permanent changes');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Prevent navigation to any API routes that could cause permanent changes
  await context.route('**/api/(payment|inventory|items|mint|admin|stats|replays)**', route => {
    console.log('🚫 BLOCKED: Attempted access to sensitive API route:', route.request().url());
    route.abort();
  });

  try {
    // No authentication required for localhost testing
    console.log('🔓 Unauthenticated testing (localhost only)');

    // Navigate to play page
    await page.goto('http://localhost:3000/play');
    console.log('✅ Navigated to /play');

    // Wait for main menu
    await page.waitForSelector('h1:has-text("Slavic Survivors")');
    console.log('✅ Main menu loaded');

    // Test world selection
    const worldCards = await page.locator('div[class*="cursor-pointer border-2 rounded-2xl"]').count();
    console.log(`🔍 Found ${worldCards} world cards`);

    for (let i = 0; i < Math.min(worldCards, 3); i++) {
      await page.locator('div[class*="cursor-pointer border-2 rounded-2xl"]').nth(i).click();
      await page.waitForTimeout(500);
      console.log(`✅ Clicked world card ${i + 1}`);
    }

    // Test character selection (don't actually start game)
    await page.click('button:has-text("Select Hero")');
    await page.waitForSelector('h2:has-text("Choose Your Fighter")');
    console.log('✅ Opened character selection');

    // Select a character but don't start game
    const charCards = await page.locator('div[class*="cursor-pointer border-4 rounded"]').count();
    console.log(`🔍 Found ${charCards} character cards`);

    if (charCards > 0) {
      await page.locator('div[class*="cursor-pointer border-4 rounded"]').first().click();
      await page.waitForTimeout(500);
      console.log('✅ Selected first character (NOT starting game)');
    }

    // Test back button - return to main menu
    await page.click('button:has-text("BACK")');
    await page.waitForSelector('h1:has-text("Slavic Survivors")');
    console.log('✅ Back button works');

    // Test Legends/Leaderboard
    await page.click('button:has-text("Legends")');
    await page.waitForTimeout(1000);
    console.log('✅ Legends page loaded');

    // Go back from legends
    await page.click('button:has-text("Back"), button:has-text("BACK")');
    await page.waitForSelector('h1:has-text("Slavic Survivors")');
    console.log('✅ Returned from legends');

    console.log('🎉 Chaos test completed successfully!');
    console.log('✅ SAFETY: No game started, no inventory accessed, no permanent changes made');

  } catch (error) {
    console.error('❌ Chaos test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runChaosTest();