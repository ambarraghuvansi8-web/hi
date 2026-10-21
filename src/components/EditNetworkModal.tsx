import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowRightLeft } from 'lucide-react';
import { RoadNode } from '../types/network';

interface EditNetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: RoadNode[];
  matrix: number[][];
  onUpdateRoadCapacity: (u: number, v: number, capacity: number) => void;
  onAddIntersection: (name: string) => void;
  onRemoveIntersection: (nodeId: number) => void;
  onAddRoad: (u: number, v: number, capacity: number) => void;
}

export const EditNetworkModal: React.FC<EditNetworkModalProps> = ({
  isOpen,
  onClose,
  nodes,
  matrix,
  onUpdateRoadCapacity,
  onAddIntersection,
  onRemoveIntersection,
  onAddRoad,
}) => {
  const [newIntersectionName, setNewIntersectionName] = useState('');
  const [roadFrom, setRoadFrom] = useState<number>(0);
  const [roadTo, setRoadTo] = useState<number>(nodes.length > 1 ? 1 : 0);
  const [roadLanes, setRoadLanes] = useState<number>(1);

  if (!isOpen) return null;

  // Extract all existing connected roads (where capacity > 0)
  const existingRoads: Array<{
    u: RoadNode;
    v: RoadNode;
    capacity: number;
  }> = [];

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const cap = matrix[i]?.[j] ?? 0;
      if (cap > 0) {
        existingRoads.push({
          u: nodes[i],
          v: nodes[j],
          capacity: cap,
        });
      }
    }
  }

  const handleAddIntersectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntersectionName.trim()) return;
    onAddIntersection(newIntersectionName.trim());
    setNewIntersectionName('');
  };

  const handleAddRoadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roadFrom === roadTo) return;
    onAddRoad(roadFrom, roadTo, roadLanes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-xl bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">
              Edit road network
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Adjust lane capacities, open or close routes, and add intersections
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Roads List with Sliders */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-slate-blue)] mb-3">
            Existing roads ({existingRoads.length})
          </h3>

          {existingRoads.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic py-3">
              No roads currently exist. Use the form below to connect intersections.
            </p>
          ) : (
            <div className="space-y-3">
              {existingRoads.map((road) => (
                <div
                  key={`road-${road.u.id}-${road.v.id}`}
                  className="p-3 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)]">
                    <span>{road.u.name}</span>
                    <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span>{road.v.name}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[var(--text-muted)]">
                        {road.capacity} {road.capacity === 1 ? 'lane' : 'lanes'}:
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        step="1"
                        value={road.capacity}
                        onChange={(e) =>
                          onUpdateRoadCapacity(road.u.id, road.v.id, parseInt(e.target.value, 10))
                        }
                        className="w-24 accent-[var(--color-brass)] cursor-pointer"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => onUpdateRoadCapacity(road.u.id, road.v.id, 0)}
                      className="px-2.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      Close road
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Road Section */}
        <div className="mb-6 pt-4 border-t border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-slate-blue)] mb-3">
            Connect two intersections
          </h3>

          <form onSubmit={handleAddRoadSubmit} className="flex flex-col sm:flex-row items-end gap-2.5">
            <div className="w-full sm:flex-1">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                From
              </label>
              <select
                value={roadFrom}
                onChange={(e) => setRoadFrom(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)]"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:flex-1">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                To
              </label>
              <select
                value={roadTo}
                onChange={(e) => setRoadTo(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)]"
              >
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-24">
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                Lanes
              </label>
              <select
                value={roadLanes}
                onChange={(e) => setRoadLanes(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-sm rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)]"
              >
                <option value={1}>1 lane</option>
                <option value={2}>2 lanes</option>
                <option value={3}>3 lanes</option>
                <option value={4}>4 lanes</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={roadFrom === roadTo}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--color-slate-blue)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
            >
              Add road
            </button>
          </form>
        </div>

        {/* Add Intersection Section */}
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-slate-blue)] mb-3">
            Add a new intersection
          </h3>

          <form onSubmit={handleAddIntersectionSubmit} className="flex gap-2.5">
            <input
              type="text"
              placeholder="e.g. Market Square, Riverfront Ave"
              value={newIntersectionName}
              onChange={(e) => setNewIntersectionName(e.target.value)}
              className="flex-1 px-3 py-2 text-sm rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newIntersectionName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--color-brass)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add intersection</span>
            </button>
          </form>

          {/* List of current intersections with remove option */}
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2 items-center">
            <span className="text-xs text-[var(--text-muted)]">Intersections:</span>
            {nodes.map((n) => (
              <span
                key={n.id}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] text-[var(--text-main)] border border-[var(--border-subtle)]"
              >
                <span>{n.name}</span>
                {nodes.length > 3 && (
                  <button
                    type="button"
                    onClick={() => onRemoveIntersection(n.id)}
                    title={`Remove ${n.name}`}
                    className="hover:text-red-500 cursor-pointer ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Footer Done Button */}
        <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-[var(--color-slate-blue)] text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
