// ============================================================
// JUNCTION - Human-in-the-Loop Recommendation Approval Endpoint
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { recommendationLifecycleEngine } from "@/services/recommendationLifecycleEngine";
import { persistenceService } from "@/services/persistenceService";
import { getCurrentProfile } from "@/services/authService";
import { MOCK_RECOMMENDATIONS } from "@/data/mockRecommendations";
import { scenarioStore, ApprovedRecommendationItem } from "@/services/scenarioStore";
import { OperationalIntervention } from "@/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const profile = await getCurrentProfile("ORGANIZER");

    const actorId = profile?.clerkUserId || body.actorId || "ORGANIZER_OPERATOR";
    const actorRole = profile?.role === "RESTAURANT_PARTNER" ? "PARTNER" : "ORGANIZER";

    console.log(`[ORGANIZER] approved recommendation: ${id}`);

    // Look up in body, mock recommendations, or fallback
    const passedRec = body.recommendation;
    const mockRec = MOCK_RECOMMENDATIONS.find((r) => r.id === id);

    const title = passedRec?.title || mockRec?.title || "Organizer Recommendation";
    const attendeeMessage =
      passedRec?.attendeeMessage ||
      mockRec?.attendeeMessage ||
      passedRec?.action ||
      mockRec?.action ||
      "Organizer recommendation active";
    const action = passedRec?.action || mockRec?.action || "";
    const recType = passedRec?.type || mockRec?.type || "REROUTE_ATTENDEES";
    const routeId = passedRec?.routeId || "BALANCED";

    const approvedItem: ApprovedRecommendationItem = {
      id,
      type: recType,
      title,
      message: attendeeMessage,
      action,
      status: "APPROVED",
      active: true,
      routeId,
      approvedAt: new Date().toISOString(),
    };

    // Store in global scenarioStore
    scenarioStore.approveRecommendation(approvedItem);

    const existingIntervention = persistenceService
      .getInterventions()
      .find((i) => i.id === id) || {
      id,
      type: recType,
      title,
      description: attendeeMessage,
      targetZoneId: "ZONE_CHURCHGATE",
      status: "PROPOSED",
      urgency: "HIGH",
      requiresApproval: true,
      rationale: mockRec?.reason || "Operational bottleneck mitigation",
      confidenceScore: 0.9,
      expectedPressureReductionPercent: 25,
      timeToEffectMinutes: 5,
      proposedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    } as OperationalIntervention;

    if (existingIntervention.status === "APPROVED") {
      console.log(`[BACKEND] published recommendation: ${id}`);
      return NextResponse.json({
        success: true,
        message: `Intervention '${id}' is already approved.`,
        intervention: existingIntervention,
        approvedRecommendation: approvedItem,
        scenarioVersion: scenarioStore.getScenarioVersion(),
      });
    }

    const { updatedIntervention, auditRecord } = recommendationLifecycleEngine.processApproval(
      existingIntervention,
      "APPROVE",
      actorId,
      actorRole
    );

    await persistenceService.persistIntervention(updatedIntervention);
    await persistenceService.persistAuditEvent(auditRecord);

    console.log(`[BACKEND] published recommendation: ${id}`);

    return NextResponse.json({
      success: true,
      message: `Intervention '${id}' successfully approved by ${actorId}.`,
      intervention: updatedIntervention,
      approvedRecommendation: approvedItem,
      auditRecord,
      scenarioVersion: scenarioStore.getScenarioVersion(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to approve intervention" },
      { status: 500 }
    );
  }
}
