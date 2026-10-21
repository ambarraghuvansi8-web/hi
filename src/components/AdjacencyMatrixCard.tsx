import React, { useState } from 'react';
import {
  Grid3X3,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  RotateCcw,
  Lock,
  Unlock,
} from 'lucide-react';
import { NetworkAnalysisResult, RoadNode } from '../types/network';

interface AdjacencyMatrixCardProps {
  nodes: RoadNode[];
  matrix: number[][];
  analysis: NetworkAnalysisResult;
  symmetricLock: boolean;
  onToggleSymmetricLock: () => void;
  onUpdateCell: (row: number, col: number, value: number) => void;
  onSymmetrize: () => void;
  onClearSelfLoops: () => void;
  onResetDefault: () => void;
}

export const AdjacencyMatrixCard: React.FC<AdjacencyMatrixCardProps> = ({
  nodes,
  matrix,
  analysis,
  symmetricLock,
  onToggleSymmetricLock,
  onUpdateCell,
  onSymmetrize,
  onClearSelfLoops,
  onResetDefault,
}) => {
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [draftVal, setDraftVal] = useState<string>('');

  const n = nodes.length;

  const commitEdit = (r: number, c: number, raw: string) => {
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) {
      onUpdateCell(r, c, parsed);
    }
    setEditingCell(null);
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col justify-between shadow-xs">
      <div>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-slate-tint)] text-[var(--color-slate-blue)] flex items-center justify-center shrink-0">
              <Grid3X3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[var(--text-main)]">
                Adjacency matrix A ({n} × {n})
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Row and column values show lane capacities between intersections
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleSymmetricLock}
            className={`px-3 py-1.5 rounded-xl font-medium text-xs border transition-colors flex items-center gap-1.5 cursor-pointer ${
              symmetricLock
                ? 'bg-[var(--bg-card-subtle)] border-[var(--border-subtle)] text-[var(--text-main)]'
                : 'bg-[var(--color-brass-tint)] border-[var(--color-brass)] text-[var(--color-brass)]'
            }`}
          >
            {symmetricLock ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Two-way locked (A = Aᵀ)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>One-way free edit</span>
              </>
            )}
          </button>
        </div>

        {/* Validation Warnings */}
        {analysis.validationIssues.length > 0 && (
          <div className="mb-4 p-3.5 rounded-xl bg-[var(--color-brass-tint)] border border-[var(--color-brass)]/40 space-y-2">
            {analysis.validationIssues.map((issue) => (
              <div
                key={issue.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[var(--color-brass)] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--text-main)]">
                      {issue.title}: <span className="font-normal text-[var(--text-muted)]">{issue.message}</span>
                    </div>
                    <div className="text-[var(--color-brass)] mt-0.5 font-medium">
                      How to fix: {issue.howToFix}
                    </div>
                  </div>
                </div>

                {issue.type === 'asymmetric' && (
                  <button
                    type="button"
                    onClick={onSymmetrize}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-brass)] text-[var(--color-brass)] font-medium text-xs hover:bg-[var(--color-brass)] hover:text-white transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Make two-way</span>
                  </button>
                )}

                {issue.type === 'self-loop' && (
                  <button
                    type="button"
                    onClick={onClearSelfLoops}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--color-brass)] text-[var(--color-brass)] font-medium text-xs hover:bg-[var(--color-brass)] hover:text-white transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Clear self-loops</span>
                  </button>
                )}

                {issue.type === 'empty' && (
                  <button
                    type="button"
                    onClick={onResetDefault}
                    className="px-2.5 py-1 rounded-lg bg-[var(--color-slate-blue)] text-white font-medium text-xs hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset default city</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Matrix Table */}
        <div className="overflow-x-auto pb-1">
          <table className="w-full border-collapse font-mono text-center text-xs tabular-nums">
            <thead>
              <tr className="text-[11px] text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                <th className="p-2 text-left font-medium">Intersection</th>
                {nodes.map((node, cIdx) => (
                  <th
                    key={node.id}
                    className={`p-2 font-medium ${
                      cIdx === 0 ? 'text-[var(--color-brass)] font-bold' : ''
                    }`}
                  >
                    {node.code}
                  </th>
                ))}
                <th className="p-2 text-right text-[var(--color-slate-blue)] font-medium">
                  Degree
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {nodes.map((rowNode, r) => {
                const rowScore = analysis.nodeScores[r];
                const isHubRow = r === (analysis.primaryHub?.nodeId ?? 0);

                return (
                  <tr key={rowNode.id} className="hover:bg-[var(--bg-card-subtle)] transition-colors">
                    <td
                      className={`p-2 text-left text-xs whitespace-nowrap ${
                        isHubRow ? 'text-[var(--color-brass)] font-bold' : 'text-[var(--text-main)] font-medium'
                      }`}
                    >
                      {rowNode.code} ({rowNode.name})
                    </td>

                    {nodes.map((colNode, c) => {
                      const val = matrix[r]?.[c] ?? 0;
                      const isNonZero = val > 0;
                      const isEditing = editingCell?.r === r && editingCell?.c === c;

                      return (
                        <td key={colNode.id} className="p-1">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="8"
                            aria-label={`Matrix cell row ${r} column ${c}`}
                            value={isEditing ? draftVal : String(Number(val.toFixed(2)))}
                            onFocus={() => {
                              setEditingCell({ r, c });
                              setDraftVal(String(val));
                            }}
                            onChange={(e) => {
                              setDraftVal(e.target.value);
                              const parsed = parseFloat(e.target.value);
                              if (!Number.isNaN(parsed)) {
                                onUpdateCell(r, c, parsed);
                              }
                            }}
                            onBlur={(e) => commitEdit(r, c, e.target.value)}
                            className={`w-11 h-8 text-center rounded-lg text-xs font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-slate-blue)] transition-colors ${
                              isNonZero
                                ? 'bg-[var(--color-slate-tint)] text-[var(--color-slate-blue)] font-bold border border-[var(--border-subtle)]'
                                : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-transparent'
                            }`}
                          />
                        </td>
                      );
                    })}

                    <td className="p-2 text-right font-semibold text-[var(--text-main)]">
                      {rowScore?.degree ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)]">
        <span>
          {analysis.nonZeroEntries} non-zero entries ({analysis.densityPct}% connected)
        </span>
        <span className="flex items-center gap-1.5 text-[var(--color-slate-blue)] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-brass)] shrink-0" />
          <span>Symmetric matrix</span>
        </span>
      </div>
    </div>
  );
};
