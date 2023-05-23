import { ethers } from "hardhat";
const hre = require("hardhat")
import * as dotenv from "dotenv";

dotenv.config();
async function main() {

  // await deployMockGCD()
}

async function bumpNonce() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  let txData = {
    to: "0x50DF0af8a06f82fCcB0aCb77D8c986785b36d734",
    value: 1
  }

  let desiredNonce = 106
  while (await ethers.provider.getTransactionCount(deployer.address) < desiredNonce) {
    console.log(await ethers.provider.getTransactionCount(deployer.address))
    let tx = await deployer.sendTransaction(txData)
    console.log(tx.hash)
    await tx.wait()
  }
}

async function deployMockGCD() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  const nonce = await ethers.provider.getTransactionCount(deployer.address)
  console.log("Nonce: " + nonce)
  let desiredNonce = 101
  if (nonce != desiredNonce) {
    console.log("Current nonse is wrong, not " + desiredNonce)
    return
  }

  const factory = await ethers.getContractFactory("MockGCD")
  const contract = await factory.deploy(
    "GCDMock",
    "GCDMock",
  )
  console.log("Contract deploying to:", contract.address)

  console.log("Waiting for deploy")
  await contract.deployed()
  console.log("Deployed")

  await delay(20000)
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

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
