import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { SmartInsight, Transaction } from '../types';
import { api } from '../lib/api';
import Markdown from 'react-markdown';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  Send,
  Loader2,
  Bot,
  Zap,
  CheckCircle2
} from 'lucide-react';

interface SmartInsightsViewProps {
  insights: SmartInsight[];
  currency: string;
  transactions: Transaction[];
  onOpenAddTransaction: () => void;
  onOpenAiAdvisor: () => void;
}

export const SmartInsightsView: React.FC<SmartInsightsViewProps> = ({
  insights,
  currency,
  transactions,
  onOpenAddTransaction,
  onOpenAiAdvisor,
}) => {
  const { t } = useI18n();
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatResponse, setChatResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (q?: string) => {
    const text = q || chatPrompt;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await api.askAiAdvisor(text);
      setChatResponse(res.advice);
      if (!q) setChatPrompt('');
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string, severity?: string) => {
    if (severity === 'danger' || type === 'spending_spike' || type === 'budget_alert') return AlertTriangle;
    if (severity === 'success' || type === 'positive_habit' || type === 'savings_forecast') return ShieldCheck;
    if (type === 'highest_category') return Lightbulb;
    return TrendingUp;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-800 to-slate-900 text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Financial Intelligence</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {t('nav_insights')} & AI Advisory
          </h2>
          <p className="text-xs text-teal-100 max-w-md mt-1">
            Real-time rule-based heuristics paired with Gemini generative AI to optimize your cashflow and savings velocity.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAiAdvisor}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Bot className="w-4 h-4" />
          <span>Launch AI Coach Dialog</span>
        </button>
      </div>

      {/* Rule-based Heuristic Insights Grid */}
      <div>
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
          Portfolio Diagnoses & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-teal-600" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                All financial indicators look balanced!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Record more transactions to unlock deeper historical velocity metrics.
              </p>
            </div>
          ) : (
            insights.map((insight) => {
              const IconComp = getInsightIcon(insight.type, insight.severity);
              const isWarning = insight.severity === 'danger' || insight.severity === 'warning';
              const isSuccess = insight.severity === 'success';

              const titleText = (insight as any).title || (insight.titleKey ? t(insight.titleKey, insight.params) : 'Insight');
              const messageText = (insight as any).message || (insight.descriptionKey ? t(insight.descriptionKey, insight.params) : '');
              const actionText = (insight as any).actionLabel || (insight.actionTextKey ? t(insight.actionTextKey) : null);

              return (
                <div
                  key={insight.id}
                  className={`p-5 rounded-3xl border transition flex items-start gap-4 ${
                    isWarning
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                      : isSuccess
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                      : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className={`p-3 rounded-2xl shrink-0 ${
                    isWarning
                      ? 'bg-amber-500 text-white'
                      : isSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-700 text-white'
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                      {titleText}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                      {messageText}
                    </p>
                    {actionText && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Action: {actionText}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Interactive AI Query Terminal */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Direct AI Financial Consultation
            </h3>
            <p className="text-xs text-slate-400">Ask strategic questions regarding your actual ledger data</p>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="flex flex-wrap gap-2">
          {[
            'Calculate my monthly savings rate',
            'How can I cut expenses without lifestyle pain?',
            'What is the 50/30/20 rule breakdown for my income?'
          ].map((promptText, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleAsk(promptText)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>

        {chatResponse && (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="markdown-body text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none">
              <Markdown>{chatResponse}</Markdown>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2 pt-2"
        >
          <input
            id="insights-chat-input"
            type="text"
            value={chatPrompt}
            onChange={(e) => setChatPrompt(e.target.value)}
            placeholder="Type your financial question..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            disabled={loading}
          />
          <button
            id="insights-chat-btn"
            type="submit"
            disabled={loading || !chatPrompt.trim()}
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl shadow-xs font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Consult</span>
          </button>
        </form>
      </div>
    </div>
  );
};
