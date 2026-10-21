import React from 'react';
import {
  Compass,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { NetworkAnalysisResult } from '../types/network';

interface FriendlyInsightsPanelProps {
  analysis: NetworkAnalysisResult;
  closedNodeId: number | null;
  onSelectNode?: (nodeId: number) => void;
}

export const FriendlyInsightsPanel: React.FC<FriendlyInsightsPanelProps> = ({
  analysis,
  closedNodeId,
  onSelectNode,
}) => {
  const hub = analysis.primaryHub;
  const backup = analysis.backupRoutes;
  const weakSpots = analysis.weakSpots;

  // Sorted list of nodes by importance score (0-100)
  const ranked = [...analysis.nodeScores]
    .filter((s) => s.nodeId !== closedNodeId)
    .sort((a, b) => b.scorePct - a.scorePct);

  return (
    <div className="flex flex-col gap-5">
      {/* THREE PLAIN-LANGUAGE ANSWER CARDS */}
      <div className="flex flex-col gap-3">
        {/* Card 1: Most important intersection */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-brass)] mb-1.5">
            <Compass className="w-4 h-4" />
            <span>Most important intersection</span>
          </div>
          <h3 className="font-semibold text-lg text-[var(--text-main)] mb-1">
            {hub ? hub.name : 'None yet'}
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {analysis.hubReason}
          </p>
        </div>

        {/* Card 2: Backup routes */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-slate-blue)]">
              <ShieldCheck className="w-4 h-4" />
              <span>Backup routes</span>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                backup.rating === 'Good'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : backup.rating === 'Limited'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              {backup.rating}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {backup.sentence}
          </p>
        </div>

        {/* Card 3: Weak spots */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 shadow-xs transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-slate-blue)] mb-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>Weak spots</span>
          </div>
          <h3 className="font-semibold text-base text-[var(--text-main)] mb-1">
            {weakSpots.length > 0
              ? weakSpots.map((n) => n.name).join(', ')
              : 'None found'}
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {weakSpots.length > 0
              ? 'Closing any of these intersections would disconnect parts of the road network.'
              : 'No single intersection closure would split the city into pieces.'}
          </p>
        </div>
      </div>

      {/* RANKED IMPORTANCE LIST (No other numbers, just name, bar, and score 0-100) */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="font-semibold text-base text-[var(--text-main)]">
            Intersection ranking
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            Score out of 100
          </span>
        </div>

        <div className="space-y-3.5">
          {ranked.map((item, idx) => {
            const isTop = idx === 0 && item.scorePct > 0;
            return (
              <div
                key={item.nodeId}
                onClick={() => onSelectNode && onSelectNode(item.nodeId)}
                className="group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-3 text-sm mb-1.5">
                  <span className="font-medium text-[var(--text-main)] group-hover:text-[var(--color-slate-blue)] transition-colors">
                    {item.name}
                  </span>
                  <span className="font-semibold text-[var(--text-main)] tabular-nums">
                    {item.scorePct}
                  </span>
                </div>

                {/* Clean horizontal bar */}
                <div className="w-full h-2 rounded-full bg-[var(--bg-card-subtle)] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isTop
                        ? 'bg-[var(--color-brass)]'
                        : 'bg-[var(--color-slate-blue)]'
                    }`}
                    style={{ width: `${Math.max(4, item.scorePct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
