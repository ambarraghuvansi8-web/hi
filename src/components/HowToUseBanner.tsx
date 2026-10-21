import React from 'react';
import { HelpCircle, X, Sparkles, MapPin, Shuffle } from 'lucide-react';

interface HowToUseBannerProps {
  onDismiss: () => void;
  onOpenChat: () => void;
}

export const HowToUseBanner: React.FC<HowToUseBannerProps> = ({
  onDismiss,
  onOpenChat,
}) => {
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-4 sm:p-5 shadow-xs relative overflow-hidden transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-brass-tint)] text-[var(--color-brass)] flex items-center justify-center shrink-0">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-semibold text-base sm:text-lg text-[var(--text-main)]">
              Welcome to FlowSpectral — How to use this app
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-muted)]">
              You do not need any math knowledge to explore and analyze traffic flow! Here is a 3-step guide:
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss guide"
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2">
        {/* Step 1 */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[var(--color-slate-blue)]">
            <MapPin className="w-3.5 h-3.5" />
            <span>1. Read the Map</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Circles are intersections. <strong>Larger circles</strong> carry more city traffic. The most important hub has a gentle ring. <strong>Thicker road lines</strong> represent wider multi-lane roads.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[var(--color-brass)]">
            <Shuffle className="w-3.5 h-3.5" />
            <span>2. Test Closures &amp; Detours</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Click any intersection and press <strong>&quot;What if this closes?&quot;</strong> to simulate traffic detours live. Click any road to change lane capacity with a slider.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-[var(--color-slate-blue)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-brass)]" />
            <span>3. Ask the AI Assistant</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Need advice? Click the <strong>AI Assistant</strong> to ask questions in plain English about bottlenecks, weak spots, or the math behind your city.
          </p>
        </div>
      </div>

      {/* Action footer */}
      <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-[var(--text-muted)]">
          Tip: You can re-open this guide anytime from the top bar.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-brass-tint)] text-[var(--color-brass)] font-semibold hover:bg-[var(--color-brass-tint-hover)] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat with AI Assistant</span>
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl bg-[var(--bg-card-subtle)] text-[var(--text-main)] hover:bg-[var(--color-slate-tint-hover)] font-medium transition-colors cursor-pointer"
          >
            Got it, explore city
          </button>
        </div>
      </div>
    </div>
  );
};
