
require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

const MNEMONIC = process.env.MNEMONIC;
const INFURA_RPC_URL= process.env.ETHEREUM_RPC_URL;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.24',
  networks: {
    sepolia: {
      url: `${INFURA_RPC_URL}`,
      accounts: {
        mnemonic: `${MNEMONIC}`,
        path: "m/44'/60'/0'/0",
          initialIndex: 0,
          count: 20,
          passphrase: "",
        },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};
