// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {BALToken} from "./BALToken.sol";

contract ElectionDapp is Ownable {
    error ElectionNotActive();
    error ElectionNotEnded();
    error ElectionWindowInvalid();
    error AlreadyVoted();
    error CandidateNotFound();
    error CandidateLimitReached();
    error VoterNotInBook();
    error NoVotesForCandidate();

    uint256 public constant QUESTION_COUNT = 3;
    uint256 public constant REWARD_PER_VOTE = 10 ether;
    uint256 public constant MAX_CANDIDATES = 100;

    struct Candidate {
        string name;
        int8[3] positions;
        uint256 votes;
        bool exists;
    }

    struct VoteRecord {
        bool voted;
        uint256 candidateId;
        int256 distance;
    }

    BALToken public immutable balToken;
    bytes32 public voterMerkleRoot;
    uint256 public electionStart;
    uint256 public electionEnd;

    uint256 public candidateCount;

    mapping(uint256 => Candidate) public candidates;
    mapping(address => VoteRecord) public voteRecords;
    mapping(uint256 => address[]) private candidateVoters;

    event CandidateAdded(uint256 indexed candidateId, string name, int8[3] positions);
    event VoterBookPrepared(bytes32 indexed merkleRoot);
    event ElectionScheduled(uint256 startTime, uint256 endTime);
    event VoteCast(address indexed voter);

    constructor(address admin) Ownable(admin) {
        balToken = new BALToken(address(this));
    }

    function addCandidate(string calldata name, int8[3] calldata positions) external onlyOwner {
        if (candidateCount >= MAX_CANDIDATES) revert CandidateLimitReached();
        candidateCount += 1;
        candidates[candidateCount] = Candidate({
            name: name,
            positions: positions,
            votes: 0,
            exists: true
        });
        emit CandidateAdded(candidateCount, name, positions);
    }

    function prepareVoterBook(bytes32 merkleRoot) external onlyOwner {
        voterMerkleRoot = merkleRoot;
        emit VoterBookPrepared(merkleRoot);
    }

    function scheduleElection(uint256 startTime, uint256 endTime) external onlyOwner {
        if (startTime <= block.timestamp || endTime <= startTime) revert ElectionWindowInvalid();
        electionStart = startTime;
        electionEnd = endTime;
        emit ElectionScheduled(startTime, endTime);
    }

    function voteForCandidate(uint256 candidateId, bytes32[] calldata proof) external {
        _enforceVotingEligibility(msg.sender, proof);
        _recordVote(msg.sender, candidateId, 0);
    }

    function voteByQuestionnaire(int8[3] calldata voterPositions, bytes32[] calldata proof) external {
        _enforceVotingEligibility(msg.sender, proof);

        uint256 selectedCandidateId = _closestCandidate(voterPositions);
        int256 distance = _distance(voterPositions, candidates[selectedCandidateId].positions);
        _recordVote(msg.sender, selectedCandidateId, distance);
        // Intentionally no return value to keep the selection opaque to the voter at UX level.
    }

    function getResultsSorted() external view returns (uint256[] memory ids, uint256[] memory voteCounts) {
        if (block.timestamp < electionEnd || electionEnd == 0) revert ElectionNotEnded();

        ids = new uint256[](candidateCount);
        voteCounts = new uint256[](candidateCount);

        for (uint256 i = 0; i < candidateCount; i++) {
            ids[i] = i + 1;
            voteCounts[i] = candidates[i + 1].votes;
        }

        for (uint256 i = 0; i < candidateCount; i++) {
            for (uint256 j = i + 1; j < candidateCount; j++) {
                if (voteCounts[j] > voteCounts[i]) {
                    (voteCounts[i], voteCounts[j]) = (voteCounts[j], voteCounts[i]);
                    (ids[i], ids[j]) = (ids[j], ids[i]);
                }
            }
        }
    }

    function sampleAnonymousVoterForCandidate(uint256 candidateId, uint256 seed)
        external
        view
        onlyOwner
        returns (bytes32 anonymousId)
    {
        if (!candidates[candidateId].exists) revert CandidateNotFound();

        address[] memory voters = candidateVoters[candidateId];
        if (voters.length == 0) revert NoVotesForCandidate();

        uint256 closestIndex = 0;
        int256 bestDistance = voteRecords[voters[0]].distance;

        for (uint256 i = 1; i < voters.length; i++) {
            int256 d = voteRecords[voters[i]].distance;
            if (d < bestDistance) {
                bestDistance = d;
                closestIndex = i;
            }
        }

        return keccak256(abi.encodePacked(voters[closestIndex], seed));
    }

    function _enforceVotingEligibility(address voter, bytes32[] calldata proof) internal view {
        if (voteRecords[voter].voted) revert AlreadyVoted();
        if (block.timestamp < electionStart || block.timestamp >= electionEnd) revert ElectionNotActive();

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(voter))));
        if (!MerkleProof.verify(proof, voterMerkleRoot, leaf)) revert VoterNotInBook();
    }

    function _recordVote(address voter, uint256 candidateId, int256 distance) internal {
        if (!candidates[candidateId].exists) revert CandidateNotFound();

        candidates[candidateId].votes += 1;
        voteRecords[voter] = VoteRecord({voted: true, candidateId: candidateId, distance: distance});
        candidateVoters[candidateId].push(voter);

        balToken.mint(voter, REWARD_PER_VOTE);
        emit VoteCast(voter);
    }

    function _closestCandidate(int8[3] calldata voterPositions) internal view returns (uint256 bestId) {
        if (candidateCount == 0) revert CandidateNotFound();

        bestId = 1;
        int256 bestDist = _distance(voterPositions, candidates[1].positions);

        for (uint256 i = 2; i <= candidateCount; i++) {
            int256 d = _distance(voterPositions, candidates[i].positions);
            if (d < bestDist) {
                bestDist = d;
                bestId = i;
            }
        }
    }

    function _distance(int8[3] calldata a, int8[3] memory b) internal pure returns (int256) {
        int256 total = 0;
        for (uint256 i = 0; i < QUESTION_COUNT; i++) {
            int256 delta = int256(a[i]) - int256(b[i]);
            total += delta >= 0 ? delta : -delta;
        }
        return total;
    }
}
