import { ethers } from "hardhat";
const hre = require("hardhat")
import * as dotenv from "dotenv";

dotenv.config();
async function main() {
  await deployMockGCD()
}

async function deployMockGCD() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  const factory = await ethers.getContractFactory("MockGCD")
  const contract = await factory.deploy(
    "GCDMock",
    "GCDMock",
  )
  console.log("Contract deploying to:", contract.address)

  console.log("Waiting for deploy")
  await contract.deployed()
  console.log("Deployed")

  await hre.run("verify:verify", {
    address: contract.address,
    constructorArguments: [
      "GCDMock",
      "GCDMock",
    ]
  })
}

async function deployGCD() {
  const GCD = await ethers.getContractFactory("GCD");
  const BondNFT = await ethers.getContractFactory("BondNFT");
  const Minter = await ethers.getContractFactory("Minter");

  const gcd = await GCD.deploy("GTON USD", "GCD");
  await gcd.deployed();
  console.log("GCD deployed to:", gcd.address);

  const bond = await BondNFT.deploy("GCD Bond", "GCDB");
  await bond.deployed();

  const minter = await Minter.deploy(
    process.env.GTON_ADDRESS || "",
    gcd.address,
    bond.address,
    process.env.ORACLE_PRICE || "",
    process.env.POOL_PROXY || "",
    process.env.APPROVE_ADDRESS || "",
    process.env.DPP_ADDRESS || "",
    process.env.DISCOUNT || "",
    process.env.LOCK_PERIOD || "",
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
