// ============================================================
// JUNCTION - Unified Backend Scenario & Recommendation Store
// Shared in-memory single source of truth across all API routes
// ============================================================

import { ScenarioId } from "@/types";

export interface ApprovedRecommendationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  action?: string;
  status: "APPROVED";
  active: boolean;
  routeId: string;
  approvedAt: string;
}

interface ScenarioStoreState {
  activeScenario: ScenarioId;
  isRec1Approved: boolean;
  scenarioVersion: number;
  approvedInterventionIds: Set<string>;
  approvedRecommendations: Map<string, ApprovedRecommendationItem>;
  latestApprovedId: string | null;
  lastUpdated: string;
}

class ScenarioStore {
  private state: ScenarioStoreState = {
    activeScenario: "NORMAL",
    isRec1Approved: false,
    scenarioVersion: 1,
    approvedInterventionIds: new Set<string>(),
    approvedRecommendations: new Map<string, ApprovedRecommendationItem>(),
    latestApprovedId: null,
    lastUpdated: new Date().toISOString(),
  };

  public getActiveScenario(): ScenarioId {
    return this.state.activeScenario;
  }

  public setActiveScenario(scenario: ScenarioId): boolean {
    if (this.state.activeScenario !== scenario) {
      this.state.activeScenario = scenario;
      this.state.scenarioVersion++;
      this.state.lastUpdated = new Date().toISOString();
      return true;
    }
    return false;
  }

  public isRec1Approved(): boolean {
    return (
      this.state.isRec1Approved ||
      this.state.approvedInterventionIds.has("REC1") ||
      this.state.approvedRecommendations.has("REC1") ||
      this.hasApprovedRerouteIntervention()
    );
  }

  public setRec1Approved(approved: boolean): boolean {
    if (this.state.isRec1Approved !== approved) {
      this.state.isRec1Approved = approved;
      if (approved) {
        this.state.approvedInterventionIds.add("REC1");
      } else {
        this.state.approvedInterventionIds.delete("REC1");
        this.state.approvedRecommendations.delete("REC1");
        if (this.state.latestApprovedId === "REC1") {
          this.state.latestApprovedId = null;
        }
      }
      this.state.scenarioVersion++;
      this.state.lastUpdated = new Date().toISOString();
      return true;
    }
    return false;
  }

  public approveInterventionId(id: string, isReroute: boolean = false): void {
    this.state.approvedInterventionIds.add(id);
    if (id === "REC1" || isReroute) {
      this.state.isRec1Approved = true;
    }
    this.state.scenarioVersion++;
    this.state.lastUpdated = new Date().toISOString();
  }

  public approveRecommendation(item: ApprovedRecommendationItem): void {
    this.state.approvedRecommendations.delete(item.id);
    this.state.approvedRecommendations.set(item.id, item);
    this.state.approvedInterventionIds.add(item.id);
    this.state.latestApprovedId = item.id;
    if (
      item.id === "REC1" ||
      item.type === "REROUTE_ATTENDEES" ||
      item.type === "REDISTRIBUTE" ||
      item.id.includes("DIVERT")
    ) {
      this.state.isRec1Approved = true;
    }
    this.state.scenarioVersion++;
    this.state.lastUpdated = new Date().toISOString();
  }

  public getApprovedRecommendations(): ApprovedRecommendationItem[] {
    return Array.from(this.state.approvedRecommendations.values());
  }

  public getLatestApprovedRecommendation(): ApprovedRecommendationItem | null {
    if (this.state.latestApprovedId && this.state.approvedRecommendations.has(this.state.latestApprovedId)) {
      return this.state.approvedRecommendations.get(this.state.latestApprovedId)!;
    }
    const all = this.getApprovedRecommendations();
    return all.length > 0 ? all[all.length - 1] : null;
  }

  public getApprovedInterventionIds(): string[] {
    return Array.from(this.state.approvedInterventionIds);
  }

  public clearApprovedRecommendations(): void {
    this.state.approvedRecommendations.clear();
    this.state.approvedInterventionIds.clear();
    this.state.latestApprovedId = null;
    this.state.isRec1Approved = false;
    this.state.scenarioVersion++;
    this.state.lastUpdated = new Date().toISOString();
  }

  public getScenarioVersion(): number {
    return this.state.scenarioVersion;
  }

  public getLastUpdated(): string {
    return this.state.lastUpdated;
  }

  private hasApprovedRerouteIntervention(): boolean {
    for (const id of this.state.approvedInterventionIds) {
      if (id.includes("DIVERT") || id.includes("REROUTE") || id === "REC1") {
        return true;
      }
    }
    for (const item of this.state.approvedRecommendations.values()) {
      if (
        item.type === "REROUTE_ATTENDEES" ||
        item.type === "REDISTRIBUTE" ||
        item.id === "REC1"
      ) {
        return true;
      }
    }
    return false;
  }
}

// Global singleton instance across all server API routes
const globalForScenarioStore = globalThis as unknown as {
  junctionScenarioStore?: ScenarioStore;
};

if (!globalForScenarioStore.junctionScenarioStore || typeof globalForScenarioStore.junctionScenarioStore.getLatestApprovedRecommendation !== "function") {
  globalForScenarioStore.junctionScenarioStore = new ScenarioStore();
}

export const scenarioStore = globalForScenarioStore.junctionScenarioStore;
