import React from 'react';
import { BarChart3 } from 'lucide-react';
import { NetworkAnalysisResult } from '../types/network';

interface EigenSpectrumCardProps {
  analysis: NetworkAnalysisResult;
}

export const EigenSpectrumCard: React.FC<EigenSpectrumCardProps> = ({
  analysis,
}) => {
  const maxAbs = Math.max(
    ...analysis.eigenSpectrum.map((e) => Math.abs(e.eigenvalue)),
    3.0
  );

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brass-tint)] text-[var(--color-brass)] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-[var(--text-main)]">
              Eigenvalue spectrum
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Network strength and structural modes
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">
          Trace: {analysis.trace.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2.5">
        {analysis.eigenSpectrum.map((mode, idx) => {
          const isPositive = mode.eigenvalue >= 0;
          const signPrefix = isPositive ? '+' : '';
          const halfPct = Math.min(48, (Math.abs(mode.eigenvalue) / maxAbs) * 46);
          const isDominant = idx === 0;

          return (
            <div
              key={mode.index}
              className="flex items-center gap-3 font-mono text-xs tabular-nums"
            >
              <span
                className={`w-20 text-right shrink-0 ${
                  isDominant
                    ? 'text-[var(--color-brass)] font-bold'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {mode.symbol} {signPrefix}
                {mode.eigenvalue.toFixed(2)}
              </span>

              <div className="flex-1 flex items-center h-4 bg-[var(--bg-card-subtle)] rounded-lg relative overflow-hidden">
                <div className="absolute left-1/2 w-px h-full bg-[var(--border-subtle)] z-10" />

                {isPositive ? (
                  <div
                    className={`absolute left-1/2 h-2.5 rounded-r transition-all duration-300 ${
                      isDominant
                        ? 'bg-[var(--color-brass)]'
                        : 'bg-[var(--color-slate-blue)]'
                    }`}
                    style={{ width: `${halfPct}%` }}
                  />
                ) : (
                  <div
                    className="absolute right-1/2 h-2.5 rounded-l bg-[var(--color-slate-light)] transition-all duration-300 opacity-70"
                    style={{ width: `${halfPct}%` }}
                  />
                )}
              </div>

              <span className="w-20 text-right text-xs text-[var(--text-muted)] shrink-0 font-sans">
                {mode.regimeLabel}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
        <span>Spectral gap: {analysis.spectralGap.toFixed(2)}</span>
        <span className="text-[var(--color-slate-blue)] font-medium">
          {analysis.spectralGap >= 1.0 ? 'Fast circulation' : 'Moderate circulation'}
        </span>
      </div>
    </div>
  );
};
