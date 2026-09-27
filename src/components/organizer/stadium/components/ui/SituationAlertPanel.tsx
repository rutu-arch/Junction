import React from "react";
import { useOccupancy } from "../../data/occupancy";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
  Check,
} from "lucide-react";

export const SituationAlertPanel: React.FC = () => {
  const {
    activeSituations,
    activeRecommendations,
    applyOperatorAction,
    acknowledgeRecommendation,
    gateStates,
    zoneStates,
  } = useOccupancy();

  if (activeSituations.length === 0 && activeRecommendations.length === 0) {
    return null;
  }

  const primarySituation = activeSituations[0];
  const primaryRec = activeRecommendations[0];

  if (!primarySituation && !primaryRec) return null;

  const isCritical = primarySituation?.severity === "CRITICAL" || primaryRec?.severity === "CRITICAL";
  const isResolving = primarySituation?.status === "RESOLVING" || primaryRec?.status === "RESOLVING";
  const isResolved = primarySituation?.status === "RESOLVED" || primaryRec?.status === "RESOLVED";

  const gate1 = gateStates["gate-1"];
  const gate2 = gateStates["gate-2"];
  const north = zoneStates["north"];

  return (
    <div
      className={`situation-alert-panel ${isResolved ? "resolved" : isResolving ? "resolving" : isCritical ? "critical" : "warning"}`}
    >
      {/* Header */}
      <div className="situation-header">
        <div className="situation-header-left">
          {isResolved ? (
            <CheckCircle2 size={16} className="text-emerald" />
          ) : (
            <AlertTriangle size={16} className={isCritical ? "text-coral animate-pulse" : "text-amber"} />
          )}
          <span className="situation-badge">
            {isResolved ? "SITUATION RESOLVED" : isResolving ? "FLOW REDIRECTION ACTIVE" : "OPERATIONAL SITUATION"}
          </span>
        </div>
        <span className={`situation-severity-tag severity-${primarySituation?.severity.toLowerCase() || "warning"}`}>
          {primarySituation?.status || "ACTIVE"}
        </span>
      </div>

      {/* Title */}
      <h3 className="situation-title">
        {primarySituation?.title || primaryRec?.title}
      </h3>

      {/* Description / Explanation */}
      <p className="situation-desc">
        {primaryRec?.explanation || primarySituation?.description}
      </p>

      {/* Real-time Telemetry Grid for North Stand Buildup Demo */}
      {gate1 && gate2 && north && (
        <div className="situation-telemetry-box">
          <div className="sit-tel-row">
            <span className="tel-k">NORTH OCCUPANCY</span>
            <span className="tel-v">
              {north.occupancyPercent.toFixed(1)}%
              {north.trend === "RISING" && <TrendingUp size={12} className="text-coral" />}
              {north.trend === "FALLING" && <TrendingDown size={12} className="text-emerald" />}
              {north.trend === "STABLE" && <Minus size={12} className="text-cyan" />}
            </span>
          </div>
          <div className="sit-tel-row">
            <span className="tel-k">GATE 01 PRESSURE</span>
            <span className={`tel-v ${gate1.pressurePercent > 75 ? "text-coral" : "text-cyan"}`}>
              {gate1.pressurePercent.toFixed(0)}% (Queue: {gate1.queueLength})
              {gate1.trend === "RISING" && <TrendingUp size={12} className="text-coral" />}
              {gate1.trend === "FALLING" && <TrendingDown size={12} className="text-emerald" />}
            </span>
          </div>
          <div className="sit-tel-row">
            <span className="tel-k">GATE 02 LOAD</span>
            <span className="tel-v text-cyan">
              {gate2.pressurePercent.toFixed(0)}% (Queue: {gate2.queueLength})
            </span>
          </div>
        </div>
      )}

      {/* Suggested Action Box */}
      {primaryRec && !isResolved && (
        <div className="situation-action-box">
          <div className="action-box-header">
            <Radio size={11} className="text-cyan" />
            <span>RECOMMENDED ACTION</span>
          </div>
          <p className="action-text">{primaryRec.suggestedAction}</p>

          {/* Action Buttons */}
          <div className="action-btn-row">
            {primaryRec.status === "ACTIVE" && (
              <button
                className="btn-action-ack"
                onClick={() => acknowledgeRecommendation(primaryRec.id)}
                title="Mark alert as acknowledged by operator"
              >
                <Check size={12} />
                ACKNOWLEDGE
              </button>
            )}

            {primaryRec.actionKey === "REDIRECT_GATE_1_TO_2" && !isResolving && (
              <button
                className="btn-action-apply"
                onClick={() => applyOperatorAction("REDIRECT_GATE_1_TO_2")}
                title="Execute concourse re-routing flow in simulation"
              >
                <ArrowRight size={13} />
                APPLY: DIVERT FLOW
              </button>
            )}

            {isResolving && (
              <div className="resolving-indicator">
                <span className="pulse-dot-small" />
                <span>RELIEF IN PROGRESS (DRAINING QUEUE...)</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
