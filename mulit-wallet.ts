import { ethers } from "ethers";
import "dotenv/config";

const RPC = "https://liteforge.rpc.caldera.xyz/http";
const EXPLORER_API = "https://liteforge.explorer.caldera.xyz/api";

const provider = new ethers.JsonRpcProvider(RPC);

const VAULT_ADDRESS = "0xA1AB30Dd0B3a6f6d28D0FD0765136D571E19DA55";
const WZK_LTC_ADDRESS = "0x60a84ebc3483fefb251b76aea5b8458026ef4bea";
const SPECIAL_TO = "0x5adf1045c4a7c3e2176dbcbd09a7e6d1b0f75cfb";

// Deposit ABI
const depositIface = new ethers.Interface([
  "function deposit(address asset, address to, uint256 amount) external",
]);

// ================= LOAD WALLETS =================
const privateKeys = (process.env.PRIVATE_KEYS as string)
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const wallets = privateKeys.map((pk) => new ethers.Wallet(pk, provider));

console.log(`🔑 Loaded ${wallets.length} wallet(s):`);
wallets.forEach((w, i) => console.log(`  [${i + 1}] ${w.address}`));

// ================= NONCE MANAGER (per wallet) =================
const nonceMap: Map<string, number | null> = new Map();

async function getFreshNonce(wallet: ethers.Wallet): Promise<number> {
  const key = wallet.address;
  if (!nonceMap.has(key) || nonceMap.get(key) === null) {
    const nonce = await provider.getTransactionCount(wallet.address, "pending");
    nonceMap.set(key, nonce);
  }
  return nonceMap.get(key) as number;
}

function incrementNonce(wallet: ethers.Wallet) {
  const key = wallet.address;
  const current = nonceMap.get(key);
  if (current !== null && current !== undefined) {
    nonceMap.set(key, current + 1);
  }
}

function extractNonceFromError(err: unknown): number | null {
  const msg = (err as Error)?.message ?? "";
  const match = msg.match(/state:\s*(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function resetNonce(wallet: ethers.Wallet, value: number | null = null) {
  nonceMap.set(wallet.address, value);
}

// ================= ACTIVITY CHECKER =================
async function checkActivity(wallet: ethers.Wallet) {
  console.log(`\n📋 === RECENT ACTIVITY [${wallet.address}] ===`);

  try {
    const url = `${EXPLORER_API}?module=account&action=txlist&address=${wallet.address}&sort=desc&limit=10`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.result || data.result.length === 0) {
      console.log("No transactions found.");
      return;
    }

    for (const tx of data.result.slice(0, 5)) {
      const date = new Date(parseInt(tx.timeStamp) * 1000).toLocaleString();
      const status = tx.isError === "0" ? "✅" : "❌";
      const valueEth = ethers.formatEther(tx.value);

      console.log(`${status} TX: ${tx.hash}`);
      console.log(`   📅 ${date}`);
      console.log(`   📤 To: ${tx.to}`);
      console.log(`   💰 Value: ${valueEth} ETH`);
      console.log(`   🔢 Nonce: ${tx.nonce}`);
      console.log(`   ⛽ Gas Used: ${tx.gasUsed}`);
      console.log("   ---");
    }
  } catch (err) {
    console.error("❌ Could not fetch activity:", err);
  }
}

// ================= SUPPLY =================
async function supply(wallet: ethers.Wallet, amount: string) {
  const amt = ethers.parseUnits(amount, 18);

  console.log(`\n[${wallet.address}] === SUPPLY ${amount} WzkLTC ===`);

  const token = new ethers.Contract(
    WZK_LTC_ADDRESS,
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    wallet,
  );

  try {
    const approveNonce = await getFreshNonce(wallet);
    const approveTx = await token.approve(VAULT_ADDRESS, amt, {
      nonce: approveNonce,
    });
    await approveTx.wait();
    incrementNonce(wallet);
    console.log("✅ Approved");
  } catch {
    console.log("✅ Already approved / skipping");
  }

  const calldata = depositIface.encodeFunctionData("deposit", [
    WZK_LTC_ADDRESS,
    SPECIAL_TO,
    amt,
  ]);

  console.log("📦 Supply Calldata:", calldata);

  const nonce = await getFreshNonce(wallet);
  const tx = await wallet.sendTransaction({
    to: VAULT_ADDRESS,
    data: calldata,
    nonce,
  });

  console.log("🚀 Supply TX:", tx.hash);
  await tx.wait();
  incrementNonce(wallet);

  console.log("✅ Supply Success");
}

// ================= WITHDRAW =================
async function withdraw(wallet: ethers.Wallet, amount: string) {
  const amt = ethers.parseUnits(amount, 18);

  console.log(`\n[${wallet.address}] === WITHDRAW ${amount} WzkLTC ===`);

  const selector = "0xd9caed12";
  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256"],
    [WZK_LTC_ADDRESS, SPECIAL_TO, amt],
  );

  const calldata = selector + encoded.slice(2);

  console.log("📦 Withdraw Calldata:", calldata);

  const nonce = await getFreshNonce(wallet);
  const tx = await wallet.sendTransaction({
    to: VAULT_ADDRESS,
    data: calldata,
    nonce,
  });

  console.log("🚀 Withdraw TX:", tx.hash);

  const receipt = await tx.wait();

  if (receipt?.status !== 1) {
    throw new Error("❌ Withdraw reverted");
  }

  incrementNonce(wallet);
  console.log("✅ Withdraw Success");
}

// ================= RUN ONE WALLET =================
async function runWallet(wallet: ethers.Wallet) {
  let cycleCount = 0;

  await checkActivity(wallet);

  while (true) {
    cycleCount++;
    const nonce = nonceMap.get(wallet.address);
    console.log(
      `\n🔄 [${wallet.address}] Cycle #${cycleCount} | Nonce: ${nonce ?? "null"}`,
    );

    try {
      await supply(wallet, "0.01");
      await new Promise((r) => setTimeout(r, 5000));
      await withdraw(wallet, "0.01");

      if (cycleCount % 5 === 0) {
        await checkActivity(wallet);
      }
    } catch (err) {
      console.error(`❌ [${wallet.address}] Cycle error:`, err);

      const correctNonce = extractNonceFromError(err);
      if (correctNonce !== null) {
        console.log(`🔧 Correcting nonce to: ${correctNonce}`);
        resetNonce(wallet, correctNonce);
      } else {
        resetNonce(wallet, null);
      }
    }

    console.log(`\n⏳ [${wallet.address}] Waiting 15 seconds...`);
    await new Promise((r) => setTimeout(r, 15000));
  }
}

// ================= MAIN =================
async function main() {
  console.log("🔥 Ayni Protocol Bot — Multi-Wallet");

  // Run all wallets in parallel
  await Promise.all(wallets.map((wallet) => runWallet(wallet)));
}

main().catch(console.error);

//  pnpm ts-node --compiler-options "{\"module\":\"CommonJS\"}" src/index.ts
