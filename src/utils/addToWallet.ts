export async function clickAddToWallet(page: any): Promise<void> {
  console.log("🔗 Clicking 'Add to Wallet'...");

  await page.waitForFunction(
    () => {
      const buttons = Array.from(document.querySelectorAll("button"));

      return buttons.some((btn) =>
        btn.textContent?.toLowerCase().includes("add to wallet"),
      );
    },
    { timeout: 20000 },
  );

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));

    const addBtn = buttons.find((btn) =>
      btn.textContent?.toLowerCase().includes("add to wallet"),
    );

    if (!addBtn) throw new Error("Add to Wallet button not found");

    (addBtn as HTMLButtonElement).click();
  });

  console.log("✅ Clicked 'Add to Wallet'");

  // ⏳ Wait a bit for wallet injection
  await new Promise((res) => setTimeout(res, 5000));
}
