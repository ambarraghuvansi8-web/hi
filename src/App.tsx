import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  Power,
  Compass,
  Sparkles,
} from 'lucide-react';
import { NETWORK_PRESETS } from './data/presets';
import { RoadNode } from './types/network';
import {
  analyzeRoadNetwork,
  cloneMatrix,
  simulateIntersectionClosure,
} from './utils/linearAlgebra';
import { exportRoadNetworkToPng } from './utils/exportGraphPng';
import { FriendlyTopBar } from './components/FriendlyTopBar';
import { FriendlyMap } from './components/FriendlyMap';
import { FriendlyInsightsPanel } from './components/FriendlyInsightsPanel';
import { EditNetworkModal } from './components/EditNetworkModal';
import { MathsTeacherDrawer } from './components/MathsTeacherDrawer';
import { HowToUseBanner } from './components/HowToUseBanner';
import { AiChatbotDrawer } from './components/AiChatbotDrawer';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('central-hub-5');

  // Baseline network nodes and matrix
  const [nodes, setNodes] = useState<RoadNode[]>(() =>
    NETWORK_PRESETS[0].nodes.map((n) => ({ ...n }))
  );
  const [matrix, setMatrix] = useState<number[][]>(() =>
    cloneMatrix(NETWORK_PRESETS[0].matrix)
  );

  // Intersection currently closed in "What if this closes?" simulation
  const [closedNodeId, setClosedNodeId] = useState<number | null>(null);

  // Two-way lock for matrix edits
  const [symmetricLock, setSymmetricLock] = useState<boolean>(true);

  // Modals & Panels
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [showMaths, setShowMaths] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Short note on how to use this app (shown on start, dismissible)
  const [showHowToUse, setShowHowToUse] = useState<boolean>(true);

  // Synchronize document class with light/dark theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Compute active matrix (zeroing out closed intersection if one is being simulated)
  const activeMatrix = useMemo(() => {
    if (closedNodeId === null) return matrix;
    const n = matrix.length;
    const copy = cloneMatrix(matrix);
    for (let i = 0; i < n; i++) {
      copy[closedNodeId][i] = 0;
      copy[i][closedNodeId] = 0;
    }
    return copy;
  }, [matrix, closedNodeId]);

  // Compute 100% live linear algebra analysis
  const analysis = useMemo(
    () => analyzeRoadNetwork(nodes, activeMatrix),
    [nodes, activeMatrix]
  );

  // Active preset object
  const activePreset = NETWORK_PRESETS.find((p) => p.id === selectedPresetId) ?? NETWORK_PRESETS[0];

  // Load a preset city network
  const handleSelectPreset = (presetId: string) => {
    const preset = NETWORK_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setNodes(preset.nodes.map((n) => ({ ...n })));
    setMatrix(cloneMatrix(preset.matrix));
    setClosedNodeId(null);
  };

  // Toggle "What if this closes?" for an intersection
  const handleToggleCloseNode = (nodeId: number) => {
    setClosedNodeId((prev) => (prev === nodeId ? null : nodeId));
  };

  // Move a node on the map
  const handleMoveNode = (nodeId: number, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, x, y } : n))
    );
  };

  // Reset node positions to preset defaults
  const handleResetNodePositions = () => {
    const preset = activePreset;
    setNodes((prev) =>
      prev.map((node, idx) => {
        const match = preset.nodes[idx];
        if (match) {
          return { ...node, x: match.x, y: match.y };
        }
        const angle = (idx / prev.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...node,
          x: Math.round(320 + Math.cos(angle) * 140),
          y: Math.round(190 + Math.sin(angle) * 120),
        };
      })
    );
  };

  // Update a road capacity (lanes) between two intersections
  const handleUpdateRoadCapacity = (u: number, v: number, capacity: number) => {
    setMatrix((prev) => {
      const next = cloneMatrix(prev);
      next[u][v] = capacity;
      if (symmetricLock && u !== v) {
        next[v][u] = capacity;
      }
      return next;
    });
  };

  // Add an intersection
  const handleAddIntersection = (name: string) => {
    if (nodes.length >= 8) return;
    const newId = nodes.length;
    const angle = (newId / (nodes.length + 1)) * Math.PI * 2 - Math.PI / 4;
    const newNode: RoadNode = {
      id: newId,
      code: `v${newId + 1}`,
      name,
      subtitle: `Node ${newId + 1}`,
      x: Math.round(320 + Math.cos(angle) * 145),
      y: Math.round(190 + Math.sin(angle) * 120),
    };

    setNodes((prev) => [...prev, newNode]);
    setMatrix((prev) => {
      const next = prev.map((row) => [...row, 0]);
      const newRow = new Array(prev.length + 1).fill(0);
      next.push(newRow);
      return next;
    });
  };

  // Remove an intersection
  const handleRemoveIntersection = (nodeId: number) => {
    if (nodes.length <= 2) return;
    const filteredNodes = nodes
      .filter((n) => n.id !== nodeId)
      .map((n, idx) => ({ ...n, id: idx, code: `v${idx + 1}` }));

    const filteredMatrix = matrix
      .filter((_, r) => r !== nodeId)
      .map((row) => row.filter((_, c) => c !== nodeId));

    setNodes(filteredNodes);
    setMatrix(filteredMatrix);
    if (closedNodeId === nodeId) setClosedNodeId(null);
  };

  // Add a road between two intersections
  const handleAddRoad = (u: number, v: number, capacity: number) => {
    handleUpdateRoadCapacity(u, v, capacity);
  };

  // Symmetrize matrix
  const handleSymmetrize = () => {
    setMatrix((prev) => {
      const n = prev.length;
      const next = cloneMatrix(prev);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const maxW = Math.max(0, next[i][j], next[j][i]);
          next[i][j] = maxW;
          next[j][i] = maxW;
        }
      }
      return next;
    });
    setSymmetricLock(true);
  };

  // Clear diagonal self-loops
  const handleClearSelfLoops = () => {
    setMatrix((prev) => {
      const next = cloneMatrix(prev);
      for (let i = 0; i < next.length; i++) {
        next[i][i] = 0;
      }
      return next;
    });
  };

  // Export JSON
  const handleExportJson = () => {
    const payload = {
      app: 'FlowSpectral Urban Road Network Structural Analyzer',
      exportedAt: new Date().toISOString(),
      preset: selectedPresetId,
      nodes,
      matrix,
      mathematics: {
        rank: analysis.rank,
        nullity: analysis.nullity,
        determinant: analysis.determinant,
        dominantEigenvalue: analysis.dominantEigenvalue,
        algebraicConnectivity: analysis.algebraicConnectivity,
        topologicalDensity: analysis.topologicalDensity,
        singularValues: analysis.singularValues,
      },
      scores: analysis.nodeScores,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowspectral-city-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCsv = () => {
    const header = ['Intersection', ...nodes.map((n) => n.name), 'Degree', 'ImportanceScore'].join(',');
    const rows = nodes.map((n, r) => {
      const score = analysis.nodeScores[r];
      return [
        `"${n.name}"`,
        ...(matrix[r] ?? []).map((v) => v.toFixed(2)),
        score?.degree ?? 0,
        score?.scorePct ?? 0,
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowspectral-matrix.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export high-resolution presentation PNG
  const handleExportPng = async () => {
    try {
      await exportRoadNetworkToPng({
        nodes,
        matrix,
        analysis,
        closedNodeId,
        cityName: activePreset.name,
        theme,
      });
    } catch (err) {
      console.error('Error generating presentation PNG snapshot:', err);
    }
  };

  const closedNodeObj = closedNodeId !== null ? nodes.find((n) => n.id === closedNodeId) : null;
  const closureEffect = closedNodeId !== null ? simulateIntersectionClosure(closedNodeId, nodes, matrix) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] transition-colors relative">
      {/* 1. SLIM TOP BAR */}
      <FriendlyTopBar
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        onOpenEditNetwork={() => setIsEditModalOpen(true)}
        showMaths={showMaths}
        onToggleMaths={() => setShowMaths((prev) => !prev)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
        onToggleHowToUse={() => setShowHowToUse((prev) => !prev)}
        showHowToUse={showHowToUse}
        onOpenChat={() => setIsChatOpen(true)}
        onExportPng={handleExportPng}
      />

      {/* MAIN FIRST SCREEN */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5">
        {/* Short Note on How to Use this App (Dismissible Beginner Guide) */}
        {showHowToUse && (
          <HowToUseBanner
            onDismiss={() => setShowHowToUse(false)}
            onOpenChat={() => setIsChatOpen(true)}
          />
        )}

        {/* Disconnected Network Warning Banner */}
        {analysis.isDisconnected && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start sm:items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                {analysis.disconnectedMessage ??
                  'Some intersections cannot reach each other. Traffic is cut off between separate areas.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectPreset('central-hub-5')}
              className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer"
            >
              Restore connected city
            </button>
          </div>
        )}

        {/* Temporary Closure Scenario Banner */}
        {closedNodeObj && (
          <div className="p-4 rounded-2xl bg-[var(--color-brass-tint)] border border-[var(--color-brass)]/50 text-[var(--text-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm shadow-xs animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <Power className="w-5 h-5 text-[var(--color-brass)] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-semibold text-[var(--color-brass)]">
                  Simulating closure:{' '}
                </span>
                <span>{closureEffect?.changeSentence}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setClosedNodeId(null)}
              className="px-3 py-1.5 rounded-xl bg-[var(--color-brass)] hover:opacity-90 text-white text-xs font-semibold shrink-0 transition-opacity flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen {closedNodeObj.name}</span>
            </button>
          </div>
        )}

        {/* MAIN SPLIT VIEW (Big Map ~2/3 + 3 Answer Cards & Ranked List ~1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* LEFT: Clean Road Map taking about two thirds (8 of 12 cols on desktop) */}
          <div className="lg:col-span-8 flex flex-col">
            <FriendlyMap
              nodes={nodes}
              matrix={matrix}
              analysis={analysis}
              closedNodeId={closedNodeId}
              cityName={activePreset.name}
              theme={theme}
              onToggleCloseNode={handleToggleCloseNode}
              onMoveNode={handleMoveNode}
              onResetPositions={handleResetNodePositions}
              onUpdateRoadCapacity={handleUpdateRoadCapacity}
              onExportPng={handleExportPng}
            />
          </div>

          {/* RIGHT: Three Plain-Language Answer Cards + 0-100 Ranked List (4 of 12 cols) */}
          <div className="lg:col-span-4 flex flex-col">
            <FriendlyInsightsPanel
              analysis={analysis}
              closedNodeId={closedNodeId}
            />
          </div>
        </div>
      </main>

      {/* FLOATING AI ASSISTANT BUTTON (Bottom-Right Shortcut) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[var(--color-brass)] text-white font-semibold text-sm shadow-xl hover:opacity-95 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span>Ask AI Assistant</span>
        </button>
      </div>

      {/* AI CHATBOT DRAWER (Multi-turn Gemini with network context) */}
      <AiChatbotDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        nodes={nodes}
        matrix={matrix}
        analysis={analysis}
        selectedPresetName={activePreset.name}
      />

      {/* EDIT NETWORK MODAL (Friendly road sliders & intersection builder) */}
      <EditNetworkModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        nodes={nodes}
        matrix={matrix}
        onUpdateRoadCapacity={handleUpdateRoadCapacity}
        onAddIntersection={handleAddIntersection}
        onRemoveIntersection={handleRemoveIntersection}
        onAddRoad={handleAddRoad}
      />

      {/* "SHOW THE MATHS" DRAWER (For the Maths Teacher) */}
      <MathsTeacherDrawer
        isOpen={showMaths}
        onClose={() => setShowMaths(false)}
        nodes={nodes}
        matrix={matrix}
        analysis={analysis}
        symmetricLock={symmetricLock}
        onToggleSymmetricLock={() => setSymmetricLock((prev) => !prev)}
        onUpdateCell={handleUpdateRoadCapacity}
        onSymmetrize={handleSymmetrize}
        onClearSelfLoops={handleClearSelfLoops}
        onResetDefault={() => handleSelectPreset('central-hub-5')}
        onExportJson={handleExportJson}
        onExportCsv={handleExportCsv}
        onExportPng={handleExportPng}
      />

      {/* Slim Calm Footer */}
      <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-card)] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[var(--color-slate-blue)]" />
            <span className="font-medium text-[var(--text-main)]">FlowSpectral</span>
            <span>·</span>
            <span>City Road Network Structural Analyzer</span>
          </div>
          <div>
            Built with linear algebra and graph spectrum theory
          </div>
        </div>
      </footer>
    </div>
  );
}
