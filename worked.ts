import { ethers } from "ethers";
import "dotenv/config";

const RPC = "https://liteforge.rpc.caldera.xyz/http";
const EXPLORER_API = "https://liteforge.explorer.caldera.xyz/api";

const provider = new ethers.JsonRpcProvider(RPC);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);

const VAULT_ADDRESS = "0xA1AB30Dd0B3a6f6d28D0FD0765136D571E19DA55";
const WZK_LTC_ADDRESS = "0x60a84ebc3483fefb251b76aea5b8458026ef4bea";
const SPECIAL_TO = "0x5adf1045c4a7c3e2176dbcbd09a7e6d1b0f75cfb";

// Deposit ABI
const depositIface = new ethers.Interface([
  "function deposit(address asset, address to, uint256 amount) external",
]);

// ================= NONCE MANAGER =================
let currentNonce: number | null = null;

async function getFreshNonce() {
  if (currentNonce === null) {
    currentNonce = await provider.getTransactionCount(
      wallet.address,
      "pending",
    );
  }
  return currentNonce;
}

function incrementNonce() {
  if (currentNonce !== null) currentNonce++;
}

function extractNonceFromError(err: unknown): number | null {
  const msg = (err as Error)?.message ?? "";
  const match = msg.match(/state:\s*(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// ================= ACTIVITY CHECKER =================
async function checkActivity() {
  console.log("\n📋 === RECENT BOT ACTIVITY ===");

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
async function supply(amount: string) {
  const amt = ethers.parseUnits(amount, 18);

  console.log(`\n=== SUPPLY ${amount} WzkLTC ===`);

  const token = new ethers.Contract(
    WZK_LTC_ADDRESS,
    [
      "function approve(address spender, uint256 amount) external returns (bool)",
    ],
    wallet,
  );

  try {
    const approveNonce = await getFreshNonce();
    const approveTx = await token.approve(VAULT_ADDRESS, amt, {
      nonce: approveNonce,
    });
    await approveTx.wait();
    incrementNonce();
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

  const nonce = await getFreshNonce();
  const tx = await wallet.sendTransaction({
    to: VAULT_ADDRESS,
    data: calldata,
    nonce,
  });

  console.log("🚀 Supply TX:", tx.hash);
  await tx.wait();
  incrementNonce();

  console.log("✅ Supply Success");
}

// ================= WITHDRAW =================
async function withdraw(amount: string) {
  const amt = ethers.parseUnits(amount, 18);

  console.log(`\n=== WITHDRAW ${amount} WzkLTC ===`);

  const selector = "0xd9caed12";

  const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address", "uint256"],
    [WZK_LTC_ADDRESS, SPECIAL_TO, amt],
  );

  const calldata = selector + encoded.slice(2);

  console.log("📦 Withdraw Calldata:", calldata);

  const nonce = await getFreshNonce();
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

  incrementNonce();
  console.log("✅ Withdraw Success");
}

// ================= MAIN =================
async function main() {
  console.log("🔥 Ayni Protocol Bot");
  console.log("Wallet:", wallet.address);

  // Show activity at startup
  await checkActivity();

  let cycleCount = 0;

  while (true) {
    cycleCount++;
    console.log(`\n🔄 Cycle #${cycleCount}`);
    console.log(`🔢 Current nonce: ${currentNonce}`);

    try {
      await supply("0.01");
      await new Promise((r) => setTimeout(r, 5000));
      await withdraw("0.01");

      // Show activity every 5 cycles
      if (cycleCount % 5 === 0) {
        await checkActivity();
      }
    } catch (err) {
      console.error("❌ Cycle error:", err);

      const correctNonce = extractNonceFromError(err);
      if (correctNonce !== null) {
        console.log(`🔧 Correcting nonce from error: ${correctNonce}`);
        currentNonce = correctNonce;
      } else {
        currentNonce = null;
      }
    }

    console.log("\n⏳ Waiting 15 seconds before next cycle...");
    await new Promise((r) => setTimeout(r, 15000));
  }
}

main().catch(console.error);

//  pnpm ts-node --compiler-options "{\"module\":\"CommonJS\"}" src/index.ts
