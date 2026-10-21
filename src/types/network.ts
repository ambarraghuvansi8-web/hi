export interface RoadNode {
  id: number;
  code: string;
  name: string;
  subtitle: string;
  x: number; // SVG coordinate in 640x380 viewBox
  y: number;
  isClosed?: boolean; // When temporarily closed in "What if this closes?" mode
}

export interface ValidationIssue {
  id: string;
  type: 'not-square' | 'asymmetric' | 'negative' | 'self-loop' | 'empty' | 'disconnected';
  severity: 'error' | 'warning';
  title: string;
  message: string;
  howToFix: string;
  row?: number;
  col?: number;
}

export interface GaussianStep {
  stepIndex: number;
  title: string;
  operationCode: string;
  explanation: string;
  matrix: number[][];
  activeRow: number | null;
  pivotRow: number | null;
  pivotCol: number | null;
  pivotsLocated: Array<{ row: number; col: number }>;
}

export interface PowerIterationStep {
  iteration: number;
  eigenvalueEstimate: number;
  residualNorm: number;
  deltaLambda: number;
  vector: number[];
}

export interface EigenSpectrumItem {
  index: number;
  symbol: string;
  eigenvalue: number;
  eigenvector: number[];
  singularValue: number;
  regimeLabel: string;
}

export interface NodeCentralityScore {
  nodeId: number;
  code: string;
  name: string;
  subtitle: string;
  degree: number;
  weightedDegree: number;
  eigenWeight: number; // Normalized L2 component
  scorePct: number; // 0 to 100% Importance score
  betweenness: number;
  classification: 'HUB' | 'CORRIDOR' | 'CONNECTOR' | 'FEEDER' | 'ISOLATED';
  statusLabel: string;
}

export interface ComputationLogEntry {
  id: string;
  stage: 'VALIDATION' | 'GAUSSIAN_RREF' | 'POWER_ITERATION' | 'SPECTRAL_DECOMP' | 'TOPOLOGY';
  formula: string;
  summary: string;
  detail: string;
}

export interface BackupRoutesAssessment {
  rating: 'Good' | 'Limited' | 'None';
  sentence: string;
}

export interface NetworkAnalysisResult {
  nodeCount: number;
  edgeCount: number;
  nonZeroEntries: number;
  totalEntries: number;
  densityPct: number;
  topologicalDensity: number;
  averageDegree: number;
  isValid: boolean;
  isSymmetric: boolean;
  isEmpty: boolean;
  isDisconnected: boolean;
  disconnectedMessage?: string;
  validationIssues: ValidationIssue[];

  // Plain-Language Friendly Synthesis
  primaryHub: NodeCentralityScore | null;
  hubReason: string;
  backupRoutes: BackupRoutesAssessment;
  weakSpots: RoadNode[]; // Intersections that would split the network if closed
  networkStrength: number; // Dominant eigenvalue in plain language
  resilience: number; // Algebraic connectivity (lambda 2)
  connectionPercentage: number; // How well connected (0-100%)

  // Rigorous Linear Algebra (for the Maths Teacher)
  rank: number;
  nullity: number;
  isFullRank: boolean;
  determinant: number;
  rrefMatrix: number[][];
  gaussianSteps: GaussianStep[];

  dominantEigenvalue: number;
  perronFrobeniusRadius: number;
  spectralGap: number;
  trace: number;
  algebraicConnectivity: number;
  conditionNumber: number;
  convergenceTimeMs: number;
  powerIterationSteps: PowerIterationStep[];
  eigenSpectrum: EigenSpectrumItem[];
  singularValues: number[];

  nodeScores: NodeCentralityScore[];
  redundancyLevel: 'Optimal' | 'Moderate' | 'Fragile' | 'Disconnected';
  logs: ComputationLogEntry[];
}

export interface NetworkPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  nodes: RoadNode[];
  matrix: number[][];
}
