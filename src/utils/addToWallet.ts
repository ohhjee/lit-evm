export async function clickAddToWallet(page: any) {
  try {
    await page.waitForFunction(
      () => {
        return Array.from(document.querySelectorAll("button")).some((b) =>
          b.textContent?.toLowerCase().includes("add to wallet"),
        );
      },
      { timeout: 5000 }, // ⬅️ reduce timeout
    );

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent?.toLowerCase().includes("add to wallet"),
      );

      if (btn) (btn as HTMLButtonElement).click();
    });

    console.log("✅ Clicked 'Add to Wallet'");
  } catch {
    console.log("⚠️ No 'Add to Wallet' button");
  }
}
