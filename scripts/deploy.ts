import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const usdcAddress = process.env.USDC_ADDRESS;
  if (!usdcAddress) {
    throw new Error("USDC_ADDRESS not set in .env");
  }

  console.log("Deploying MorphicVault...");

  const MorphicVault = await ethers.getContractFactory("MorphicVault");
  const vault = await MorphicVault.deploy(usdcAddress);

  await vault.waitForDeployment();

  console.log(`MorphicVault deployed to: ${await vault.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
