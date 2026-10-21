import React from 'react';
import {
  Compass,
  Sliders,
  Calculator,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
  HelpCircle,
  Camera,
} from 'lucide-react';
import { NETWORK_PRESETS } from '../data/presets';

interface FriendlyTopBarProps {
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onOpenEditNetwork: () => void;
  showMaths: boolean;
  onToggleMaths: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleHowToUse: () => void;
  showHowToUse: boolean;
  onOpenChat: () => void;
  onExportPng?: () => void;
}

export const FriendlyTopBar: React.FC<FriendlyTopBarProps> = ({
  selectedPresetId,
  onSelectPreset,
  onOpenEditNetwork,
  showMaths,
  onToggleMaths,
  theme,
  onToggleTheme,
  onToggleHowToUse,
  showHowToUse,
  onOpenChat,
  onExportPng,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[var(--bg-card)]/90 backdrop-blur-md border-b border-[var(--border-subtle)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: App title and subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-slate-tint)] text-[var(--color-slate-blue)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-lg sm:text-xl text-[var(--text-main)] tracking-tight leading-tight">
              FlowSpectral
            </h1>
            <p className="text-xs text-[var(--text-muted)] hidden sm:block">
              City road network analyzer
            </p>
          </div>
        </div>

        {/* Center/Right: City picker and controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          {/* Example city dropdown */}
          <div className="relative">
            <select
              aria-label="Choose an example city network"
              value={selectedPresetId}
              onChange={(e) => onSelectPreset(e.target.value)}
              className="appearance-none bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] text-[var(--text-main)] text-sm font-medium pl-3 pr-8 py-2 rounded-xl border border-[var(--border-subtle)] focus:outline-none transition-colors cursor-pointer"
            >
              {NETWORK_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* How to use button */}
          <button
            type="button"
            onClick={onToggleHowToUse}
            title="How to use this app"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-colors cursor-pointer ${
              showHowToUse
                ? 'bg-[var(--color-slate-tint)] text-[var(--color-slate-blue)] border-[var(--color-slate-blue)] font-semibold'
                : 'bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-[var(--border-subtle)]'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-[var(--color-slate-blue)]" />
            <span className="hidden md:inline">How to use</span>
          </button>

          {/* Edit network button */}
          <button
            type="button"
            onClick={onOpenEditNetwork}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-[var(--color-slate-blue)]" />
            <span className="hidden sm:inline">Edit network</span>
          </button>

          {/* AI Chatbot button */}
          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-[var(--color-brass)] hover:opacity-90 text-white shadow-xs transition-opacity cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assistant</span>
          </button>

          {/* Show the maths toggle */}
          <button
            type="button"
            onClick={onToggleMaths}
            aria-pressed={showMaths}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border transition-colors cursor-pointer ${
              showMaths
                ? 'bg-[var(--color-brass-tint)] text-[var(--color-brass)] border-[var(--color-brass)] font-semibold shadow-xs'
                : 'bg-[var(--bg-card-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)] border-[var(--border-subtle)]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="hidden lg:inline">Show the maths</span>
          </button>

          {/* Export PNG presentation map button */}
          {onExportPng && (
            <button
              type="button"
              onClick={onExportPng}
              title="Download presentation map PNG (2400×1500)"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4 text-[var(--color-brass)]" />
              <span className="hidden xl:inline">Export PNG</span>
            </button>
          )}

          {/* Light / Dark theme toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
