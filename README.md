# FlowSpectral – Urban Road Network Structural Analyzer

A simple, friendly road network analyzer for city planners, students, and citizens, powered by linear algebra (eigenvalues, eigenvector centrality, matrix rank, and Gaussian elimination).

## Overview

- **Friendly by default**: Built for ordinary people, not math worksheets. Plain-language insights replace technical jargon.
- **Maths for the teacher**: A single "Show the maths" toggle opens the complete linear algebra suite, including the adjacency matrix, step-by-step Gaussian elimination player, eigenvalue spectrum bar chart, power iteration convergence line chart, and structural logs.
- **Interactive road map**:
  - Intersections sized and colored by their 0–100 Importance score.
  - Roads with line thickness indicating lane capacity.
  - Primary hub highlighted with a gentle ring.
  - Click any intersection to see what happens if it closes ("What if this closes?"), recalculating the entire city live.
  - Click any road to adjust its capacity (lanes) with a slider or close it.
  - Draggable intersections.
- **Three plain-language answer cards**:
  1. **Most important intersection**: Name and friendly reason.
  2. **Backup routes**: Good / Limited / None with a single summary sentence.
  3. **Weak spots**: Intersections that would split the network if closed, or "None found".
- **Ranked list**: Intersection name, horizontal bar, and an Importance score from 0 to 100.
- **Visual styling**:
  - Two colors: slate blue (`#3F5468`) and muted brass (`#8C6B38`), plus white and soft tints.
  - Light theme by default, optional dark theme.
  - Readable sans-serif font (Inter / IBM Plex Sans) with 16px body text.
- **Rigorous mathematical correctness**:
  - Zero hard-coded values; every metric is genuinely computed from the matrix.
  - For the default 5-intersection network: dominant eigenvalue $\lambda_1 = 2.9354$, $\det(A) = -2$, full rank $5/5$.
