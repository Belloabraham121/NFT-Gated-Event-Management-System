// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.24;


interface  INFT {
    
     function mintNFT(address recipient, string memory tokenURI) external returns (uint256);
     
}