import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Grid3X3,
  Layers,
  BarChart3,
  FileText,
  Download,
  Info,
  Camera,
} from 'lucide-react';
import { NetworkAnalysisResult, RoadNode } from '../types/network';
import { AdjacencyMatrixCard } from './AdjacencyMatrixCard';
import { RowEchelonSvdCard } from './RowEchelonSvdCard';
import { GaussianStepPlayer } from './GaussianStepPlayer';
import { EigenSpectrumCard } from './EigenSpectrumCard';
import { PowerIterationChart } from './PowerIterationChart';
import { EngineeringReportView } from './EngineeringReportView';

interface MathsTeacherDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: RoadNode[];
  matrix: number[][];
  analysis: NetworkAnalysisResult;
  symmetricLock: boolean;
  onToggleSymmetricLock: () => void;
  onUpdateCell: (row: number, col: number, val: number) => void;
  onSymmetrize: () => void;
  onClearSelfLoops: () => void;
  onResetDefault: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportPng?: () => void;
}

type MathsTab = 'dictionary' | 'matrix-rank' | 'gaussian-steps' | 'eigen-spectrum' | 'logs';

export const MathsTeacherDrawer: React.FC<MathsTeacherDrawerProps> = ({
  isOpen,
  onClose,
  nodes,
  matrix,
  analysis,
  symmetricLock,
  onToggleSymmetricLock,
  onUpdateCell,
  onSymmetrize,
  onClearSelfLoops,
  onResetDefault,
  onExportJson,
  onExportCsv,
  onExportPng,
}) => {
  const [activeTab, setActiveTab] = useState<MathsTab>('dictionary');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-4xl bg-[var(--bg-app)] border-l border-[var(--border-subtle)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:px-6 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brass-tint)] text-[var(--color-brass)] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-[var(--text-main)]">
                The mathematics behind the network
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Linear algebra, graph spectra, and Gaussian elimination for educators and students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onExportPng && (
              <button
                type="button"
                onClick={onExportPng}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--color-brass)] text-white hover:opacity-90 transition-opacity cursor-pointer hidden sm:flex shadow-xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Export PNG Map</span>
              </button>
            )}

            <button
              type="button"
              onClick={onExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] transition-colors cursor-pointer hidden sm:flex"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close mathematics drawer"
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] flex items-center gap-4 overflow-x-auto shrink-0">
          {[
            { id: 'dictionary', label: 'Concept dictionary', icon: BookOpen },
            { id: 'matrix-rank', label: 'Adjacency matrix & rank', icon: Grid3X3 },
            { id: 'gaussian-steps', label: 'Step-by-step working', icon: Layers },
            { id: 'eigen-spectrum', label: 'Eigenvalues & convergence', icon: BarChart3 },
            { id: 'logs', label: 'Detailed report & logs', icon: FileText },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as MathsTab)}
                className={`py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[var(--color-brass)] text-[var(--color-brass)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CONCEPT DICTIONARY */}
          {activeTab === 'dictionary' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex items-start gap-3">
                <Info className="w-5 h-5 text-[var(--color-slate-blue)] shrink-0 mt-0.5" />
                <div className="text-sm text-[var(--text-muted)] leading-relaxed">
                  The main screen translates heavy linear algebra formulas into clear words for city planners. Here is the exact mathematical translation for every metric:
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    plain: 'Importance score (0–100)',
                    maths: 'Eigenvector Centrality (v₁)',
                    desc: 'The principal eigenvector of adjacency matrix A, corresponding to Perron-Frobenius dominant eigenvalue λ₁. Scaled so the primary hub = 100.',
                    formula: 'A · v₁ = λ₁ · v₁',
                  },
                  {
                    plain: 'Network strength',
                    maths: 'Dominant Eigenvalue (λ₁)',
                    desc: 'The spectral radius of the connection matrix. For the default 5-node city, λ₁ = 2.9354, representing overall circulation capacity.',
                    formula: 'λ₁ = max { |λ| : det(A - λI) = 0 }',
                  },
                  {
                    plain: 'Backup routes',
                    maths: 'Matrix Rank & Nullity',
                    desc: 'Rank measures the number of linearly independent road neighborhoods. Nullity ν(A) = n - rank(A) indicates duplicate or redundant intersection patterns.',
                    formula: 'Dim(V) = Rank(A) + Nullity(A)',
                  },
                  {
                    plain: 'Resilience',
                    maths: 'Algebraic Connectivity (λ₂ of Laplacian L)',
                    desc: 'The second smallest eigenvalue of the graph Laplacian L = D - A (Fiedler value). A higher value means the network is harder to cut in half.',
                    formula: 'L = D - A,  0 = μ₁ ≤ μ₂ ≤ ... ≤ μₙ',
                  },
                  {
                    plain: 'Traffic passes through',
                    maths: 'Betweenness Centrality',
                    desc: 'Fraction of all shortest paths across the entire city that pass through a given intersection.',
                    formula: 'g(v) = ∑ (σ_st(v) / σ_st)',
                  },
                  {
                    plain: 'How well connected',
                    maths: 'Topological Density (D)',
                    desc: 'Percentage of possible road connections that actually exist in the city.',
                    formula: 'D = 2|E| / [n(n - 1)]',
                  },
                  {
                    plain: 'Step-by-step working',
                    maths: 'Gaussian Elimination to RREF',
                    desc: 'Systematic elementary row operations (row swaps, scaling, and elimination) reducing matrix A to echelon form [U].',
                    formula: 'R_i ← R_i - c · R_pivot',
                  },
                  {
                    plain: 'Weak spots',
                    maths: 'Articulation Points (Cut Vertices)',
                    desc: 'Intersections whose removal increases the number of connected components, splitting the graph.',
                    formula: 'c(G \\ {v}) > c(G)',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-brass)] uppercase tracking-wider mb-1">
                        Friendly: {item.plain}
                      </div>
                      <h4 className="font-bold text-base text-[var(--text-main)] mb-1">
                        {item.maths}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">
                        {item.desc}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-[var(--bg-card-subtle)] font-mono text-xs text-[var(--color-slate-blue)] font-semibold">
                      {item.formula}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ADJACENCY MATRIX & RANK */}
          {activeTab === 'matrix-rank' && (
            <div className="space-y-6">
              <AdjacencyMatrixCard
                nodes={nodes}
                matrix={matrix}
                analysis={analysis}
                symmetricLock={symmetricLock}
                onToggleSymmetricLock={onToggleSymmetricLock}
                onUpdateCell={onUpdateCell}
                onSymmetrize={onSymmetrize}
                onClearSelfLoops={onClearSelfLoops}
                onResetDefault={onResetDefault}
              />
              <RowEchelonSvdCard
                analysis={analysis}
                onOpenStepSequence={() => setActiveTab('gaussian-steps')}
              />
            </div>
          )}

          {/* TAB 3: GAUSSIAN ELIMINATION STEP PLAYER */}
          {activeTab === 'gaussian-steps' && (
            <div className="space-y-6">
              <GaussianStepPlayer
                steps={analysis.gaussianSteps}
                nodes={nodes}
                rank={analysis.rank}
                nullity={analysis.nullity}
              />
            </div>
          )}

          {/* TAB 4: EIGENVALUES & CONVERGENCE */}
          {activeTab === 'eigen-spectrum' && (
            <div className="space-y-6">
              <PowerIterationChart
                steps={analysis.powerIterationSteps}
                dominantEigenvalue={analysis.dominantEigenvalue}
              />
              <EigenSpectrumCard analysis={analysis} />
            </div>
          )}

          {/* TAB 5: LOGS & SYNTHESIS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <EngineeringReportView
                nodes={nodes}
                matrix={matrix}
                analysis={analysis}
                onExportJson={onExportJson}
                onExportCsv={onExportCsv}
                onExportPng={onExportPng}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
