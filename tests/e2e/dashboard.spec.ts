import { test, expect } from "@playwright/test";

test.describe("Vigilantix AI SOC Command Center E2E", () => {
  test("should load the login page and show accessibility elements", async ({ page }) => {
    await page.goto("/login");

    // Verify email and password inputs
    const emailInput = page.locator("#email-input");
    const passwordInput = page.locator("#password-input");

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify presence of input labels matching htmlFor ID references
    const emailLabel = page.locator('label[for="email-input"]');
    const passwordLabel = page.locator('label[for="password-input"]');
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();

    // Verify outline/focus rings on email inputs
    await emailInput.focus();
    await expect(emailInput).toHaveClass(/focus-visible:ring/);
  });

  test.describe("Authenticated Dashboard Navigation", () => {
    test.beforeEach(async ({ page }) => {
      // Mock Supabase session in localStorage before page load
      await page.context().addInitScript(() => {
        window.localStorage.setItem(
          "sb-gbxjeahdfmyewetqxuqc-auth-token",
          JSON.stringify({
            access_token: "mock-access-token",
            token_type: "bearer",
            expires_in: 3600,
            refresh_token: "mock-refresh-token",
            user: {
              id: "e81d77a2-f8ab-40b8-9382-b7e615e440e2",
              aud: "authenticated",
              role: "authenticated",
              email: "admin@vigilantix.ai",
            },
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          })
        );
      });
    });

    test("should navigate to operational hub and sub-pages", async ({ page }) => {
      // Go to main page
      await page.goto("/");
      await expect(page.locator("h1")).toHaveText("Operational Intelligence Hub");

      // Verify and inspect accessibility tags on SVGs
      const svgElements = page.locator("svg[aria-hidden='true']");
      const svgCount = await svgElements.count();
      expect(svgCount).toBeGreaterThan(0);

      // Navigate to Logs page
      await page.goto("/logs");
      await expect(page.locator("h1")).toHaveText("Data Collectors & Raw Logs");

      // Navigate to AI Anomaly page
      await page.goto("/ai-detection");
      await expect(page.locator("h1")).toHaveText("AI Detection Engine");

      // Navigate to SOAR playbooks page
      await page.goto("/soar");
      await expect(page.locator("h1")).toHaveText("SOAR Playbooks & Automation");

      // Navigate to Billing page
      await page.goto("/billing");
      await expect(page.locator("h1")).toHaveText("Billing & Cloud Infrastructure");
    });

    test("should filter log entries in real-time using the global search bar", async ({ page }) => {
      // Go to Logs page
      await page.goto("/logs");
      await expect(page.locator("h1")).toHaveText("Data Collectors & Raw Logs");

      // Verify search input is present
      const searchInput = page.locator("#search-input");
      await expect(searchInput).toBeVisible();

      // Count initial log rows displayed in the table body
      const initialRowSelector = "tbody tr";
      await page.waitForSelector(initialRowSelector);
      const initialRowsCount = await page.locator(initialRowSelector).count();

      // Type a nonexistent search query to filter out all items
      await searchInput.fill("nonexistentpattern789");
      await page.waitForTimeout(200);

      // Verify that no log rows are displayed now
      const filteredRowsCount = await page.locator(initialRowSelector).count();
      expect(filteredRowsCount).toBe(0);

      // Clear the search input
      await searchInput.fill("");
      await page.waitForTimeout(200);

      // Verify that the original rows are restored
      const restoredRowsCount = await page.locator(initialRowSelector).count();
      expect(restoredRowsCount).toBe(initialRowsCount);
    });

    test("should toggle the notifications bell and show dynamic event entries", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator("h1")).toHaveText("Operational Intelligence Hub");
      
      const bellButton = page.locator('#bell-button');
      await expect(bellButton).toBeVisible();

      // Click to open dropdown
      await page.waitForTimeout(500);
      await bellButton.click();

      // Verify the dropdown header is shown using ID
      await expect(page.locator("#notifications-title")).toBeVisible();

      // Verify the initial notifications are visible
      await expect(page.locator("text=Vigilantix Threat Detection platform initialized.")).toBeVisible();

      // Click the bell button again to close it
      await bellButton.click();
      await expect(page.locator("#notifications-dropdown")).not.toBeVisible();
    });

    test("should navigate to account profile page, display operator info and modify preferences", async ({ page }) => {
      // Navigate to main and click operator avatar link
      await page.goto("/");
      const avatarLink = page.locator('a[aria-label="Operator Profile & Preferences"]');
      await expect(avatarLink).toBeVisible();
      await expect(avatarLink).toHaveText("AD"); // admin@vigilantix.ai -> AD
      
      await avatarLink.click();
      await expect(page.locator("h1")).toHaveText("Operator Profile & Terminal Settings");

      // Verify operator roster contains Rafli
      await expect(page.locator("text=Rafli A. I. Hartono").first()).toBeVisible();

      // Test copying User ID is functional (or check its visibility)
      await expect(page.locator("text=e81d77a2-f8ab-40b8-9382-b7e615e440e2")).toBeVisible();

      // Verify and modify environment region preference selection
      const regionSelect = page.locator("select").first();
      await expect(regionSelect).toBeVisible();
      await regionSelect.selectOption("ap_southeast");

      // Click Save Config button
      const saveBtn = page.locator("button:has-text('Save Config')");
      await saveBtn.click();

      // Wait for success toast feedback
      await expect(page.locator("text=Preferences updated")).toBeVisible();

      // Verify localStorage was updated correctly
      const localPrefs = await page.evaluate((userId) => {
        return localStorage.getItem(`vigilantix_prefs_${userId}`);
      }, "e81d77a2-f8ab-40b8-9382-b7e615e440e2");
      
      expect(localPrefs).not.toBeNull();
      expect(JSON.parse(localPrefs || "{}").region).toBe("ap_southeast");
    });
  });
});
