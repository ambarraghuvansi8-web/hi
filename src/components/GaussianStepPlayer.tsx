import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Layers,
} from 'lucide-react';
import { GaussianStep, RoadNode } from '../types/network';

interface GaussianStepPlayerProps {
  steps: GaussianStep[];
  nodes: RoadNode[];
  rank: number;
  nullity: number;
}

export const GaussianStepPlayer: React.FC<GaussianStepPlayerProps> = ({
  steps,
  nodes,
  rank,
  nullity,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(steps.length - 1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    setCurrentIdx((prev) => Math.min(prev, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setCurrentIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying, steps.length]);

  const step = steps[currentIdx] ?? steps[0];
  if (!step) return null;

  const togglePlay = () => {
    if (currentIdx >= steps.length - 1) {
      setCurrentIdx(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-xs">
      <div>
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-slate-tint)] text-[var(--color-slate-blue)] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[var(--text-main)]">
                Step-by-step working (Gaussian elimination)
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Row reduction to discover independent routes and matrix rank
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--bg-card-subtle)] p-1.5 rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentIdx(0);
              }}
              disabled={currentIdx === 0}
              aria-label="First step"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-35 cursor-pointer"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentIdx((p) => Math.max(0, p - 1));
              }}
              disabled={currentIdx === 0}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--color-slate-tint-hover)] disabled:opacity-35 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={togglePlay}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-[var(--color-slate-blue)] text-white hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Auto-step</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentIdx((p) => Math.min(steps.length - 1, p + 1));
              }}
              disabled={currentIdx >= steps.length - 1}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--color-slate-tint-hover)] disabled:opacity-35 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentIdx(steps.length - 1);
              }}
              disabled={currentIdx >= steps.length - 1}
              aria-label="Last step"
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-35 cursor-pointer"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Scrubber */}
        <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          {steps.map((s, idx) => {
            const isCurrent = idx === currentIdx;
            return (
              <button
                key={s.stepIndex}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentIdx(idx);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-[var(--color-brass)] text-white font-semibold'
                    : idx < currentIdx
                      ? 'bg-[var(--bg-card-subtle)] text-[var(--text-main)]'
                      : 'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-card-subtle)]'
                }`}
              >
                {idx === 0
                  ? 'Start'
                  : idx === steps.length - 1
                    ? 'Final echelon'
                    : `Step ${idx}`}
              </button>
            );
          })}
        </div>

        {/* Operation Callout */}
        <div className="mb-4 p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-[var(--text-muted)] font-medium">
              Step {currentIdx} of {steps.length - 1}
            </div>
            <div className="font-semibold text-sm text-[var(--text-main)] mt-0.5">
              {step.title}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {step.explanation}
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--color-slate-blue)] font-bold whitespace-nowrap shrink-0">
            {step.operationCode}
          </div>
        </div>

        {/* Matrix Grid Snapshot */}
        <div className="p-3 rounded-xl bg-[var(--map-bg)] border border-[var(--border-subtle)] overflow-x-auto">
          <table className="w-full font-mono text-xs tabular-nums border-collapse">
            <thead>
              <tr className="text-[11px] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <th className="py-2 px-2.5 text-left font-medium">Row</th>
                {nodes.map((n, cIdx) => (
                  <th
                    key={n.id}
                    className={`py-2 px-2.5 text-right font-medium ${
                      step.pivotCol === cIdx ? 'text-[var(--color-brass)] font-bold' : ''
                    }`}
                  >
                    {n.name}
                  </th>
                ))}
                <th className="py-2 px-2.5 text-right font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {step.matrix.map((row, rIdx) => {
                const isActiveRow = step.activeRow === rIdx;
                const isPivotRow = step.pivotRow === rIdx;
                const locatedPivot = step.pivotsLocated.find((p) => p.row === rIdx);

                return (
                  <tr
                    key={rIdx}
                    className={`transition-colors ${
                      isActiveRow
                        ? 'bg-[var(--color-brass-tint)] text-[var(--color-brass)] font-semibold'
                        : isPivotRow
                          ? 'bg-[var(--color-slate-tint)] text-[var(--text-main)]'
                          : 'text-[var(--text-main)]'
                    }`}
                  >
                    <td className="py-2 px-2.5 text-left whitespace-nowrap">
                      Row {rIdx + 1} ({nodes[rIdx]?.name ?? `v${rIdx + 1}`})
                    </td>

                    {row.map((val, cIdx) => {
                      const isPivotCell =
                        (step.pivotRow === rIdx && step.pivotCol === cIdx) ||
                        (locatedPivot?.row === rIdx && locatedPivot?.col === cIdx);

                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-2.5 text-right ${
                            isPivotCell
                              ? 'text-[var(--color-brass)] font-bold underline decoration-[var(--color-brass)]'
                              : Math.abs(val) < 1e-6
                                ? 'text-[var(--text-faint)]'
                                : ''
                          }`}
                        >
                          {Math.abs(val) < 1e-6 ? '0.00' : val.toFixed(2)}
                        </td>
                      );
                    })}

                    <td className="py-2 px-2.5 text-right text-xs whitespace-nowrap">
                      {isActiveRow ? (
                        <span className="text-[var(--color-brass)] font-semibold">
                          Active row
                        </span>
                      ) : locatedPivot ? (
                        <span className="text-[var(--color-slate-blue)]">
                          Pivot {locatedPivot.row + 1}
                        </span>
                      ) : (
                        <span className="text-[var(--text-faint)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <span>
          Pivots found: {step.pivotsLocated.length} of {nodes.length}
        </span>
        <span>
          Rank: <strong className="text-[var(--text-main)]">{rank}</strong> (independent routes) • Nullity: <strong className="text-[var(--text-main)]">{nullity}</strong> (redundant routes)
        </span>
      </div>
    </div>
  );
};
