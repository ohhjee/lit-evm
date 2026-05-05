import "dotenv/config";
import { ethers } from "ethers";
import { sleep } from "../utils/sleep";

const RPC = "https://liteforge.rpc.caldera.xyz/http";
export const provider = new ethers.JsonRpcProvider(RPC);

const VAULT_ADDRESS = "0xA1AB30Dd0B3a6f6d28D0FD0765136D571E19DA55";
const WZK_LTC_ADDRESS = "0x60a84ebc3483fefb251b76aea5b8458026ef4bea";
const SPECIAL_TO = "0x5adf1045c4a7c3e2176dbcbd09a7e6d1b0f75cfb";

const depositIface = new ethers.Interface([
  "function deposit(address asset, address to, uint256 amount) external",
]);

/* ===============================
   🔑 LOAD MULTIPLE PRIVATE KEYS
================================ */
const privateKeys = (process.env.PRIVATE_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean)
  .map((k) => k.replace(/[^0-9a-fA-F]/g, ""))
  .map((k) => (k.length === 64 ? "0x" + k : k));

if (privateKeys.length === 0) {
  throw new Error("❌ No valid private keys found");
}

/* ===============================
   👛 CREATE WALLETS
================================ */
export function createWallets() {
  return privateKeys.map((key) => new ethers.Wallet(key, provider));
}

/* ===============================
   🧠 NONCE TRACKER (PER WALLET)
================================ */
const nonceMap: Record<string, number> = {};

async function getNonce(wallet: ethers.Wallet) {
  if (nonceMap[wallet.address] === undefined) {
    nonceMap[wallet.address] = await provider.getTransactionCount(
      wallet.address,
      "pending",
    );
  }
  return nonceMap[wallet.address];
}

function incNonce(wallet: ethers.Wallet) {
  nonceMap[wallet.address]++;
}

function resetNonce(wallet: ethers.Wallet) {
  delete nonceMap[wallet.address];
}

/* ===============================
   🚜 FARM FUNCTION (PER WALLET)
================================ */
export async function farm(wallet: ethers.Wallet) {
  let cycle = 0;

  while (true) {
    cycle++;
    console.log(`\n💧 ${wallet.address} | Cycle #${cycle}`);

    try {
      const amt = ethers.parseUnits("0.01", 18);

      // ===== SUPPLY =====
      const calldata = depositIface.encodeFunctionData("deposit", [
        WZK_LTC_ADDRESS,
        SPECIAL_TO,
        amt,
      ]);

      const tx1 = await wallet.sendTransaction({
        to: VAULT_ADDRESS,
        data: calldata,
        nonce: await getNonce(wallet),
      });

      console.log("⏳ Supply:", tx1.hash);
      await tx1.wait();
      incNonce(wallet);

      await sleep(5000);

      // ===== WITHDRAW =====
      const selector = "0xd9caed12";
      const encoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "uint256"],
        [WZK_LTC_ADDRESS, SPECIAL_TO, amt],
      );

      const tx2 = await wallet.sendTransaction({
        to: VAULT_ADDRESS,
        data: selector + encoded.slice(2),
        nonce: await getNonce(wallet),
      });

      console.log("⏳ Withdraw:", tx2.hash);
      await tx2.wait();
      incNonce(wallet);

      console.log("✅ Cycle complete");
    } catch (err: any) {
      console.log(`❌ Error (${wallet.address}):`, err.message);
      resetNonce(wallet);
    }

    await sleep(8000);
  }
}
