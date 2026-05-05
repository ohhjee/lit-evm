import { ethers } from "ethers";
import { RPC, ROUTER, INTERMEDIATE } from "./config";

// custom router ABI (from your tx)
const ABI = [
  "function swap(address tokenIn,uint256 amountIn,uint256 minOut,address to,bytes path) payable returns (uint256)",
];

export async function swapZkToBrBNB(amount: string) {
  const provider = new ethers.JsonRpcProvider(RPC);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  const contract = new ethers.Contract(ROUTER, ABI, wallet);

  const amountIn = ethers.parseEther(amount);

  // extracted path (WORKING)
  const path =
    "0x370301ffff020101315374aa9b5536037cc1efeea2439ccc0913a77e01ffff0058344687cbda54dece66cb30201666d25bec335100000bb8000000000000000000";

  const tx = await contract.swap(
    INTERMEDIATE,
    amountIn,
    0n, // ⚠️ no slippage protection yet
    wallet.address,
    path,
    {
      value: amountIn,
    },
  );

  console.log("⏳ Swap:", tx.hash);
  await tx.wait();
  console.log("✅ Swapped → brBNB");
}
