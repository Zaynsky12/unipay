const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const usdcAddress = process.env.USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  const eurcAddress = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

  console.log("Deploying MorphicVault with USDC and EURC support...");

  const MorphicVault = await ethers.getContractFactory("MorphicVault");
  const vault = await MorphicVault.deploy([usdcAddress, eurcAddress]);

  await vault.waitForDeployment();

  const address = await vault.getAddress();
  console.log(`MorphicVault deployed to: ${address}`);
  console.log(`Supported Tokens: USDC (${usdcAddress}), EURC (${eurcAddress})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
