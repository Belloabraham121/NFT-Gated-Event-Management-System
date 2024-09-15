import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe ("NFTGatedEvent", function(){
  async function deployNFTGatedEventFixture() {
    const [owner, signer1, signer2, signer3] = await ethers.getSigners();
    
    // Pass the NFT contract name
    const NFT = await ethers.getContractFactory("MyNFT");
    // Deploy the NFT passing owner.address as the contract owner 
    const nft = await NFT.deploy(owner.address);
    
    // Pass the contract name
    const NFTGatedEvent = await ethers.getContractFactory("NFTGatedEvent");

    // Deploy the contract passing the NFT contract address
    const nftGatedEvent = await NFTGatedEvent.deploy(nft);
    return { nftGatedEvent, nft, owner, signer1, signer2, signer3};
  }

  describe ("Minting", function() {

    it("Should have the correct name and symbol", async function () {
      const { nft} = await loadFixture(deployNFTGatedEventFixture);

      // Checking the name and symbol of the NFT
      expect(await nft.name()).to.equal("MyNFT");
      expect(await nft.symbol()).to.equal("NFT");
    });

    
    it("Should mint a new NFT", async function () {
      const { nft, signer1} = await loadFixture(deployNFTGatedEventFixture);

      // Passing the tokenURI
      const tokenURI = "https://example.com/token/1";
      await expect(nft.mintNFT(signer1.address, tokenURI))
      .to.emit(nft, "Transfer")
      .withArgs(ethers.ZeroAddress, signer1.address, 1);
       
      expect(await nft.ownerOf(1)).to.equal(signer1.address);
      expect(await nft.tokenURI(1)).to.equal(tokenURI);
    })
  })

  describe ("Event Creation", function() {

    it("Should set the NFT contract address", async function () {
      const { nft, nftGatedEvent} = await loadFixture(deployNFTGatedEventFixture);

      const nftContractAddress = await nftGatedEvent.nftContract();
      expect(nftContractAddress).to.equal(await nft.getAddress());      
    });

    it("Should revert if address zero is detected", async function () {
      const { nftGatedEvent, owner } = await loadFixture(deployNFTGatedEventFixture);
      
      // Create a fake signer with address zero
      const zeroAddressSigner = await ethers.getImpersonatedSigner(ethers.ZeroAddress);
      
      // Fund the zero address signer
      await owner.sendTransaction({
        to: ethers.ZeroAddress,
        value: ethers.parseEther("1.0")  // Send 1 ETH
      });

      // Attempt to call testZeroAddressCheck from the zero address
      await expect(nftGatedEvent.connect(zeroAddressSigner).testZeroAddressCheck())
        .to.be.revertedWith("address zero found");
    });

    it("Should revert if title is empty", async function() {
      const { nftGatedEvent, owner } = await loadFixture(deployNFTGatedEventFixture);
      const emptyTitle = "";
      const location = "Test Location";
      const closeDate = Math.floor(Date.now() / 1000) + 3600;

      await expect(nftGatedEvent.connect(owner).createEvent(emptyTitle, location, closeDate))
        .to.be.revertedWith("Title cannot be empty");
    });

    it("Should revert if location is empty", async function() {
      const { nftGatedEvent, owner } = await loadFixture(deployNFTGatedEventFixture);
      const title = "Test Event";
      const emptyLocation = "";
      const closeDate = Math.floor(Date.now() / 1000) + 3600;

      await expect(nftGatedEvent.connect(owner).createEvent(title, emptyLocation, closeDate))
        .to.be.revertedWith("Location cannot be empty");
    });

    it("Should revert if close date is not provided", async function() {
      const { nftGatedEvent, owner } = await loadFixture(deployNFTGatedEventFixture);
      const title = "Test Event";
      const location = "Test Location";
      const invalidCloseDate = 0;

      await expect(nftGatedEvent.connect(owner).createEvent(title, location, invalidCloseDate))
        .to.be.revertedWith("Input close date");
    });

    it("Should be able to create event", async function() {
      const { nftGatedEvent, owner } = await loadFixture(deployNFTGatedEventFixture);
      const title = "Test Event";
      const location = "Test Location";
      const invalidCloseDate =  Math.floor(Date.now() / 1000) + 3600;

      await expect(nftGatedEvent.connect(owner).createEvent(title, location, invalidCloseDate))
      .to.emit(nftGatedEvent, "EventCreated")
      .withArgs(1, title, location, invalidCloseDate)
    });
    
  })

  describe ("Register Event", function () {

    it("Should revert when registering for an event with ID 0", async function() {
      const { nftGatedEvent, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      await expect(nftGatedEvent.connect(signer1).registerForEvent(0))
        .to.be.revertedWith("Invalid event ID");
    });

    it("Should revert when registering for an event with ID greater than eventCount", async function() {
      const { nftGatedEvent, owner, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      // First, create an event to increment the eventCount
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
      
      // Try to register for an event with ID 2 (which doesn't exist yet)
      await expect(nftGatedEvent.connect(signer1).registerForEvent(2))
        .to.be.revertedWith("Invalid event ID");
    });

    it("Should revert when registering after the close date", async function() {
      const { nftGatedEvent, nft, owner, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      // Get the current block timestamp
      const currentTimestamp = await time.latest();
      
      // Set close date to 1 hour from now
      const closeDate = currentTimestamp + 3600;
      
      // Create an event
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", closeDate);
      
      // Mint an NFT for signer1
      await nft.connect(signer1).mintNFT(signer1.address, "https://example.com/token/1");
      
      // Set the next block timestamp to 1 second after the close date
      await time.setNextBlockTimestamp(closeDate + 1);
      
      // Try to register
      await expect(nftGatedEvent.connect(signer1).registerForEvent(1))
        .to.be.revertedWith("Event registration closed");

    })

    it("Should revert when trying to register twice", async function() {
      const { nftGatedEvent, nft, owner, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      // Create an event
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
      
      // Mint an NFT for signer1
      await nft.connect(owner).mintNFT(signer1.address, "https://example.com/token/1");
      
      // Register for the event
      await nftGatedEvent.connect(signer1).registerForEvent(1);
      
      // Try to register again
      await expect(nftGatedEvent.connect(signer1).registerForEvent(1))
        .to.be.revertedWith("Already registered");
    });

    it("Should revert if user doesn't NFT", async function() {
      const { nftGatedEvent,signer1, owner, nft } = await loadFixture(deployNFTGatedEventFixture);

      // Create an event
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
          
      
      // signer1 (who doesn't own an NFT) tries to register for the event
      await expect(nftGatedEvent.connect(signer1).registerForEvent(1))
        .to.be.revertedWith("Must own an NFT to register");
    });

    it("Should allow registration after acquiring an NFT", async function() {
      const { nftGatedEvent, nft, owner, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      // Create an event
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);

      // User2 tries to register without an NFT (should fail)
      await expect(nftGatedEvent.connect(signer1).registerForEvent(1))
        .to.be.revertedWith("Must own an NFT to register");
      
      // Mint an NFT for user2
      await nft.connect(signer1).mintNFT(signer1.address, "https://example.com/token/2");
      
      // User2 tries to register again (should succeed now)
      await expect(nftGatedEvent.connect(signer1).registerForEvent(1))
        .to.not.be.reverted;
    });

    it("Should be able to register", async function() {
      const { nftGatedEvent,signer1, owner, nft } = await loadFixture(deployNFTGatedEventFixture);

      // Create an event
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
        
       // Mint an NFT for signer1
       await nft.connect(owner).mintNFT(signer1.address, "https://example.com/token/1");
      
      
      // signer1 registers for the event
      await expect(nftGatedEvent.connect(signer1).registerForEvent(1))
    });

  })

  describe("Registered Users", function () {

    it("Should revert when registering for an event with ID 0", async function() {
      const { nftGatedEvent, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      await expect(nftGatedEvent.connect(signer1).registerForEvent(0))
        .to.be.revertedWith("Invalid event ID");
    });

    it("Should revert when registering for an event with ID greater than eventCount", async function() {
      const { nftGatedEvent, owner, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      // First, create an event to increment the eventCount
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
      
      // Try to register for an event with ID 2 (which doesn't exist yet)
      await expect(nftGatedEvent.connect(signer1).registerForEvent(2))
        .to.be.revertedWith("Invalid event ID");
    });

    it("Should check users registered for the event", async function() {
      it("Should correctly check user registration status", async function() {
        const { nftGatedEvent, nft, owner, signer1, signer2 } = await loadFixture(deployNFTGatedEventFixture);
        
        // Create an event
        await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
        
        // Mint NFTs for signer1 and signer2
        await nft.connect(owner).mintNFT(signer1.address, "https://example.com/token/1");
        
        // Check initial registration status (should be false for both)
        expect(await nftGatedEvent.isRegistered(1, signer1.address)).to.be.false;
        
        // signer1 registers for the event
        await nftGatedEvent.connect(signer1).registerForEvent(1);
        
        // Check registration status after signer1 registers
        expect(await nftGatedEvent.isRegistered(1, signer1.address)).to.be.true;
        
        // signer2 registers for the event
        await nftGatedEvent.connect(signer2).registerForEvent(1);
        
        // Check registration status after both register
        expect(await nftGatedEvent.isRegistered(1, signer1.address)).to.be.true;
      });
    });
  })

  describe("Get Event Details", function(){
    it("Should revert when registering for an event with ID 0", async function() {
      const { nftGatedEvent, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      await expect(nftGatedEvent.connect(signer1).getEventDetails(0))
        .to.be.revertedWith("Invalid event ID");
    });

    it("Should revert when registering for an event with ID greater than eventCount", async function() {
      const { nftGatedEvent, owner, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      // First, create an event to increment the eventCount
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
      
      // Try to register for an event with ID 2 (which doesn't exist yet)
      await expect(nftGatedEvent.connect(signer1).getEventDetails(2))
        .to.be.revertedWith("Invalid event ID");
    });

    it("Should get event details",async function(){
      const { nftGatedEvent, owner, signer1, nft } = await loadFixture(deployNFTGatedEventFixture);

      // Create an event
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
        
      // Mint an NFT for signer1
      await nft.connect(owner).mintNFT(signer1.address, "https://example.com/token/1");
      
      
      // signer1 registers for the event
      await expect(nftGatedEvent.connect(signer1).registerForEvent(1))

      await expect(nftGatedEvent.connect(signer1).cancelRegistration(1))
    })

  })

  describe ("Cancel Registration", function(){

    it("Should revert when registering for an event with ID 0", async function() {
      const { nftGatedEvent, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      await expect(nftGatedEvent.connect(signer1).cancelRegistration(0))
        .to.be.revertedWith("Invalid event ID");
    });

    it("Should revert when registering for an event with ID greater than eventCount", async function() {
      const { nftGatedEvent, owner, signer1 } = await loadFixture(deployNFTGatedEventFixture);
      
      // First, create an event to increment the eventCount
      await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
      
      // Try to register for an event with ID 2 (which doesn't exist yet)
      await expect(nftGatedEvent.connect(signer1).cancelRegistration(2))
        .to.be.revertedWith("Invalid event ID");
    });


    it("Should cancel event registration", async function() {
    const { nftGatedEvent, owner, signer1, nft } = await loadFixture(deployNFTGatedEventFixture);
  
    // Create an event
    await nftGatedEvent.connect(owner).createEvent("Test Event", "Test Location", Math.floor(Date.now() / 1000) + 3600);
    
    // Mint an NFT for signer1
    await nft.connect(owner).mintNFT(signer1.address, "https://example.com/token/1");
    
    // signer1 registers for the event
    await nftGatedEvent.connect(signer1).registerForEvent(1);
    
    // Verify signer1 is registered
    expect(await nftGatedEvent.isRegistered(1, signer1.address)).to.be.true;
    
    // Cancel registration
    await expect(nftGatedEvent.connect(signer1).cancelRegistration(1))
      .to.emit(nftGatedEvent, "UserRegistrationCancelled")
      .withArgs(1, signer1.address);
    
    // Verify signer1 is no longer registered
    expect(await nftGatedEvent.isRegistered(1, signer1.address)).to.be.false;
    
    // Attempt to cancel registration again (should fail)
    await expect(nftGatedEvent.connect(signer1).cancelRegistration(1))
      .to.be.revertedWith("Not registered for this event");
    });
  });
})