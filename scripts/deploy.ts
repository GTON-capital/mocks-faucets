import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();
async function main() {
  const GCD = await ethers.getContractFactory("GCD");
  const BondNFT = await ethers.getContractFactory("BondNFT");
  const Minter = await ethers.getContractFactory("Minter");

  const gcd = await GCD.deploy("GTON USD", "GCD");
  await gcd.deployed();
  const bond = await BondNFT.deploy("GCD Bond", "GCDB");
  await bond.deployed();

  const minter = await Minter.deploy(
    process.env.GTON_ADDRESS || "",
    gcd.address,
    bond.address,
    process.env.ORACLE_PRICE || "",
    process.env.POOL_ADDRESS || "",
    process.env.DISCOUNT || ""
  );

  await minter.deployed();

  await bond.transferOwnership(minter.address);
  await gcd.transferOwnership(minter.address);

  console.log("GCD deployed to:", gcd.address);
  console.log("Bond deployed to:", bond.address);
  console.log("Minter deployed to:", minter.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
