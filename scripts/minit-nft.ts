import { ethers } from "hardhat";

async function main() {
    const nftContractAddress = "0xa768FDaa867782f2f0E61b61F01BB4742B219F8E";
    const NFT = await ethers.getContractAt("INFT", nftContractAddress);

    const tokenUri = "https://gateway.pinata.cloud/ipfs/QmT9QsKbrQG3TTQndmqZwHYE9eED7fFB9oQsYzsF22o4R4"

    const recipient = "0x28482B1279E442f49eE76351801232D58f341CB9";
    const nftTx = await NFT.mintNFT(recipient, tokenUri)
    console.log("NFT Minted ::", nftTx);
    nftTx.wait();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

// require('dotenv').config();
// const ethers = require('ethers');

// // Get Alchemy App URL
// const API_KEY = process.env.API_KEY;

// // Define an Alchemy Provider
// const provider = ["https://rpc.sepolia-api.lisk.com", "https://sepolia-blockscout.lisk.com/api"]

// // Get contract ABI file
// const contract = require("../artifacts/contracts/NFT.sol/MyNFT.json");

// // Create a signer
// const privateKey = process.env.ACCOUNT_PRIVATE_KEY
// const signer = new ethers.Wallet(privateKey, provider)

// // Get contract ABI and address
// const abi = contract.abi
// const contractAddress = '0xa768FDaa867782f2f0E61b61F01BB4742B219F8E'

// // Create a contract instance
// const myNftContract = new ethers.Contract(contractAddress, abi, signer)

// // Get the NFT Metadata IPFS URL
// const tokenUri = "https://gateway.pinata.cloud/ipfs/QmT9QsKbrQG3TTQndmqZwHYE9eED7fFB9oQsYzsF22o4R4"

// // Call mintNFT function
// const mintNFT = async () => {
//     let nftTxn = await myNftContract.mintNFT(signer.address, tokenUri)
//     await nftTxn.wait()
//     console.log(`NFT Minted! Check it out at :::`, nftTxn)
// }

// mintNFT()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });