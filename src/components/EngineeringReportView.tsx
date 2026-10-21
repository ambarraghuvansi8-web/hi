import React, { useState } from 'react';
import {
  FileText,
  Download,
  Check,
  Terminal,
  Compass,
  ShieldAlert,
  Camera,
} from 'lucide-react';
import { NetworkAnalysisResult, RoadNode } from '../types/network';

interface EngineeringReportViewProps {
  nodes: RoadNode[];
  matrix: number[][];
  analysis: NetworkAnalysisResult;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportPng?: () => void;
}

export const EngineeringReportView: React.FC<EngineeringReportViewProps> = ({
  nodes,
  matrix,
  analysis,
  onExportJson,
  onExportCsv,
  onExportPng,
}) => {
  const [copiedReport, setCopiedReport] = useState(false);

  const hub = analysis.primaryHub;
  const lowestNodes = [...analysis.nodeScores]
    .sort((a, b) => a.scorePct - b.scorePct)
    .slice(0, 2);

  const generatePlainReport = () => {
    const lines = [
      `FlowSpectral — Urban Road Network Structural Report`,
      `====================================================`,
      `Intersections: ${analysis.nodeCount} | Active Roads: ${analysis.edgeCount}`,
      `Matrix rank: ${analysis.rank}/${analysis.nodeCount} (${analysis.isFullRank ? 'Full rank' : 'Rank deficient'}) | Nullity: ${analysis.nullity}`,
      `Dominant eigenvalue (network strength): ${analysis.dominantEigenvalue.toFixed(4)}`,
      `Algebraic connectivity (resilience): ${analysis.algebraicConnectivity.toFixed(3)} | Connected: ${analysis.connectionPercentage}%`,
      `Primary hub: ${hub ? `${hub.name} — ${hub.scorePct} / 100 importance score` : 'None'}`,
      ``,
      `Ranked intersection scores:`,
      ...[...analysis.nodeScores]
        .sort((a, b) => b.scorePct - a.scorePct)
        .map(
          (s, i) =>
            `  ${i + 1}. ${s.name}: ${s.scorePct}/100 | Roads: ${s.degree} | Eigen-weight: ${s.eigenWeight.toFixed(4)} | Betweenness: ${s.betweenness.toFixed(3)}`
        ),
    ];
    return lines.join('\n');
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generatePlainReport());
    setCopiedReport(true);
    window.setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top summary & export bar */}
      <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--color-slate-tint)] text-[var(--color-slate-blue)] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-[var(--text-main)]">
              Structural analysis synthesis &amp; logs
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Spectral analysis of intersection connectivity, rank independence, and bottleneck vulnerability
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {copiedReport ? (
              <>
                <Check className="w-3.5 h-3.5 text-[var(--color-brass)]" />
                <span className="text-[var(--color-brass)]">Copied</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Copy text summary</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Download CSV</span>
          </button>
          {onExportPng && (
            <button
              type="button"
              onClick={onExportPng}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[var(--color-brass)]" />
              <span>Presentation PNG map</span>
            </button>
          )}
          <button
            type="button"
            onClick={onExportJson}
            className="px-3.5 py-1.5 rounded-xl bg-[var(--color-brass)] text-white text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export full JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Step-by-step logs */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--color-slate-blue)] shrink-0" />
              <h4 className="font-semibold text-sm sm:text-base text-[var(--text-main)]">
                Linear algebra computation stages
              </h4>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {analysis.logs.length} stages verified
            </span>
          </div>

          <div className="space-y-3">
            {analysis.logs.map((entry, idx) => (
              <div
                key={entry.id}
                className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--color-brass)]">
                    Stage {idx + 1}: {entry.stage}
                  </span>
                  <code className="font-mono text-xs px-2 py-0.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--color-slate-blue)]">
                    {entry.formula}
                  </code>
                </div>
                <p className="text-xs font-semibold text-[var(--text-main)]">
                  {entry.summary}
                </p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {entry.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Planning Diagnosis */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex-1 space-y-3.5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Compass className="w-4 h-4 text-[var(--color-brass)] shrink-0" />
              <h4 className="font-semibold text-sm sm:text-base text-[var(--text-main)]">
                Urban engineering recommendations
              </h4>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <div className="text-xs font-semibold text-[var(--color-brass)] uppercase tracking-wider mb-1">
                  1. Hub bottleneck assessment
                </div>
                <p className="text-[var(--text-muted)]">
                  {hub ? (
                    <>
                      <strong className="text-[var(--text-main)]">{hub.name}</strong> carries the largest share of network flow (importance score {hub.scorePct}, connected to {hub.degree} roads). A disruption here would heavily impact overall city movement.
                    </>
                  ) : (
                    'Add roads between intersections to evaluate intersection criticality.'
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <div className="text-xs font-semibold text-[var(--color-slate-blue)] uppercase tracking-wider mb-1">
                  2. Route independence
                </div>
                <p className="text-[var(--text-muted)]">
                  {analysis.isFullRank ? (
                    <>
                      The network is <strong className="text-[var(--text-main)]">full rank ({analysis.rank}/{analysis.nodeCount})</strong>. Every intersection provides a unique set of routes, avoiding duplicate parallel corridors.
                    </>
                  ) : (
                    <>
                      The network is <strong className="text-[var(--color-brass)]">rank-deficient ({analysis.rank}/{analysis.nodeCount})</strong> with nullity {analysis.nullity}. Some intersections provide redundant or duplicate connections.
                    </>
                  )}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-main)] uppercase tracking-wider mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-brass)]" />
                  <span>3. Weak spots &amp; detours</span>
                </div>
                <p className="text-[var(--text-muted)]">
                  {analysis.weakSpots.length > 0 ? (
                    <>
                      Closing {analysis.weakSpots.map((n) => n.name).join(', ')} would divide the network. Adding a connector between peripheral areas would improve resilience.
                    </>
                  ) : (
                    <>
                      No single intersection failure splits the city. Traffic can find alternate routes even if one road closes.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
