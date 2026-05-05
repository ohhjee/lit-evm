// 0x0b0935e14b72d0d20c477788d7bd70d89632bed5;

import { ethers } from "ethers";

const RPC = "https://liteforge.rpc.caldera.xyz/http";
const WRAP_CONTRACT = "0x8f0ad0Fbc9e7e892Fc951Dfca366c588eeBFf883";

const ABI = ["function deposit() payable", "function withdraw(uint256 amount)"];

export async function wrapZkLTCAddax(amount: string) {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const contract = new ethers.Contract(WRAP_CONTRACT, ABI, wallet);

  const tx = await contract.deposit({
    value: ethers.parseEther(amount),
  });

  console.log("⏳ Wrapping zkLTC → wzkLTC:", tx.hash);

  await tx.wait();

  console.log("✅ Wrapped successfully");
}

// [];

export async function unwrapZkLTCAddax(amount: string) {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const contract = new ethers.Contract(WRAP_CONTRACT, ABI, wallet);

  const tx = await contract.withdraw(ethers.parseEther(amount));

  console.log("⏳ Unwrapping wzkLTC → zkLTC:", tx.hash);

  await tx.wait();

  console.log("✅ Unwrapped successfully");
}
