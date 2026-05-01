import { ethers } from "ethers";
import { sleep } from "./utils/sleep";

const RPC = "https://liteforge.rpc.caldera.xyz/http";
export const provider = new ethers.JsonRpcProvider(RPC);

export function createWallet() {
  return new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
}

const VAULT_ADDRESS = "0xA1AB30Dd0B3a6f6d28D0FD0765136D571E19DA55";
const WZK_LTC_ADDRESS = "0x60a84ebc3483fefb251b76aea5b8458026ef4bea";
const SPECIAL_TO = "0x5adf1045c4a7c3e2176dbcbd09a7e6d1b0f75cfb";

const depositIface = new ethers.Interface([
  "function deposit(address asset, address to, uint256 amount) external",
]);

let currentNonce: number | null = null;

async function getNonce(wallet: any) {
  if (currentNonce === null) {
    currentNonce = await provider.getTransactionCount(
      wallet.address,
      "pending",
    );
  }
  return currentNonce;
}

function incNonce() {
  if (currentNonce !== null) currentNonce++;
}

export async function farm(wallet: any) {
  let cycle = 0;

  while (true) {
    cycle++;
    console.log(`\n🔄 Farming Cycle #${cycle}`);

    try {
      const amt = ethers.parseUnits("0.01", 18);

      // SUPPLY
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

      await tx1.wait();
      incNonce();
      console.log("✅ Supply done");

      await sleep(5000);

      // WITHDRAW
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

      await tx2.wait();
      incNonce();
      console.log("✅ Withdraw done");
    } catch (err) {
      console.log("❌ Farming error:", err);
      currentNonce = null;
    }

    await sleep(8000);
  }
}
