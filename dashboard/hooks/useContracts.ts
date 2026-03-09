"use client";

import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { REGISTRY_ABI, TASK_MARKETPLACE_ABI, GOVERNANCE_ABI, REPUTATION_ABI, HAVENCLAW_CONTRACTS } from "../lib/wagmi-config";

// Agent hooks
export function useAgent(agentAddress?: `0x${string}`) {
  const { data: isAgent } = useReadContract({
    address: HAVENCLAW_CONTRACTS.registry,
    abi: REGISTRY_ABI,
    functionName: "isAgent",
    args: agentAddress ? [agentAddress] : undefined,
    query: {
      enabled: !!agentAddress,
    },
  });

  const { data: agentInfo } = useReadContract({
    address: HAVENCLAW_CONTRACTS.registry,
    abi: REGISTRY_ABI,
    functionName: "getAgent",
    args: agentAddress ? [agentAddress] : undefined,
    query: {
      enabled: !!agentAddress,
    },
  });

  return {
    isRegistered: isAgent as boolean | undefined,
    agentInfo: agentInfo ? {
      agentAddress: (agentInfo as any).tbaAddress as `0x${string}`,
      nftTokenId: (agentInfo as any).nftTokenId as bigint,
      metadataUri: (agentInfo as any).metadataUri as string,
      capabilities: (agentInfo as any).capabilities as string[],
      registeredAt: (agentInfo as any).registeredAt as bigint,
      isActive: (agentInfo as any).active as boolean,
    } : undefined,
  };
}

// Reputation hooks
export function useReputation(agentAddress?: `0x${string}`) {
  const { data: reputationInfo } = useReadContract({
    address: HAVENCLAW_CONTRACTS.reputation,
    abi: REPUTATION_ABI,
    functionName: "getReputation",
    args: agentAddress ? [agentAddress] : undefined,
    query: {
      enabled: !!agentAddress,
    },
  });

  return {
    reputation: reputationInfo ? {
      agent: (reputationInfo as any).agent as `0x${string}`,
      score: (reputationInfo as any).score as bigint,
      tasksCompleted: (reputationInfo as any).tasksCompleted as bigint,
      tasksFailed: (reputationInfo as any).tasksFailed as bigint,
      proposalsVoted: (reputationInfo as any).proposalsVoted as bigint,
      correctVotes: (reputationInfo as any).correctVotes as bigint,
      stakedAmount: (reputationInfo as any).stakedAmount as bigint,
      unlockTime: (reputationInfo as any).unlockTime as bigint,
      lastUpdated: (reputationInfo as any).lastUpdated as bigint,
    } : undefined,
  };
}

// Task hooks
export function useOpenTasks() {
  const { data: taskIds } = useReadContract({
    address: HAVENCLAW_CONTRACTS.taskMarketplace,
    abi: TASK_MARKETPLACE_ABI,
    functionName: "getOpenTasks",
  });

  const taskIdsArray = taskIds as bigint[] | undefined;

  // Fetch details for each task
  const tasksCalls = taskIdsArray?.map((taskId) => ({
    address: HAVENCLAW_CONTRACTS.taskMarketplace,
    abi: TASK_MARKETPLACE_ABI,
    functionName: "getTask",
    args: [taskId],
  })) || [];

  const { data: tasksData } = useReadContracts({
    contracts: tasksCalls,
    query: {
      enabled: tasksCalls.length > 0,
    },
  });

  const tasks = tasksData?.map((result, index) => {
    const task = result.result as any;
    return task ? {
      taskId: task.taskId as bigint,
      creator: task.creator as `0x${string}`,
      solver: task.solver as `0x${string}`,
      description: task.description as string,
      requiredCapability: task.requiredCapability as string,
      reward: task.reward as bigint,
      rewardToken: task.rewardToken as `0x${string}`,
      status: task.status as number,
      createdAt: task.createdAt as bigint,
      deadline: task.deadline as bigint,
      resultURI: task.resultURI as string,
      completedAt: task.completedAt as bigint,
    } : null;
  }).filter(Boolean) || [];

  return { tasks };
}

// Governance hooks
export function useActiveProposals() {
  const { data: proposalIds } = useReadContract({
    address: HAVENCLAW_CONTRACTS.governance,
    abi: GOVERNANCE_ABI,
    functionName: "getActiveProposals",
  });

  const proposalIdsArray = proposalIds as bigint[] | undefined;

  const proposalsCalls = proposalIdsArray?.map((proposalId) => ({
    address: HAVENCLAW_CONTRACTS.governance,
    abi: GOVERNANCE_ABI,
    functionName: "getProposal",
    args: [proposalId],
  })) || [];

  const { data: proposalsData } = useReadContracts({
    contracts: proposalsCalls,
    query: {
      enabled: proposalsCalls.length > 0,
    },
  });

  const proposals = proposalsData?.map((result, index) => {
    const proposal = result.result as any;
    return proposal ? {
      proposalId: proposal.proposalId as bigint,
      proposer: proposal.proposer as `0x${string}`,
      description: proposal.description as string,
      metadataURI: proposal.metadataURI as string,
      startBlock: proposal.startBlock as bigint,
      endBlock: proposal.endBlock as bigint,
      forVotes: proposal.forVotes as bigint,
      againstVotes: proposal.againstVotes as bigint,
      abstainVotes: proposal.abstainVotes as bigint,
      state: proposal.state as number,
      createdAt: proposal.createdAt as bigint,
      capabilityHashes: proposal.capabilityHashes as string[],
    } : null;
  }).filter(Boolean) || [];

  return { proposals };
}

// Transaction hooks
export function useRegisterAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const registerAgent = (params: {
    tbaAddress: `0x${string}`;
    nftTokenId: bigint;
    metadataUri: string;
    capabilities: `0x${string}`[]; // bytes32 capability hashes
  }) => {
    writeContract({
      address: HAVENCLAW_CONTRACTS.registry,
      abi: REGISTRY_ABI,
      functionName: "registerAgent",
      args: [
        params.tbaAddress,
        params.nftTokenId,
        params.metadataUri,
        params.capabilities,
      ],
    });
  };

  return {
    registerAgent,
    hash,
    isPending,
    error,
  };
}

export function useAcceptTask() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const acceptTask = (taskId: bigint) => {
    writeContract({
      address: HAVENCLAW_CONTRACTS.taskMarketplace,
      abi: TASK_MARKETPLACE_ABI,
      functionName: "acceptTask",
      args: [taskId],
    });
  };

  return {
    acceptTask,
    hash,
    isPending,
    error,
  };
}

export function useCastVote() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const castVote = (proposalId: bigint, support: number, reason: string) => {
    writeContract({
      address: HAVENCLAW_CONTRACTS.governance,
      abi: GOVERNANCE_ABI,
      functionName: "castVote",
      args: [proposalId, support, reason],
    });
  };

  return {
    castVote,
    hash,
    isPending,
    error,
  };
}

export function useStake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const stake = (amount: bigint, lockPeriod: bigint) => {
    writeContract({
      address: HAVENCLAW_CONTRACTS.reputation,
      abi: REPUTATION_ABI,
      functionName: "stake",
      args: [amount, lockPeriod],
    });
  };

  return {
    stake,
    hash,
    isPending,
    error,
  };
}
