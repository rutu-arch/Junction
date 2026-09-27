// ============================================================
// JUNCTION - Recommendation -> Approval -> Publish -> Attendee Flow Acceptance Tests
// ============================================================

import { scenarioStore, ApprovedRecommendationItem } from "../src/services/scenarioStore";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("JUNCTION: RECOMMENDATION → APPROVE → PUBLISH → ATTENDEE TESTS");
  console.log("=======================================================\n");

  // TEST 3: Organizer does not publish a recommendation -> No random or invented message
  console.log("Running TEST 3: Initial state without publication...");
  scenarioStore.clearApprovedRecommendations();
  scenarioStore.setActiveScenario("NORMAL");
  const initialRecs = scenarioStore.getApprovedRecommendations();
  const initialLatest = scenarioStore.getLatestApprovedRecommendation();
  assert(initialRecs.length === 0, "No approved recommendations exist initially");
  assert(initialLatest === null, "No latest recommendation exists before publication");
  assert(scenarioStore.isRec1Approved() === false, "isRec1Approved is false initially");

  // TEST 1: Organizer publishes Recommendation A -> Attendee receives exact message
  console.log("\nRunning TEST 1: Organizer publishes Recommendation A...");
  const recA: ApprovedRecommendationItem = {
    id: "REC_A_GATE_2",
    type: "REROUTE_ATTENDEES",
    title: "Route via Gate 2 to Churchgate",
    message: "Please use Gate 2 and proceed toward Churchgate via the designated corridor.",
    action: "Direct Gate 2 egress towards Churchgate station.",
    status: "APPROVED",
    active: true,
    routeId: "BALANCED",
    approvedAt: new Date().toISOString(),
  };
  scenarioStore.approveRecommendation(recA);

  const afterPublishA = scenarioStore.getLatestApprovedRecommendation();
  assert(afterPublishA !== null, "Published recommendation A is retrieved");
  assert(afterPublishA?.id === "REC_A_GATE_2", "Retrieved recommendation ID matches Recommendation A");
  assert(
    afterPublishA?.message === "Please use Gate 2 and proceed toward Churchgate via the designated corridor.",
    "Attendee receives exact message of Recommendation A without mutation"
  );

  // TEST 2 & TEST 6: Organizer publishes Recommendation B -> Automatically changes from A to B and invalidates A
  console.log("\nRunning TEST 2 & TEST 6: Organizer publishes Recommendation B (invalidation & replacement)...");
  const recB: ApprovedRecommendationItem = {
    id: "REC_B_MARINE_LINES",
    type: "TRANSPORT",
    title: "Marine Lines Transit Route",
    message: "Exit through Gate 1 and use the Marine Lines transit route.",
    action: "Divert North stand attendees to Marine Lines station.",
    status: "APPROVED",
    active: true,
    routeId: "FASTEST",
    approvedAt: new Date().toISOString(),
  };
  scenarioStore.approveRecommendation(recB);

  const afterPublishB = scenarioStore.getLatestApprovedRecommendation();
  assert(afterPublishB !== null, "Published recommendation B is retrieved");
  assert(afterPublishB?.id === "REC_B_MARINE_LINES", "Active recommendation switched to Recommendation B");
  assert(
    afterPublishB?.message === "Exit through Gate 1 and use the Marine Lines transit route.",
    "Attendee receives exact message of Recommendation B"
  );
  assert(
    afterPublishB?.message !== "Please use Gate 2 and proceed toward Churchgate via the designated corridor.",
    "Previous Recommendation A message was cleanly replaced"
  );

  // TEST 4: Multiple recommendations exist -> Only the active approved+published recommendation is returned
  console.log("\nRunning TEST 4: Multiple recommendations exist in store...");
  const allApproved = scenarioStore.getApprovedRecommendations();
  assert(allApproved.length === 2, "Both approved interventions are recorded in history");
  assert(
    scenarioStore.getLatestApprovedRecommendation()?.id === "REC_B_MARINE_LINES",
    "Latest active recommendation strictly points to the most recently published item"
  );

  // TEST 5: Refreshing / re-querying after publication still returns latest published recommendation
  console.log("\nRunning TEST 5: Re-querying state (simulating attendee app refresh)...");
  const reloadedLatest = scenarioStore.getLatestApprovedRecommendation();
  assert(reloadedLatest?.id === "REC_B_MARINE_LINES", "Re-querying consistently returns latest published recommendation");
  assert(
    reloadedLatest?.message === "Exit through Gate 1 and use the Marine Lines transit route.",
    "Re-querying consistently preserves exact published text"
  );

  // TEST 7: No hardcoded fallback is returned when published recommendation exists
  console.log("\nRunning TEST 7: Verifying absence of hardcoded fallback...");
  assert(
    reloadedLatest?.message !== "Churchgate pressure is rising. Dadar Station offers a better journey with only 8 minutes extra travel time.",
    "No hardcoded static Dadar string is substituted when custom recommendation is published"
  );

  // TEST 8: Real-time update timestamp and version increment
  console.log("\nRunning TEST 8: Version and timestamp lifecycle for real-time propagation...");
  const v1 = scenarioStore.getScenarioVersion();
  const recC: ApprovedRecommendationItem = {
    id: "REC_C_CUSTOM",
    type: "ACCOMMODATION",
    title: "Zone C Accommodation Allocation",
    message: "Zone C properties near Dadar are open with high vacancy.",
    status: "APPROVED",
    active: true,
    routeId: "BALANCED",
    approvedAt: new Date().toISOString(),
  };
  scenarioStore.approveRecommendation(recC);
  const v2 = scenarioStore.getScenarioVersion();
  assert(v2 > v1, "Scenario version increments on publication to wake up polling listeners");
  assert(
    scenarioStore.getLatestApprovedRecommendation()?.id === "REC_C_CUSTOM",
    "Real-time update targets the newly approved recommendation C"
  );

  console.log("\n=======================================================");
  console.log("✅ ALL 8 RECOMMENDATION → PUBLISH → ATTENDEE TESTS PASSED!");
  console.log("=======================================================\n");
}

runTests().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
