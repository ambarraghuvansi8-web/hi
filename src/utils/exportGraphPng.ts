import { NetworkAnalysisResult, RoadNode } from '../types/network';

export interface ExportPngOptions {
  nodes: RoadNode[];
  matrix: number[][];
  analysis: NetworkAnalysisResult;
  closedNodeId: number | null;
  cityName?: string;
  theme?: 'light' | 'dark';
  scale?: number; // e.g. 2 for 2400x1500 presentation slide
}

/**
 * Generates a presentation-ready high-resolution PNG snapshot
 * of the urban road network for city planning slides and prints.
 */
export async function exportRoadNetworkToPng(options: ExportPngOptions): Promise<string> {
  const {
    nodes,
    matrix,
    analysis,
    closedNodeId,
    cityName = 'Urban Road Network',
    theme = 'light',
  } = options;

  // Presentation Canvas Dimensions (16:10 Slide Aspect Ratio @ high DPI)
  const width = 2400;
  const height = 1500;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context is not supported in this browser.');
  }

  const isDark = theme === 'dark';

  // Palette definitions
  const colors = {
    bg: isDark ? '#12171D' : '#F8F9FA',
    cardBg: isDark ? '#1A222B' : '#FFFFFF',
    cardBgSubtle: isDark ? '#202A35' : '#F4F6F8',
    border: isDark ? '#2A3746' : '#E5E9EE',
    borderStrong: isDark ? '#3D4F63' : '#CBD5E1',
    textMain: isDark ? '#E8ECF2' : '#1D252D',
    textMuted: isDark ? '#95A5B5' : '#5E6D7D',
    textFaint: isDark ? '#637587' : '#8896A6',
    slateBlue: '#3F5468',
    slateLight: '#526B83',
    slateTint: isDark ? '#1C2631' : '#F2F5F8',
    brass: '#8C6B38',
    brassLight: '#A68147',
    brassTint: isDark ? '#2A2418' : '#FBF8F3',
    grid: isDark ? '#1A222B' : '#EAEFF5',
    gridSubtle: isDark ? '#161D24' : '#F2F5F8',
    red: '#C8452D',
    green: '#1F7A4D',
    white: '#FFFFFF',
  };

  // 1. Draw presentation sheet background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // Outer framing border
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  // 2. Top Header Presentation Banner
  // Header background strip
  drawRoundedRect(ctx, 40, 40, width - 80, 150, 16, colors.cardBg, colors.border);

  // Header Title & App Badge
  ctx.fillStyle = colors.brass;
  ctx.font = '600 16px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('FLOWSPECTRAL • URBAN ROAD NETWORK STRUCTURAL ANALYZER', 70, 78);

  ctx.fillStyle = colors.textMain;
  ctx.font = 'bold 36px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(cityName, 70, 122);

  ctx.fillStyle = colors.textMuted;
  ctx.font = '500 18px "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText('Structural Linear Algebra & Network Resilience Assessment for City Planning', 70, 154);

  // Right-side metadata badge
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  drawRoundedRect(ctx, width - 420, 65, 350, 95, 12, colors.cardBgSubtle, colors.border);
  ctx.fillStyle = colors.textMuted;
  ctx.font = '500 14px "IBM Plex Sans", sans-serif';
  ctx.fillText(`REPORT DATE: ${dateStr} • ${timeStr}`, width - 395, 96);

  if (closedNodeId !== null) {
    const closedNode = nodes.find((n) => n.id === closedNodeId);
    ctx.fillStyle = colors.red;
    ctx.font = 'bold 15px "IBM Plex Sans", sans-serif';
    ctx.fillText(`⚠ DETOUR ACTIVE: ${closedNode?.name ?? '1 NODE'} CLOSED`, width - 395, 130);
  } else {
    ctx.fillStyle = colors.green;
    ctx.font = 'bold 15px "IBM Plex Sans", sans-serif';
    ctx.fillText(`✓ TOPOLOGY: FULLY CONNECTED (NO CUT-OFFS)`, width - 395, 130);
  }

  // 3. Compact Metrics Strip (4 key planning figures)
  const stripY = 210;
  const stripW = width - 80;
  const cardW = (stripW - 45) / 4;
  const cardH = 95;

  const metricsData = [
    {
      label: 'PRIMARY TRANSIT HUB',
      value: analysis.primaryHub ? analysis.primaryHub.name : 'None',
      sub: analysis.primaryHub ? `Score: ${analysis.primaryHub.scorePct}/100 • ${analysis.primaryHub.degree} Roads` : 'Decentralized',
      accent: colors.brass,
    },
    {
      label: 'NETWORK STRENGTH (λ₁)',
      value: analysis.dominantEigenvalue.toFixed(4),
      sub: 'Dominant spectral radius circulation capacity',
      accent: colors.slateBlue,
    },
    {
      label: 'MATRIX RANK & NULLITY',
      value: `Rank ${analysis.rank} / ${analysis.nodeCount}`,
      sub: analysis.isFullRank ? 'Full rank • High route independence' : `Nullity ${analysis.nullity} • Redundant segments`,
      accent: colors.slateBlue,
    },
    {
      label: 'RESILIENCE (ALGEBRAIC CONNECTIVITY)',
      value: `${analysis.algebraicConnectivity.toFixed(3)} μ₂`,
      sub: `Backup routes: ${analysis.backupRoutes.rating} (${analysis.connectionPercentage}% connected)`,
      accent: analysis.algebraicConnectivity >= 0.5 ? colors.green : colors.brass,
    },
  ];

  metricsData.forEach((item, idx) => {
    const cX = 40 + idx * (cardW + 15);
    drawRoundedRect(ctx, cX, stripY, cardW, cardH, 12, colors.cardBg, colors.border);

    // Accent left stripe
    ctx.fillStyle = item.accent;
    ctx.fillRect(cX, stripY + 12, 4, cardH - 24);

    ctx.fillStyle = colors.textMuted;
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText(item.label, cX + 18, stripY + 30);

    ctx.fillStyle = colors.textMain;
    ctx.font = 'bold 24px "IBM Plex Sans", sans-serif';
    ctx.fillText(item.value, cX + 18, stripY + 60);

    ctx.fillStyle = colors.textFaint;
    ctx.font = '500 13px "IBM Plex Sans", sans-serif';
    ctx.fillText(item.sub, cX + 18, stripY + 82);
  });

  // 4. Main Network Graph Area
  const graphX = 40;
  const graphY = 325;
  const graphW = width - 80;
  const graphH = 990;

  drawRoundedRect(ctx, graphX, graphY, graphW, graphH, 16, colors.cardBg, colors.border);

  // Subtle coordinate grid inside graph canvas
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  const gridSize = 60;
  ctx.save();
  ctx.beginPath();
  ctx.rect(graphX, graphY, graphW, graphH);
  ctx.clip();

  for (let gx = graphX; gx <= graphX + graphW; gx += gridSize) {
    ctx.moveTo(gx, graphY);
    ctx.lineTo(gx, graphY + graphH);
  }
  for (let gy = graphY; gy <= graphY + graphH; gy += gridSize) {
    ctx.moveTo(graphX, gy);
    ctx.lineTo(graphX + graphW, gy);
  }
  ctx.stroke();

  // Graph transformation mapping:
  // SVG original viewBox is 640x380
  const marginX = 140;
  const marginY = 100;
  const targetAreaW = graphW - marginX * 2;
  const targetAreaH = graphH - marginY * 2;

  const mapX = (svgX: number) => graphX + marginX + (svgX / 640) * targetAreaW;
  const mapY = (svgY: number) => graphY + marginY + (svgY / 380) * targetAreaH;

  // Build node score map
  const scoreMap = new Map<number, number>();
  analysis.nodeScores.forEach((s) => scoreMap.set(s.nodeId, s.scorePct));

  // Extract undirected roads with capacity
  interface RoadItem {
    u: RoadNode;
    v: RoadNode;
    capacity: number;
    isPrimary: boolean;
    isClosed: boolean;
  }
  const roadList: RoadItem[] = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const cap = matrix[i]?.[j] ?? 0;
      if (cap > 0) {
        const isPrim =
          analysis.primaryHub !== null &&
          (i === analysis.primaryHub.nodeId || j === analysis.primaryHub.nodeId);
        const isClosed = i === closedNodeId || j === closedNodeId;
        roadList.push({
          u: nodes[i],
          v: nodes[j],
          capacity: cap,
          isPrimary: isPrim,
          isClosed,
        });
      }
    }
  }

  // Draw Primary Hub outer dashed orbit rings
  if (analysis.primaryHub && closedNodeId !== analysis.primaryHub.nodeId) {
    const hubNode = nodes.find((n) => n.id === analysis.primaryHub?.nodeId);
    if (hubNode) {
      const hX = mapX(hubNode.x);
      const hY = mapY(hubNode.y);

      ctx.save();
      ctx.strokeStyle = colors.brass;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 8]);
      ctx.globalAlpha = 0.55;

      ctx.beginPath();
      ctx.arc(hX, hY, 110, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hX, hY, 170, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Compute maximum road capacity in network
  const maxCap = Math.max(1, ...roadList.map((r) => r.capacity));

  // Draw Roads (Lines) with Visual Capacity Heatmap
  roadList.forEach((road) => {
    const x1 = mapX(road.u.x);
    const y1 = mapY(road.u.y);
    const x2 = mapX(road.v.x);
    const y2 = mapY(road.v.y);

    const ratio = Math.max(0, Math.min(1, road.capacity / maxCap));
    const isPeak = ratio >= 0.8;

    const strokeWidth = road.isClosed
      ? 4
      : Math.max(6, Math.min(22, 5 + road.capacity * 4));

    // Heatmap Colors
    const heatColor = road.isClosed
      ? '#94A3B8'
      : ratio >= 0.8
        ? '#DC2626' // Primary Arterial Crimson
        : ratio >= 0.5
          ? '#D97706' // Major Collector Amber
          : ratio >= 0.3
            ? colors.slateBlue // Connector
            : '#64748B'; // Local Feeder

    const heatGlowColor = road.isClosed
      ? 'transparent'
      : ratio >= 0.8
        ? 'rgba(220, 38, 38, 0.4)'
        : ratio >= 0.5
          ? 'rgba(217, 119, 6, 0.35)'
          : ratio >= 0.3
            ? 'rgba(63, 84, 104, 0.25)'
            : 'rgba(100, 116, 139, 0.18)';

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Heatmap aura glow underlay
    if (!road.isClosed) {
      ctx.strokeStyle = heatGlowColor;
      ctx.lineWidth = strokeWidth + Math.round(14 * ratio + 8);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 2. Core road line
    if (road.isClosed) {
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = strokeWidth;
      ctx.setLineDash([10, 10]);
      ctx.globalAlpha = 0.45;
    } else {
      ctx.strokeStyle = heatColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 0.95;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 3. Arterial highway dashed center marking
    if (!road.isClosed && isPeak && strokeWidth >= 12) {
      ctx.strokeStyle = '#FFF7ED';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();

    // Road Lane Indicator Pill at Midpoint
    if (!road.isClosed && road.capacity > 0) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const pillText = `${road.capacity} ${road.capacity === 1 ? 'lane' : 'lanes'} (${Math.round(ratio * 100)}% cap)`;
      drawRoundedPill(ctx, midX, midY, pillText, colors.cardBg, heatColor, colors.textMain);
    }
  });

  // Draw Intersections (Nodes)
  nodes.forEach((node) => {
    const isClosed = node.id === closedNodeId;
    const scorePct = scoreMap.get(node.id) ?? 0;
    const isPrimaryHub = analysis.primaryHub?.nodeId === node.id && !isClosed;

    const nX = mapX(node.x);
    const nY = mapY(node.y);

    // Node radius scales with importance score (34px to 54px)
    const baseRadius = isClosed ? 32 : Math.max(34, Math.min(54, 32 + (scorePct / 100) * 22));

    ctx.save();

    // Shadow
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    // Outer color ring
    let ringColor = colors.slateBlue;
    if (isClosed) {
      ringColor = colors.red;
    } else if (isPrimaryHub) {
      ringColor = colors.brass;
    } else if (scorePct >= 75) {
      ringColor = colors.brass;
    } else if (scorePct < 40) {
      ringColor = colors.slateLight;
    }

    // Outer Ring Stroke
    ctx.fillStyle = ringColor;
    ctx.beginPath();
    ctx.arc(nX, nY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Inner White / Card Body
    ctx.beginPath();
    ctx.arc(nX, nY, baseRadius - 5, 0, Math.PI * 2);
    ctx.fillStyle = isClosed ? (isDark ? '#2D1A1A' : '#FEF2F2') : colors.cardBg;
    ctx.fill();

    ctx.restore();

    // Node Code Label inside circle (e.g. v1, v2)
    ctx.fillStyle = isClosed ? colors.red : isPrimaryHub ? colors.brass : colors.textMain;
    ctx.font = `bold ${Math.round(baseRadius * 0.58)}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.code, nX, nY - 2);

    // Node Name & Stats Banner directly below node
    const bannerY = nY + baseRadius + 22;
    const bannerTitle = node.name;
    const bannerSubtitle = isClosed
      ? '⛔ TEMPORARILY CLOSED'
      : `${scorePct}% Importance • ${analysis.nodeScores[node.id]?.degree ?? 0} roads`;

    // Pill background for readability
    ctx.font = 'bold 16px "IBM Plex Sans", sans-serif';
    const textWidth = Math.max(ctx.measureText(bannerTitle).width, 140);
    const bW = textWidth + 36;
    const bH = 46;

    drawRoundedRect(
      ctx,
      nX - bW / 2,
      bannerY - 14,
      bW,
      bH,
      10,
      isPrimaryHub ? (isDark ? '#2D2517' : '#FFFDF7') : colors.cardBg,
      isPrimaryHub ? colors.brass : colors.border
    );

    // Draw Name text
    ctx.fillStyle = isClosed ? colors.red : colors.textMain;
    ctx.font = 'bold 16px "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(bannerTitle, nX, bannerY - 8);

    // Draw Subtitle / Score text
    ctx.fillStyle = isClosed ? colors.red : isPrimaryHub ? colors.brass : colors.textMuted;
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText(bannerSubtitle, nX, bannerY + 12);
  });

  ctx.restore();

  // 5. Bottom Legend & Planning Footer
  const footerY = height - 150;
  drawRoundedRect(ctx, 40, footerY, width - 80, 105, 14, colors.cardBg, colors.border);

  // Left side: Legend keys
  const legY = footerY + 28;

  // Key 1: Primary Hub
  ctx.fillStyle = colors.brass;
  ctx.beginPath();
  ctx.arc(80, legY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.textMain;
  ctx.font = '600 14px "IBM Plex Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Primary Transit Hub (Dominant Eigenvector Peak)', 102, legY + 5);

  // Key 2: Road Capacity Heatmap
  ctx.strokeStyle = '#DC2626';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(520, legY);
  ctx.lineTo(550, legY);
  ctx.stroke();

  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(555, legY);
  ctx.lineTo(580, legY);
  ctx.stroke();

  ctx.fillStyle = colors.textMain;
  ctx.font = '600 14px "IBM Plex Sans", sans-serif';
  ctx.fillText('Capacity Heatmap (Arterial 100% • Collector • Feeder)', 595, legY + 5);

  // Key 3: Closed Detour
  ctx.strokeStyle = colors.red;
  ctx.lineWidth = 4;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(980, legY);
  ctx.lineTo(1020, legY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = colors.textMain;
  ctx.font = '600 14px "IBM Plex Sans", sans-serif';
  ctx.fillText('Closed Segment (Detour simulation)', 1035, legY + 5);

  // Second legend row: Linear Algebra & Mathematical Grounding
  const subLegY = footerY + 68;
  ctx.fillStyle = colors.textMuted;
  ctx.font = '500 13px "IBM Plex Sans", sans-serif';
  ctx.fillText(
    'Mathematical Basis: Centrality A · v₁ = λ₁ · v₁  •  Graph Laplacian L = D - A  •  Rank Independence Dim(V) = Rank + Nullity',
    80,
    subLegY
  );

  // Right side citation
  ctx.fillStyle = colors.textFaint;
  ctx.textAlign = 'right';
  ctx.fillText('Generated with FlowSpectral Urban Structural Analyzer • High-Resolution Vector Export (2400×1500)', width - 70, subLegY);

  // 6. Convert canvas to PNG and trigger automatic download
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const citySlug = cityName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const fileName = `flowspectral-${citySlug || 'city'}-presentation-map.png`;

  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

/**
 * Helper to draw a crisp rounded rectangle on Canvas 2D
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: string,
  strokeColor?: string,
  lineWidth: number = 1
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Helper to draw a centered text badge/pill on Canvas 2D
 */
function drawRoundedPill(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  text: string,
  bgColor: string,
  borderColor: string,
  textColor: string
) {
  ctx.save();
  ctx.font = 'bold 12px "IBM Plex Sans", sans-serif';
  const metrics = ctx.measureText(text);
  const paddingX = 10;
  const pillW = metrics.width + paddingX * 2;
  const pillH = 22;
  const pX = centerX - pillW / 2;
  const pY = centerY - pillH / 2;

  drawRoundedRect(ctx, pX, pY, pillW, pillH, 11, bgColor, borderColor, 1);

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, centerX, centerY + 0.5);
  ctx.restore();
}
