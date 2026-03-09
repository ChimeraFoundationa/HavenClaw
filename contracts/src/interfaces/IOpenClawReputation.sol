// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IOpenClawReputation {
    struct AgentRepInfo {
        address agent;
        uint256 score;
        uint256 tasksCompleted;
        uint256 tasksFailed;
        uint256 proposalsVoted;
        uint256 correctVotes;
        uint256 stakedAmount;
        uint256 unlockTime;
        uint256 lastUpdated;
    }

    struct StakeInfo {
        address staker;
        uint256 amount;
        uint256 lockPeriod;
        uint256 stakedAt;
        uint256 unlockTime;
        bool active;
    }

    event ReputationUpdated(address indexed agent, int256 scoreChange, uint256 newScore, string reason);
    event TokensStaked(address indexed staker, uint256 amount, uint256 lockPeriod, uint256 unlockTime);
    event TokensUnstaked(address indexed staker, uint256 amount, uint256 newStake);
    event SlashExecuted(address indexed agent, uint256 amount, string reason);

    function getReputation(address agent) external view returns (AgentRepInfo memory);
    function updateReputation(address agent, int256 scoreChange, string calldata reason) external;
    function stake(uint256 amount, uint256 lockPeriod) external;
    function unstake(uint256 amount) external;
    function slash(address agent, uint256 amount, string calldata reason) external;
    function getStake(address staker) external view returns (StakeInfo memory);
    function getVotingPower(address agent) external view returns (uint256);
}
