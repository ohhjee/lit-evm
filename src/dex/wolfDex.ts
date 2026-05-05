import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import { sleep } from "../utils/sleep";

const RPC = "https://liteforge.rpc.caldera.xyz/http";
const WRAP_CONTRACT = "0x4fd3765cde8d1d2be4edbaa03940afc56794c304";

const ABI = ["function deposit() payable", "function withdraw(uint256 amount)"];

const provider = new ethers.JsonRpcProvider(RPC);

// 🔐 Parse + sanitize + validate keys safely
const rawKeys = (process.env.PRIVATE_KEYS ?? "")
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);

const privateKeys: string[] = [];

for (let key of rawKeys) {
  // remove anything not hex
  key = key.replace(/[^0-9a-fA-F]/g, "");

  // ensure 0x prefix
  if (key.length === 64) key = "0x" + key;

  const wallet = new ethers.Wallet(key);
  try {
    console.log("✅ VALID KEY:", wallet.address);
    privateKeys.push(key);
  } catch {
    console.log("❌ INVALID KEY SKIPPED:", wallet.address);
  }
}

if (privateKeys.length === 0) {
  throw new Error("❌ No valid private keys found");
}

// ============================
// 🔁 WRAP FUNCTION
// ============================
export async function wrapZkLTCWolf(amount: string) {
  for (const key of privateKeys) {
    try {
      const wallet = new ethers.Wallet(key, provider);
      const contract = new ethers.Contract(WRAP_CONTRACT, ABI, wallet);

      console.log(`\n💧 Wallet: ${wallet.address}`);

      const tx = await contract.deposit({
        value: ethers.parseEther(amount),
      });

      console.log("⏳ Wrapping:", tx.hash);

      await tx.wait();

      console.log("✅ Wrapped successfully");
    } catch (err: any) {
      console.error("❌ Wrap failed:", err.message);
    }

    await sleep(5000); // delay between wallets
  }
}

// ============================
// 🔁 UNWRAP FUNCTION
// ============================
export async function unwrapZkLTCWolf(amount: string) {
  for (const key of privateKeys) {
    try {
      const wallet = new ethers.Wallet(key, provider);
      const contract = new ethers.Contract(WRAP_CONTRACT, ABI, wallet);

      console.log(`\n💧 Wallet: ${wallet.address}`);

      const tx = await contract.withdraw(ethers.parseEther(amount));

      console.log("⏳ Unwrapping:", tx.hash);

      await tx.wait();

      console.log("✅ Unwrapped successfully");
    } catch (err: any) {
      console.error("❌ Unwrap failed:", err.message);
    }

    await sleep(5000); // delay between wallets
  }
}
