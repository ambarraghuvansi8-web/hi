import React, { useRef, useState, useEffect } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  X,
  Sliders,
  Power,
  Info,
  Camera,
  Download,
  Check,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { NetworkAnalysisResult, RoadNode } from '../types/network';
import { simulateIntersectionClosure } from '../utils/linearAlgebra';
import { exportRoadNetworkToPng } from '../utils/exportGraphPng';

interface FriendlyMapProps {
  nodes: RoadNode[];
  matrix: number[][];
  analysis: NetworkAnalysisResult;
  closedNodeId: number | null;
  cityName?: string;
  theme?: 'light' | 'dark';
  onToggleCloseNode: (nodeId: number) => void;
  onMoveNode: (nodeId: number, x: number, y: number) => void;
  onResetPositions: () => void;
  onUpdateRoadCapacity: (u: number, v: number, capacity: number) => void;
  onExportPng?: () => void;
}

export const FriendlyMap: React.FC<FriendlyMapProps> = ({
  nodes,
  matrix,
  analysis,
  closedNodeId,
  cityName = 'Urban Road Network',
  theme = 'light',
  onToggleCloseNode,
  onMoveNode,
  onResetPositions,
  onUpdateRoadCapacity,
  onExportPng,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<number | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<{ u: number; v: number } | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  // Network integrity state & disconnection transition detection
  const prevDisconnectedRef = useRef<boolean>(analysis.isDisconnected);
  const [isTransitionPulsing, setIsTransitionPulsing] = useState<boolean>(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const pulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const wasDisconnected = prevDisconnectedRef.current;
    const isNowDisconnected = analysis.isDisconnected;
    prevDisconnectedRef.current = isNowDisconnected;

    // Detect state transition from connected (false) to disconnected (true)
    if (!wasDisconnected && isNowDisconnected) {
      setIsTransitionPulsing(true);
      setShowNotificationBanner(true);
      setBannerDismissed(false);

      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      // Run high-priority alert pulse for 7 seconds to grab attention
      pulseTimerRef.current = setTimeout(() => {
        setIsTransitionPulsing(false);
      }, 7000);
    } else if (wasDisconnected && !isNowDisconnected) {
      // Reconnected! Clear transition pulse and reset banner
      setIsTransitionPulsing(false);
      setShowNotificationBanner(false);
      setBannerDismissed(false);
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    }
  }, [analysis.isDisconnected]);

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  // Map of scores by node id
  const scoreMap = new Map<number, number>();
  analysis.nodeScores.forEach((s) => scoreMap.set(s.nodeId, s.scorePct));

  // Convert pointer to SVG 640x380 viewBox coordinates
  const getSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 320, y: 190 };
    const rect = svg.getBoundingClientRect();
    const scaleX = 640 / Math.max(rect.width, 1);
    const scaleY = 380 / Math.max(rect.height, 1);
    const x = Math.max(50, Math.min(590, Math.round((clientX - rect.left) * scaleX)));
    const y = Math.max(45, Math.min(335, Math.round((clientY - rect.top) * scaleY)));
    return { x, y };
  };

  const handlePointerDownNode = (
    e: React.PointerEvent<SVGGElement>,
    nodeId: number
  ) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setDraggingNodeId(nodeId);
    setSelectedRoad(null);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (draggingNodeId === null) return;
    const { x, y } = getSvgCoords(e.clientX, e.clientY);
    onMoveNode(draggingNodeId, x, y);
  };

  const handlePointerUp = () => {
    setDraggingNodeId(null);
  };

  // Undirected roads
  const roads: Array<{
    u: RoadNode;
    v: RoadNode;
    capacity: number;
    isPrimaryLink: boolean;
  }> = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const w = matrix[i]?.[j] ?? 0;
      if (w > 0) {
        const isPrimary =
          analysis.primaryHub !== null &&
          (i === analysis.primaryHub.nodeId || j === analysis.primaryHub.nodeId);
        roads.push({
          u: nodes[i],
          v: nodes[j],
          capacity: w,
          isPrimaryLink: isPrimary,
        });
      }
    }
  }

  // Maximum capacity across all active roads in the network
  const maxCapacity = Math.max(1, ...roads.map((r) => r.capacity));

  // Visual heatmap styling based on road capacity relative to max capacity
  const getRoadHeatmap = (capacity: number) => {
    if (capacity === 0) {
      return {
        coreColor: '#94A3B8',
        glowColor: 'transparent',
        ratio: 0,
        pct: 0,
        glowWidth: 0,
        tier: 'Closed',
        isPeak: false,
      };
    }
    const ratio = Math.max(0, Math.min(1, capacity / maxCapacity));
    const pct = Math.round(ratio * 100);

    let coreColor = '#64748B';
    let glowColor = 'rgba(100, 116, 139, 0.35)';
    let tier = 'Local Feeder';
    let isPeak = false;

    if (ratio >= 0.8) {
      coreColor = '#DC2626'; // Peak Arterial Crimson
      glowColor = 'rgba(220, 38, 38, 0.5)';
      tier = 'Primary Arterial';
      isPeak = true;
    } else if (ratio >= 0.5) {
      coreColor = '#D97706'; // Major Collector Amber
      glowColor = 'rgba(217, 119, 6, 0.45)';
      tier = 'Major Collector';
    } else if (ratio >= 0.3) {
      coreColor = '#3F5468'; // Connector Slate Blue
      glowColor = 'rgba(63, 84, 104, 0.35)';
      tier = 'Connector';
    } else {
      coreColor = '#64748B'; // Low capacity Feeder
      glowColor = 'rgba(100, 116, 139, 0.25)';
      tier = 'Local Street';
    }

    return {
      coreColor,
      glowColor,
      ratio,
      pct,
      glowWidth: Math.round(6 + ratio * 12),
      tier,
      isPeak,
    };
  };

  // Active selected node details
  const activeNode = selectedNodeId !== null ? nodes.find((n) => n.id === selectedNodeId) : null;
  const activeScore = activeNode ? (scoreMap.get(activeNode.id) ?? 0) : 0;
  const isNodeClosed = activeNode ? activeNode.id === closedNodeId : false;

  // Closure simulation preview when inspecting node
  const closureSim = activeNode
    ? simulateIntersectionClosure(activeNode.id, nodes, matrix)
    : null;

  // Selected road details
  const activeRoadDetails = selectedRoad
    ? {
        uNode: nodes.find((n) => n.id === selectedRoad.u),
        vNode: nodes.find((n) => n.id === selectedRoad.v),
        capacity: matrix[selectedRoad.u]?.[selectedRoad.v] ?? 0,
      }
    : null;

  // Export high-res PNG map handler
  const handleDownloadPng = async () => {
    try {
      setIsExportingPng(true);
      if (onExportPng) {
        onExportPng();
      } else {
        await exportRoadNetworkToPng({
          nodes,
          matrix,
          analysis,
          closedNodeId,
          cityName,
          theme,
        });
      }
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export graph PNG:', err);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
      {/* Top Map Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 z-10">
        <div>
          <h2 className="font-semibold text-base sm:text-lg text-[var(--text-main)]">
            Road map
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Drag intersections to rearrange • Click any intersection or road to test changes
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* Capacity Heatmap Toggle */}
          <button
            type="button"
            onClick={() => setShowHeatmap((prev) => !prev)}
            title="Toggle visual capacity heatmap overlay on road network"
            aria-pressed={showHeatmap}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              showHeatmap
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40 shadow-xs'
                : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-[var(--border-subtle)]'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-500 fill-amber-500/30' : 'text-[var(--text-muted)]'}`} />
            <span>Heatmap: {showHeatmap ? 'On' : 'Off'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={isExportingPng}
            title="Download high-resolution presentation map (PNG 2400x1500)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--color-brass)] hover:opacity-90 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {exportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>PNG Saved</span>
              </>
            ) : isExportingPng ? (
              <>
                <Camera className="w-3.5 h-3.5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span>Export PNG map</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onResetPositions}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset layout</span>
          </button>
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div
        className={`relative w-full h-[380px] sm:h-[440px] bg-[var(--map-bg)] rounded-xl border overflow-hidden select-none transition-all duration-500 ${
          analysis.isDisconnected
            ? isTransitionPulsing
              ? 'border-red-500/80 dark:border-red-500/70 ring-4 ring-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.35)] animate-network-severed'
              : 'border-red-400/60 dark:border-red-500/50 shadow-[0_0_16px_rgba(239,68,68,0.15)]'
            : 'border-[var(--border-subtle)]'
        }`}
      >
        {/* Live Network Integrity Indicator Beacon (Top-Right of Map Canvas) */}
        <button
          type="button"
          onClick={() => {
            if (analysis.isDisconnected) {
              setBannerDismissed(false);
              setShowNotificationBanner(true);
            }
          }}
          title={
            analysis.isDisconnected
              ? 'Network structure is disconnected! Click to view alert banner.'
              : 'Network structure is connected. All intersections are accessible.'
          }
          className={`absolute top-3 right-3 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all shadow-xs cursor-pointer select-none ${
            analysis.isDisconnected
              ? isTransitionPulsing
                ? 'bg-red-950/90 text-red-100 border-red-500 ring-2 ring-red-500/50 animate-pulse'
                : 'bg-red-900/85 hover:bg-red-900 text-red-100 border-red-500/60'
              : 'bg-[var(--bg-card)]/90 hover:bg-[var(--bg-card)] text-[var(--text-main)] border-[var(--border-subtle)]'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {analysis.isDisconnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                analysis.isDisconnected ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            />
          </span>
          <span className="font-mono text-[11px] tracking-tight">
            {analysis.isDisconnected ? 'Integrity: Severed' : 'Integrity: Connected'}
          </span>
        </button>

        {/* Disconnection Visual Notification Indicator (Pulses on transition from connected to disconnected) */}
        {analysis.isDisconnected && !bannerDismissed && (
          <div
            className={`absolute top-3 left-3 right-36 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg z-30 bg-red-950/95 dark:bg-red-950/95 text-white border border-red-500/80 rounded-2xl p-3 sm:p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
              isTransitionPulsing
                ? 'animate-pulse ring-2 ring-red-400/80 shadow-[0_4px_30px_rgba(239,68,68,0.5)]'
                : ''
            }`}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {/* Pulsing Beacon Icon */}
                <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-xs sm:text-sm text-red-100 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Network Cut-Off Detected</span>
                    </h4>
                    <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-200 border border-red-400/40">
                      Integrity Severed
                    </span>
                  </div>
                  <p className="text-xs text-red-200/90 mt-1 leading-relaxed">
                    {analysis.disconnectedMessage ??
                      'Vehicles cannot travel between all areas. Road or intersection closure split the network into isolated zones.'}
                  </p>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Dismiss integrity alert"
                title="Dismiss banner (integrity beacon remains visible in top corner)"
                className="p-1 rounded-lg text-red-300 hover:text-white hover:bg-red-900/60 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Calm background grid texture */}
        <svg
          className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="friendly-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="var(--map-grid)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#friendly-grid)" />
        </svg>

        {/* SVG Roads & Intersections */}
        <svg
          ref={svgRef}
          viewBox="0 0 640 380"
          className="w-full h-full relative z-10 touch-none"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={() => {
            setSelectedNodeId(null);
            setSelectedRoad(null);
          }}
        >
          <defs>
            <filter id="road-heat-glow" x="-35%" y="-35%" width="170%" height="170%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Gentle background rings around hub */}
          {analysis.primaryHub && (
            <>
              {(() => {
                const hubNode = nodes.find((n) => n.id === analysis.primaryHub?.nodeId);
                if (!hubNode || hubNode.id === closedNodeId) return null;
                return (
                  <circle
                    cx={hubNode.x}
                    cy={hubNode.y}
                    r={70}
                    fill="none"
                    stroke="var(--color-brass)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity={0.35}
                  />
                );
              })()}
            </>
          )}

          {/* Roads (Lines) */}
          {roads.map((road) => {
            const isUClosed = road.u.id === closedNodeId;
            const isVClosed = road.v.id === closedNodeId;
            const isRoadClosed = isUClosed || isVClosed || road.capacity === 0;

            const isSelected =
              selectedRoad !== null &&
              ((selectedRoad.u === road.u.id && selectedRoad.v === road.v.id) ||
                (selectedRoad.u === road.v.id && selectedRoad.v === road.u.id));

            const heat = getRoadHeatmap(road.capacity);

            // Traffic flow pulse duration is inversely proportional to capacity
            // (Higher capacity => higher velocity => faster pulse / shorter duration)
            const pulseDuration =
              !isRoadClosed && road.capacity > 0
                ? Math.max(0.8, Number((3.6 / road.capacity).toFixed(2)))
                : null;

            // Road thickness showing capacity
            const strokeWidth = isRoadClosed
              ? 2
              : Math.max(3, Math.min(8.5, 2.5 + road.capacity * 1.5));

            const strokeColor = isRoadClosed
              ? '#A0AEC0'
              : isSelected
                ? 'var(--color-brass)'
                : showHeatmap
                  ? heat.coreColor
                  : road.isPrimaryLink
                    ? 'var(--color-brass)'
                    : 'var(--color-slate-blue)';

            const strokeOpacity = isRoadClosed ? 0.35 : isSelected ? 1 : showHeatmap ? 0.95 : 0.75;

            const midX = (road.u.x + road.v.x) / 2;
            const midY = (road.u.y + road.v.y) / 2;

            return (
              <g
                key={`road-${road.u.id}-${road.v.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRoad({ u: road.u.id, v: road.v.id });
                  setSelectedNodeId(null);
                }}
                className="cursor-pointer group"
              >
                {/* Thicker invisible stroke for easy tapping */}
                <line
                  x1={road.u.x}
                  y1={road.u.y}
                  x2={road.v.x}
                  y2={road.v.y}
                  stroke="transparent"
                  strokeWidth={20}
                />

                {/* Visual Heatmap Overlay Glow Underlay with Subtle Breathing Pulse */}
                {showHeatmap && !isRoadClosed && (
                  <line
                    x1={road.u.x}
                    y1={road.u.y}
                    x2={road.v.x}
                    y2={road.v.y}
                    stroke={isSelected ? 'rgba(140, 107, 56, 0.75)' : heat.glowColor}
                    strokeWidth={strokeWidth + heat.glowWidth}
                    strokeLinecap="round"
                    strokeOpacity={isSelected ? 0.85 : 0.45 + heat.ratio * 0.45}
                    filter="url(#road-heat-glow)"
                    style={
                      pulseDuration
                        ? {
                            animation: `trafficAuraPulse ${pulseDuration}s ease-in-out infinite`,
                          }
                        : undefined
                    }
                  />
                )}

                {/* Visible Road Core Line */}
                <line
                  x1={road.u.x}
                  y1={road.u.y}
                  x2={road.v.x}
                  y2={road.v.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  strokeLinecap="round"
                  strokeDasharray={isRoadClosed ? '5 4' : undefined}
                  className="transition-colors duration-200"
                />

                {/* Subtle Traffic Flow Pulse Stream (Speed proportional to road capacity) */}
                {!isRoadClosed && road.capacity > 0 && pulseDuration && (
                  <line
                    x1={road.u.x}
                    y1={road.u.y}
                    x2={road.v.x}
                    y2={road.v.y}
                    stroke={
                      heat.isPeak
                        ? '#FEF08A'
                        : showHeatmap
                          ? '#FFF7ED'
                          : '#FFFFFF'
                    }
                    strokeWidth={Math.max(1.5, Math.min(3, strokeWidth * 0.38))}
                    strokeDasharray="6 18"
                    strokeLinecap="round"
                    pointerEvents="none"
                    style={{
                      animation: `trafficFlowPulse ${pulseDuration}s linear infinite`,
                    }}
                  />
                )}

                {/* Arterial Centerline Dashes for Peak Capacity Roads (≥80% of max capacity) */}
                {showHeatmap && !isRoadClosed && heat.isPeak && strokeWidth >= 6 && (
                  <line
                    x1={road.u.x}
                    y1={road.u.y}
                    x2={road.v.x}
                    y2={road.v.y}
                    stroke="#FEF3C7"
                    strokeWidth={1.2}
                    strokeDasharray="3 4"
                    strokeOpacity={0.65}
                    strokeLinecap="round"
                    pointerEvents="none"
                  />
                )}

                {/* Capacity & Heatmap Badge along road */}
                {!isRoadClosed && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={showHeatmap ? -26 : -14}
                      y={-8.5}
                      width={showHeatmap ? 52 : 28}
                      height={17}
                      rx={6}
                      fill="var(--map-node-bg)"
                      stroke={isSelected ? 'var(--color-brass)' : showHeatmap ? heat.coreColor : 'var(--border-subtle)'}
                      strokeWidth={showHeatmap ? 1.5 : 1}
                      strokeOpacity={showHeatmap ? 0.9 : 1}
                    />
                    <text
                      x={0}
                      y={3.5}
                      textAnchor="middle"
                      fontFamily="inherit"
                      fontSize="9"
                      fontWeight="600"
                      fill={
                        isSelected
                          ? 'var(--color-brass)'
                          : showHeatmap
                            ? heat.coreColor
                            : road.isPrimaryLink
                              ? 'var(--color-brass)'
                              : 'var(--color-slate-blue)'
                      }
                    >
                      {showHeatmap
                        ? `${road.capacity}L · ${heat.pct}%`
                        : `${road.capacity} ${road.capacity === 1 ? 'lane' : 'lanes'}`}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Intersections (Circles) */}
          {nodes.map((node) => {
            const score = scoreMap.get(node.id) ?? 0;
            const isPrimary =
              analysis.primaryHub !== null &&
              analysis.primaryHub.nodeId === node.id &&
              node.id !== closedNodeId;
            const isClosed = node.id === closedNodeId;
            const isSelected = selectedNodeId === node.id;

            // Size circle by importance score (0-100)
            const radius = isClosed ? 18 : Math.round(18 + (score / 100) * 12);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onPointerDown={(e) => handlePointerDownNode(e, node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                  setSelectedRoad(null);
                }}
                className="cursor-pointer"
              >
                {/* Pulsing gentle ring for the most important intersection */}
                {isPrimary && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke="var(--color-brass)"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                    opacity={0.6}
                    className="animate-pulse"
                  />
                )}

                {/* Selection halo */}
                {isSelected && (
                  <circle
                    r={radius + 5}
                    fill="none"
                    stroke="var(--color-slate-blue)"
                    strokeWidth="2"
                    opacity={0.8}
                  />
                )}

                {/* Outer Circle */}
                <circle
                  r={radius}
                  fill={isClosed ? '#E2E8F0' : 'var(--map-node-bg)'}
                  stroke={
                    isClosed
                      ? '#94A3B8'
                      : isPrimary
                        ? 'var(--color-brass)'
                        : score >= 70
                          ? 'var(--color-slate-blue)'
                          : 'var(--color-slate-light)'
                  }
                  strokeWidth={isPrimary ? 3 : 2}
                  strokeDasharray={isClosed ? '4 3' : undefined}
                  className="transition-all duration-200"
                />

                {/* Inner Pill with Importance Score */}
                <circle
                  r={isClosed ? 6 : Math.round(7 + (score / 100) * 5)}
                  fill={
                    isClosed
                      ? '#94A3B8'
                      : isPrimary
                        ? 'var(--color-brass)'
                        : 'var(--color-slate-blue)'
                  }
                  opacity={isClosed ? 0.6 : 0.9}
                />

                {/* Node Name Label */}
                <text
                  x={0}
                  y={node.y > 260 ? -(radius + 10) : radius + 18}
                  textAnchor="middle"
                  fontFamily="inherit"
                  fontSize="13"
                  fontWeight="600"
                  fill={isClosed ? '#94A3B8' : 'var(--text-main)'}
                  className="pointer-events-none"
                >
                  {node.name}
                </text>

                {/* Small subtitle or closed status */}
                <text
                  x={0}
                  y={node.y > 260 ? -(radius + 26) : radius + 32}
                  textAnchor="middle"
                  fontFamily="inherit"
                  fontSize="11"
                  fontWeight="500"
                  fill={isClosed ? '#EF4444' : isPrimary ? 'var(--color-brass)' : 'var(--text-muted)'}
                  className="pointer-events-none"
                >
                  {isClosed ? 'Temporarily closed' : `${score} / 100 importance`}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Intersection Click Card (Friendly Explanation & "What if this closes?") */}
        {activeNode && (
          <div
            className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-md z-30 bg-[var(--bg-card)]/95 backdrop-blur-md rounded-2xl border border-[var(--border-subtle)] p-4 shadow-lg animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-base text-[var(--text-main)] flex items-center gap-2">
                  <span>{activeNode.name}</span>
                  {isNodeClosed && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium">
                      Closed
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Importance score: <strong className="text-[var(--text-main)]">{activeScore} out of 100</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                aria-label="Close details"
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* What if this closes explanation */}
            <div className="bg-[var(--bg-card-subtle)] rounded-xl p-3 text-sm text-[var(--text-muted)] mb-3 leading-relaxed">
              {closureSim?.changeSentence}
            </div>

            {/* "What if this closes?" Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleCloseNode(activeNode.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                  isNodeClosed
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-[var(--color-slate-tint)] hover:bg-[var(--color-slate-tint-hover)] text-[var(--color-slate-blue)] border border-[var(--border-subtle)]'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{isNodeClosed ? `Reopen ${activeNode.name}` : `What if this closes?`}</span>
              </button>
            </div>
          </div>
        )}

        {/* Road Click Card (Capacity slider & close road button) */}
        {selectedRoad && activeRoadDetails?.uNode && activeRoadDetails?.vNode && (
          <div
            className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-sm z-30 bg-[var(--bg-card)]/95 backdrop-blur-md rounded-2xl border border-[var(--border-subtle)] p-4 shadow-lg animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-main)]">
                  {activeRoadDetails.uNode.name} ↔ {activeRoadDetails.vNode.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Current: {activeRoadDetails.capacity} {activeRoadDetails.capacity === 1 ? 'lane' : 'lanes'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoad(null)}
                aria-label="Close road settings"
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3">
              <label className="text-xs font-medium text-[var(--text-muted)] block mb-1.5">
                Change road capacity
              </label>
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3, 4].map((lane) => (
                  <button
                    key={lane}
                    type="button"
                    onClick={() => onUpdateRoadCapacity(selectedRoad.u, selectedRoad.v, lane)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeRoadDetails.capacity === lane
                        ? 'bg-[var(--color-brass)] text-white'
                        : 'bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:bg-[var(--color-slate-tint-hover)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {lane === 0 ? 'Closed' : `${lane}L`}
                  </button>
                ))}
              </div>
            </div>

            {/* Heatmap capacity ranking relative to network max */}
            <div className="my-2.5 p-2.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                  <span>Capacity heatmap:</span>
                </span>
                <span className="font-semibold text-[var(--text-main)] font-mono">
                  {Math.round((activeRoadDetails.capacity / maxCapacity) * 100)}% of max ({activeRoadDetails.capacity}/{maxCapacity} lanes)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 mt-1.5">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(6, Math.round((activeRoadDetails.capacity / maxCapacity) * 100))}%`,
                    backgroundColor:
                      activeRoadDetails.capacity / maxCapacity >= 0.8
                        ? '#DC2626'
                        : activeRoadDetails.capacity / maxCapacity >= 0.5
                          ? '#D97706'
                          : activeRoadDetails.capacity > 0
                            ? '#3F5468'
                            : '#94A3B8',
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-1 font-mono">
                <span>Tier: {getRoadHeatmap(activeRoadDetails.capacity).tier}</span>
                <span>Max: {maxCapacity}L</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = activeRoadDetails.capacity > 0 ? 0 : 1;
                onUpdateRoadCapacity(selectedRoad.u, selectedRoad.v, next);
              }}
              className="w-full py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] rounded-lg bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              {activeRoadDetails.capacity > 0 ? 'Close this road' : 'Reopen road (1 lane)'}
            </button>
          </div>
        )}

        {/* Capacity Heatmap Legend at bottom left */}
        {showHeatmap ? (
          <div className="absolute bottom-3 left-3 bg-[var(--bg-card)]/92 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1.5 text-xs text-[var(--text-muted)] pointer-events-auto select-none">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[var(--text-main)]">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                <span>Road Capacity Heatmap</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-card-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                Max: {maxCapacity} {maxCapacity === 1 ? 'lane' : 'lanes'}
              </span>
            </div>

            {/* Continuous heatmap gradient bar */}
            <div className="w-52 h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              <div
                className="w-full h-full"
                style={{
                  background:
                    'linear-gradient(to right, #64748B 0%, #3F5468 33%, #D97706 66%, #DC2626 100%)',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[#64748B]">Feeder (≤33%)</span>
              <span className="text-[#D97706]">Collector (66%)</span>
              <span className="text-[#DC2626] font-semibold">Arterial (100%)</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]/70">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Traffic pulse speed ∝ road capacity</span>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 bg-[var(--bg-card)]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[var(--border-subtle)] flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)] pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[var(--color-brass)] inline-block" />
              <span>Main hub</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-slate-blue)] inline-block" />
              <span>Regular intersection</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 rounded bg-[var(--color-slate-blue)] inline-block" />
              <span>Road width = lanes</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] border-l border-[var(--border-subtle)] pl-2">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
              <span>Flow pulse ∝ capacity</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
