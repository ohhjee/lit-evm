import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import { sleep } from "../utils/sleep";
const RPC = "https://liteforge.rpc.caldera.xyz/http";
const WRAP_CONTRACT = "0x315374aa9b5536037cc1efeea2439ccc0913a77e";

const ABI = ["function deposit() payable", "function withdraw(uint256 amount)"];

console.log("RAW ENV:", process.env.PRIVATE_KEYS);

const rawKeys = process.env.PRIVATE_KEYS || "";

console.log("Raw PRIVATE_KEYS:", JSON.stringify(rawKeys));

const privateKeys = rawKeys
  .split(",") // split by comma
  .map((k) => k.trim()) // remove spaces
  .map((k) => k.replace(/["'\[\]]/g, "")) // remove quotes and brackets if any
  .map((k) => (k.startsWith("0x") ? k : `0x${k}`)) // add 0x if missing
  .filter((k) => /^[0-9a-fA-F]{66}$/.test(k));
console.log("PARSED KEYS:", privateKeys);

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
