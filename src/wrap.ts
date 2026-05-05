import { ethers } from "ethers";
import { RPC, WRAP_CONTRACT } from "./config";

const ABI = ["function deposit() payable"];

export async function wrapZkLTC(amount: string) {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const contract = new ethers.Contract(WRAP_CONTRACT, ABI, wallet);

  const tx = await contract.deposit({
    value: ethers.parseEther(amount),
  });

  console.log("⏳ Wrapping:", tx.hash);
  await tx.wait();
  console.log("✅ Wrapped zkLTC → wzkLTC");
}
