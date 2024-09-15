import { ethers } from "hardhat";

async function main() {

    const [owner, signer1, signer2] = await ethers.getSigners()

    // Set NFT address and get the interface
    const NFTAddress = "0xE15fF589A2a0b91aDACc4650e14a59c981A61F41";
    const NFT = await ethers.getContractAt("IERC20", NFTAddress);

    // Set multisig factory address and get the interface
    const MultisigFactoryContractAddress = "0x2F571f303b437Dc695E59b286b60d4197185250a";
    const Multisig = await ethers.getContractAt("IMultisigFactory", MultisigFactoryContractAddress);

    
    // Set the qurom and the valid signers
    const quorum = 2;
    const validSigners = [owner, signer1, signer2]

    // Deploy the multisig clones, set the quorum and valid signers
    const deployMultisigClones = await Multisig.createMultisigWallet(quorum, validSigners );
    deployMultisigClones.wait()
    
    const getClones = await Multisig.getMultiSigClones()


    const getFirstClones=  await getClones[0];
    console.log("Get first clone ::", getFirstClones);

    const multisig = await ethers.getContractAt("IMultisig", getFirstClones)


    const transferToken = await token.transfer(multisig, ethers.parseUnits("1000", 18))
    transferToken.wait()
    
    const transfarAmount = ethers.parseUnits("10",18)
    const transferTx = await multisig.transfer(transfarAmount, signer2, token);
    transferTx.wait();
    

    await multisig.connect(signer1).approveTx(7)
    
    const recipientBalance = await token.balanceOf(signer1);
    console.log("Check recipient balance after approving transfer ::", recipientBalance);
    
    const newQurom = 2
    const Qurom = await multisig.updateNewQuorum(newQurom);
    Qurom.wait()
    console.log("New quorum ::", Qurom);


    const approveQurom = await multisig.connect(signer1).approveNewQuorum(4);
    console.log("Approve qurom update ::", approveQurom);
    

    

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});