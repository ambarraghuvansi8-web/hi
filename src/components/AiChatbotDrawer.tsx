import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  AlertCircle,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { NetworkAnalysisResult, RoadNode } from '../types/network';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AiChatbotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: RoadNode[];
  matrix: number[][];
  analysis: NetworkAnalysisResult;
  selectedPresetName: string;
}

export const AiChatbotDrawer: React.FC<AiChatbotDrawerProps> = ({
  isOpen,
  onClose,
  nodes,
  matrix,
  analysis,
  selectedPresetName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your FlowSpectral Urban Assistant. I have loaded your current road network (**${selectedPresetName}**). 

The primary traffic hub right now is **${analysis.primaryHub ? analysis.primaryHub.name : 'none'}**, and overall network connectivity is **${analysis.backupRoutes.rating}**. 

Feel free to ask me anything about your city's traffic flow, bottlenecks, or how linear algebra analyzes these roads!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build live network context to feed Gemini
  const buildNetworkContext = () => {
    return {
      cityName: selectedPresetName,
      totalIntersections: nodes.length,
      totalRoads: analysis.edgeCount,
      primaryHub: analysis.primaryHub
        ? {
            name: analysis.primaryHub.name,
            degree: analysis.primaryHub.degree,
            score: analysis.primaryHub.scorePct,
            betweenness: analysis.primaryHub.betweenness,
          }
        : null,
      backupRoutes: analysis.backupRoutes,
      weakSpots: analysis.weakSpots.map((w) => w.name),
      isDisconnected: analysis.isDisconnected,
      intersections: analysis.nodeScores.map((s) => ({
        name: s.name,
        importanceScore: s.scorePct,
        connectedRoads: s.degree,
        role: s.classification,
      })),
      mathematics: {
        dominantEigenvalue: analysis.dominantEigenvalue,
        determinant: analysis.determinant,
        rank: analysis.rank,
        nullity: analysis.nullity,
        algebraicConnectivity: analysis.algebraicConnectivity,
      },
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const promptText = (textToSend ?? input).trim();
    if (!promptText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          networkContext: buildNetworkContext(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'Server error');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I analyzed the roads, but could not produce a response.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errMsg = err instanceof Error ? err.message : 'Could not reach assistant';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. How can I help you analyze the **${selectedPresetName}** road network today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
  };

  // Quick prompt chips
  const suggestedQuestions = [
    'Explain my city traffic in simple terms',
    'Where is the biggest bottleneck right now?',
    'What happens if the main hub closes?',
    'How do backup routes and rank work here?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-lg bg-[var(--bg-app)] border-l border-[var(--border-subtle)] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brass-tint)] text-[var(--color-brass)] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[var(--text-main)] flex items-center gap-1.5">
                <span>AI Urban Assistant</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-slate-tint)] text-[var(--color-slate-blue)]">
                  Live Network Context
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Ask about bottlenecks, detours, or the linear algebra
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              title="Clear chat history"
              aria-label="Clear chat history"
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close AI Assistant"
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-card-subtle)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                    isUser
                      ? 'bg-[var(--color-slate-blue)] text-white'
                      : 'bg-[var(--color-brass-tint)] text-[var(--color-brass)] border border-[var(--border-subtle)]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[var(--color-slate-blue)] text-white rounded-tr-none'
                      : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-main)] rounded-tl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`text-[10px] mt-1.5 font-mono ${
                      isUser ? 'text-white/70 text-right' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-xl bg-[var(--color-brass-tint)] text-[var(--color-brass)] flex items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl rounded-tl-none p-3.5 text-sm text-[var(--text-muted)] flex items-center gap-2 shadow-xs">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--color-brass)]" />
                <span>Analyzing road network and drafting answer...</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div className="flex-1">{error}</div>
              <button
                type="button"
                onClick={() => handleSendMessage()}
                className="underline font-semibold cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] overflow-x-auto flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[var(--text-muted)] font-medium shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-[var(--color-brass)]" />
            <span>Try:</span>
          </span>
          {suggestedQuestions.map((question, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => handleSendMessage(question)}
              className="text-xs px-2.5 py-1 rounded-lg bg-[var(--bg-card-subtle)] hover:bg-[var(--color-slate-tint-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              {question}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask a question about this road network..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-slate-blue)] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="p-2.5 rounded-xl bg-[var(--color-brass)] text-white hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-[10px] text-center text-[var(--text-muted)]">
            Powered by Gemini 3.8 Flash • Understands current intersections, roads, and scores
          </div>
        </div>
      </div>
    </div>
  );
};
