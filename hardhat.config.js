require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.9",
  networks: {
    hardhat: {
      // Hardhat local network
      chainId: 5, // Force the ChainID to be 5 (Goerli)
      forking: {
        url: process.env.INFURA_GOERLI_API_URL,
      },
    },
    ropsten: {
      url: process.env.INFURA_GOERLI_API_URL,
      accounts: { mnemonic: process.env.MNEMONIC },
    },
  },
};
