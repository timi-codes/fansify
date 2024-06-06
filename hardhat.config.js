require('@nomicfoundation/hardhat-toolbox');
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const INFURA_RPC_URL= process.env.ETHEREUM_RPC_URL;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.24',
  networks: {
    // development: {
    //   url: 'http://localhost:8545',
    // },
    // sepolia: {
    //   url: `${INFURA_RPC_URL}`,
    //   accounts: [PRIVATE_KEY]
    // }
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};
