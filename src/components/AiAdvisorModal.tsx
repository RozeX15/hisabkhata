import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { api } from '../lib/api';
import Markdown from 'react-markdown';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  Lightbulb,
  TrendingUp,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCurrency: string;
}

const PROMPT_SUGGESTIONS = [
  'How can I save 20% more of my salary this month?',
  'Analyze my top spending categories and suggest cutbacks.',
  'Am I on track to build a 6-month emergency fund?',
  'How should I allocate my cashflow between debt repayment and investing?',
];

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  defaultCurrency,
}) => {
  const { t } = useI18n();
  const [question, setQuestion] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.askAiAdvisor(q.trim());
      setAdvice(res.advice);
      setMetrics(res.metrics);
      if (!queryText) setQuestion('');
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI Advisor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 bg-gradient-to-r from-teal-50/50 to-emerald-50/50 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-700/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Hishab AI Wealth Coach</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded-full">
                  Gemini 2.5
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalized portfolio analysis & actionable financial intelligence
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* Quick Suggestions if no conversation yet */}
          {!advice && !loading && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select a smart financial query
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMPT_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAsk(sug)}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-left hover:bg-teal-50/60 dark:hover:bg-teal-950/30 hover:border-teal-300 dark:hover:border-teal-800 transition cursor-pointer group"
                  >
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {sug}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Analyzing your wallets, transactions, and goals...
              </p>
              <p className="text-xs text-slate-400">
                Evaluating spending velocities and calculating optimal budget allocations.
              </p>
            </div>
          )}

          {/* Advice Output */}
          {advice && !loading && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
              <div className="markdown-body text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none">
                <Markdown>{advice}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="ai-question-input"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your budget, savings, or spending..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              disabled={loading}
            />
            <button
              id="ai-ask-submit-btn"
              type="submit"
              disabled={loading || !question.trim()}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-md shadow-teal-700/20 font-bold text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
