const { expect } = require("chai");
const { ethers } = require("hardhat");

function hashLeaf(address) {
  return ethers.keccak256(ethers.solidityPacked(["bytes32"], [ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address"], [address]))]));
}

function hashPair(a, b) {
  return a.toLowerCase() < b.toLowerCase()
    ? ethers.keccak256(ethers.concat([a, b]))
    : ethers.keccak256(ethers.concat([b, a]));
}

function makeMerkle(leaves) {
  const layer1 = leaves.map(hashLeaf);
  if (layer1.length === 1) return { root: layer1[0], proofs: [[ ]] };

  const root = hashPair(layer1[0], layer1[1]);
  return {
    root,
    proofs: [ [layer1[1]], [layer1[0]] ]
  };
}

describe("ElectionDapp", function () {
  it("supports direct + questionnaire voting and rewards BAL", async function () {
    const [admin, voter1, voter2] = await ethers.getSigners();
    const Election = await ethers.getContractFactory("ElectionDapp");
    const election = await Election.deploy(admin.address);

    await election.addCandidate("Alice", [1, 1, 1]);
    await election.addCandidate("Bob", [8, 8, 8]);

    const merkle = makeMerkle([voter1.address, voter2.address]);
    await election.prepareVoterBook(merkle.root);

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await election.scheduleElection(now + 10, now + 1000);

    await ethers.provider.send("evm_increaseTime", [11]);
    await ethers.provider.send("evm_mine", []);

    await election.connect(voter1).voteForCandidate(1, merkle.proofs[0]);
    await election.connect(voter2).voteByQuestionnaire([9, 9, 9], merkle.proofs[1]);

    expect(await election.candidateCount()).to.equal(2);
    expect((await election.candidates(1)).votes).to.equal(1);
    expect((await election.candidates(2)).votes).to.equal(1);

    const tokenAddress = await election.balToken();
    const token = await ethers.getContractAt("BALToken", tokenAddress);
    expect(await token.balanceOf(voter1.address)).to.equal(ethers.parseEther("10"));
    expect(await token.balanceOf(voter2.address)).to.equal(ethers.parseEther("10"));
  });

  it("returns results sorted after election end", async function () {
    const [admin, voter1, voter2] = await ethers.getSigners();
    const Election = await ethers.getContractFactory("ElectionDapp");
    const election = await Election.deploy(admin.address);

    await election.addCandidate("Alice", [1, 1, 1]);
    await election.addCandidate("Bob", [8, 8, 8]);

    const merkle = makeMerkle([voter1.address, voter2.address]);
    await election.prepareVoterBook(merkle.root);

    const now = (await ethers.provider.getBlock("latest")).timestamp;
    await election.scheduleElection(now + 1, now + 20);

    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine", []);

    await election.connect(voter1).voteForCandidate(1, merkle.proofs[0]);
    await election.connect(voter2).voteForCandidate(1, merkle.proofs[1]);

    await ethers.provider.send("evm_increaseTime", [30]);
    await ethers.provider.send("evm_mine", []);

    const results = await election.getResultsSorted();
    expect(results.ids[0]).to.equal(1n);
    expect(results.voteCounts[0]).to.equal(2n);
  });
});
