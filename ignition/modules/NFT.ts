import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MyNFTModule = buildModule("MyNFTModule", (m) => {

  const owner = "0x28482B1279E442f49eE76351801232D58f341CB9"
  
  const MyNFT = m.contract("MyNFT", [owner]);

  return { MyNFT };
});

export default MyNFTModule;
