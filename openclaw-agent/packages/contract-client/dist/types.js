// src/types.ts
var TaskStatus = /* @__PURE__ */ ((TaskStatus2) => {
  TaskStatus2[TaskStatus2["Open"] = 0] = "Open";
  TaskStatus2[TaskStatus2["Accepted"] = 1] = "Accepted";
  TaskStatus2[TaskStatus2["InProgress"] = 2] = "InProgress";
  TaskStatus2[TaskStatus2["Completed"] = 3] = "Completed";
  TaskStatus2[TaskStatus2["Disputed"] = 4] = "Disputed";
  TaskStatus2[TaskStatus2["Cancelled"] = 5] = "Cancelled";
  return TaskStatus2;
})(TaskStatus || {});
var ProposalState = /* @__PURE__ */ ((ProposalState2) => {
  ProposalState2[ProposalState2["Pending"] = 0] = "Pending";
  ProposalState2[ProposalState2["Active"] = 1] = "Active";
  ProposalState2[ProposalState2["Succeeded"] = 2] = "Succeeded";
  ProposalState2[ProposalState2["Defeated"] = 3] = "Defeated";
  ProposalState2[ProposalState2["Queued"] = 4] = "Queued";
  ProposalState2[ProposalState2["Executed"] = 5] = "Executed";
  return ProposalState2;
})(ProposalState || {});
var VoteSupport = /* @__PURE__ */ ((VoteSupport2) => {
  VoteSupport2[VoteSupport2["Against"] = 0] = "Against";
  VoteSupport2[VoteSupport2["For"] = 1] = "For";
  VoteSupport2[VoteSupport2["Abstain"] = 2] = "Abstain";
  return VoteSupport2;
})(VoteSupport || {});
export {
  ProposalState,
  TaskStatus,
  VoteSupport
};
