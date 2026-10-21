import React, { useState } from 'react';
import { LineChart } from 'lucide-react';
import { PowerIterationStep } from '../types/network';

interface PowerIterationChartProps {
  steps: PowerIterationStep[];
  dominantEigenvalue: number;
}

export const PowerIterationChart: React.FC<PowerIterationChartProps> = ({
  steps,
  dominantEigenvalue,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 560;
  const height = 210;
  const padLeft = 44;
  const padRight = 20;
  const padTop = 18;
  const padBottom = 28;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const lambdas = steps.map((s) => s.eigenvalueEstimate);
  const minLambda = Math.min(...lambdas, dominantEigenvalue * 0.7);
  const maxLambda = Math.max(...lambdas, dominantEigenvalue * 1.05, 0.1);
  const lambdaSpan = Math.max(0.1, maxLambda - minLambda);

  const getX = (idx: number) => {
    if (steps.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (steps.length - 1)) * plotW;
  };

  const getLambdaY = (val: number) => {
    const norm = (val - minLambda) / lambdaSpan;
    return padTop + plotH - Math.max(0, Math.min(1, norm)) * plotH;
  };

  const lambdaPoints = steps
    .map((s, i) => `${getX(i)},${getLambdaY(s.eigenvalueEstimate)}`)
    .join(' ');

  const activeStep = hoverIdx !== null ? steps[hoverIdx] : steps[steps.length - 1];

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-brass-tint)] text-[var(--color-brass)] flex items-center justify-center shrink-0">
            <LineChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-[var(--text-main)]">
              Power iteration convergence
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Step-by-step approximation of the dominant eigenvalue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="w-3 h-0.5 bg-[var(--color-brass)] inline-block rounded-full" />
          <span>Calculated strength: <strong className="text-[var(--text-main)]">{dominantEigenvalue.toFixed(2)}</strong></span>
        </div>
      </div>

      {/* SVG Convergence Curve */}
      <div className="relative w-full bg-[var(--map-bg)] rounded-xl border border-[var(--border-subtle)] p-2 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[180px] select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Grid lines */}
          {[0, 0.5, 1].map((frac, idx) => {
            const y = padTop + frac * plotH;
            const labelVal = (maxLambda - frac * lambdaSpan).toFixed(2);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3.5}
                  textAnchor="end"
                  fontFamily="inherit"
                  fontSize="9.5"
                  fill="var(--text-muted)"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Asymptote target */}
          <line
            x1={padLeft}
            y1={getLambdaY(dominantEigenvalue)}
            x2={width - padRight}
            y2={getLambdaY(dominantEigenvalue)}
            stroke="var(--color-brass)"
            strokeOpacity="0.4"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Convergence Curve */}
          {steps.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--color-brass)"
              strokeWidth="2.5"
              points={lambdaPoints}
            />
          )}

          {/* Step points */}
          {steps.map((s, idx) => {
            const cx = getX(idx);
            const cy = getLambdaY(s.eigenvalueEstimate);
            const isHovered = hoverIdx === idx;

            return (
              <g
                key={s.iteration}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIdx(idx)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3}
                  fill="var(--color-brass)"
                  stroke="var(--bg-card)"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer Info */}
      {activeStep && (
        <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
          <span>
            Step {activeStep.iteration}: value estimate = <strong className="text-[var(--text-main)]">{activeStep.eigenvalueEstimate.toFixed(3)}</strong>
          </span>
          <span>
            Converged in {steps.length} iterations
          </span>
        </div>
      )}
    </div>
  );
};
