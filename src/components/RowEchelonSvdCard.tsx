import React from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import { NetworkAnalysisResult } from '../types/network';

interface RowEchelonSvdCardProps {
  analysis: NetworkAnalysisResult;
  onOpenStepSequence?: () => void;
}

export const RowEchelonSvdCard: React.FC<RowEchelonSvdCardProps> = ({
  analysis,
  onOpenStepSequence,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-xs">
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-slate-tint)] text-[var(--color-slate-blue)] flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[var(--text-main)]">
                Row echelon form and singular values
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Reduced row echelon matrix [U] and SVD condition analysis
              </p>
            </div>
          </div>

          {onOpenStepSequence && (
            <button
              type="button"
              onClick={onOpenStepSequence}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-main)] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>See steps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* RREF Matrix Display */}
        <div className="p-3.5 rounded-xl bg-[var(--map-bg)] border border-[var(--border-subtle)] font-mono space-y-1.5 text-xs text-[var(--text-main)] tabular-nums">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 mb-2">
            <span>Reduced row echelon form [U]</span>
            <span className="text-[var(--color-brass)] font-semibold">
              {analysis.rank} {analysis.rank === 1 ? 'pivot' : 'pivots'} found
            </span>
          </div>

          {analysis.rrefMatrix.map((row, rIdx) => {
            const pivotCol = row.findIndex((val) => Math.abs(val) > 1e-5);
            const hasPivot = pivotCol !== -1;

            return (
              <div
                key={rIdx}
                className="flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-xs overflow-x-auto"
              >
                <span
                  className={`whitespace-nowrap ${
                    hasPivot
                      ? 'text-[var(--color-brass)] font-semibold'
                      : 'text-[var(--text-faint)]'
                  }`}
                >
                  [{' '}
                  {row
                    .map((v) =>
                      Math.abs(v) < 1e-6 ? '0.00' : v.toFixed(2)
                    )
                    .join('   ')}{' '}
                  ]
                </span>
                <span className="text-xs text-[var(--text-muted)] whitespace-nowrap shrink-0">
                  {hasPivot ? `Pivot ${rIdx + 1} (x${pivotCol + 1})` : 'Free row (0)'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Singular values */}
        <div
          className="mt-4 grid gap-1.5 font-mono text-center tabular-nums text-xs"
          style={{
            gridTemplateColumns: `repeat(${Math.min(
              analysis.singularValues.length,
              6
            )}, minmax(0, 1fr))`,
          }}
        >
          {analysis.singularValues.slice(0, 6).map((sigma, idx) => (
            <div
              key={idx}
              className="p-2 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]"
            >
              <div className="text-[11px] text-[var(--text-muted)]">
                σ{idx + 1}
              </div>
              <div className="font-bold text-[var(--text-main)] mt-0.5">
                {sigma.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rank-Nullity summary */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <div>
          Rank-nullity: <strong className="text-[var(--text-main)]">{analysis.nodeCount}</strong> = {analysis.rank} (rank) + {analysis.nullity} (nullity)
        </div>
        <div>
          Determinant: <strong className="text-[var(--text-main)]">{analysis.determinant}</strong>
        </div>
      </div>
    </div>
  );
};
