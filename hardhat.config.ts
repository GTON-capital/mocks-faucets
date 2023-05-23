import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@nomiclabs/hardhat-etherscan";

dotenv.config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const {
  ETHERSCAN, 
  POLYGONSCAN, 
  FTMSCAN,
} = process.env;

const accounts =
  process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    goerli: {
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: accounts,
    },
    gton: {
      url: 'https://rpc.gton.network/',
      accounts,
    },
    testGton: {
      url: 'https://testnet.gton.network/',
      accounts,
    },
    bsc: {
      chainId: 56,
      url: 'https://bsc-dataseed.binance.org',

      accounts,
    },
    bscTestnet: {
      chainId: 97,
      url: 'https://bsc-testnet.public.blastapi.io',
      accounts,
    },
    "fantom-testnet": {
      chainId: 4002,
      url: "https://rpc.testnet.fantom.network",
      accounts,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
};

export default config;
