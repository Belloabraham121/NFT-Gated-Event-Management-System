import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const NFTGatedEventModule = buildModule("NFTGatedEventModule", (m) => {

  const NFT = "0xa768FDaa867782f2f0E61b61F01BB4742B219F8E"
  
  const NFTGatedEvent = m.contract("NFTGatedEvent", [NFT]);

  return { NFTGatedEvent };
});

export default NFTGatedEventModule;
