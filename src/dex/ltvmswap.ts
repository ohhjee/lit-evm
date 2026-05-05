import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import { sleep } from "../utils/sleep";
const RPC = "https://liteforge.rpc.caldera.xyz/http";
const WRAP_CONTRACT = "0x315374aa9b5536037cc1efeea2439ccc0913a77e";

const ABI = ["function deposit() payable", "function withdraw(uint256 amount)"];

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

const provider = new ethers.JsonRpcProvider(RPC);
export async function wrapZkLTC(amount: string) {
  for (const key of privateKeys) {
    try {
      const wallet = new ethers.Wallet(key.trim(), provider);
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

    await sleep(5000);
  }
}

// [];

export async function unwrapZkLTC(amount: string) {
  for (const key of privateKeys) {
    try {
      const wallet = new ethers.Wallet(key.trim(), provider);
      const contract = new ethers.Contract(WRAP_CONTRACT, ABI, wallet);

      console.log(`\n💧 Wallet: ${wallet.address}`);

      const tx = await contract.withdraw(ethers.parseEther(amount));

      console.log("⏳ Unwrapping:", tx.hash);

      await tx.wait();

      console.log("✅ Unwrapped successfully");
    } catch (err: any) {
      console.error("❌ Unwrap failed:", err.message);
    }

    await sleep(5000);
  }
}
