import React, { useState, useRef, useEffect } from 'react';
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
  User,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCurrency: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const PROMPT_SUGGESTIONS = [
  { en: 'How can I save 20% more of my income this month?', bn: 'আমার আয়ের ২০% অতিরিক্ত কীভাবে সঞ্চয় করতে পারি?' },
  { en: 'Analyze my food and dining expenses and suggest cutbacks.', bn: 'খাবার ও রেস্তোরাঁর খরচ কীভাবে সাশ্রয় করব?' },
  { en: 'Do I have enough emergency fund buffer right now?', bn: 'আমার কি পর্যাপ্ত জরুরি সঞ্চয় তহবিল আছে?' },
  { en: 'Calculate my daily spending limit to stay under budget.', bn: 'বাজেট নিয়ন্ত্রণে রাখতে আমার দৈনিক খরচের সীমা কত হওয়া উচিত?' },
];

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  defaultCurrency,
}) => {
  const { t, language } = useI18n();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, loading]);

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const res = await api.askAiAdvisor(q);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.advice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to AI Advisor');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-850 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[90vh] sm:h-[82vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/80 bg-gradient-to-r from-teal-50/70 to-emerald-50/50 dark:from-slate-900 dark:to-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-700/25">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Hishab AI Coach
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded-full">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instant tailored answers grounded in your real financial portfolio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                title="Clear Conversation"
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="space-y-4 py-3">
              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50 flex items-start gap-3">
                <Bot className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-bold text-teal-900 dark:text-teal-200 mb-1">
                    {language === 'bn' ? 'আসসালামু আলাইকুম! আমি আপনার এআই ওয়েলথ কোচ।' : 'Welcome! I am your AI Wealth Coach.'}
                  </p>
                  <p>
                    {language === 'bn'
                      ? 'যেকোনো আর্থিক প্রশ্ন বাংলায় বা ইংরেজিতে করুন। আমি আপনার আসল ব্যালেন্স, খরচ এবং সঞ্চয় লক্ষ্য বিশ্লেষণ করে তাৎক্ষণিক সঠিক উত্তর দেব।'
                      : 'Ask any financial question in English or Bengali. I analyze your real wallets, expenses, and savings goals to give immediate actionable advice.'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                  {language === 'bn' ? 'প্রস্তাবিত কিছু প্রশ্ন:' : 'Smart Suggested Inquiries:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PROMPT_SUGGESTIONS.map((sug, idx) => {
                    const promptText = language === 'bn' ? sug.bn : sug.en;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAsk(promptText)}
                        className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/40 text-left hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:border-teal-300 dark:hover:border-teal-700 transition cursor-pointer group"
                      >
                        <div className="flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                            {promptText}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-teal-700 text-white rounded-tr-xs shadow-sm font-medium'
                    : 'bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200 dark:border-slate-700/80 shadow-xs'
                }`}
              >
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                ) : (
                  <div className="markdown-body prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
                <span
                  className={`text-[10px] block mt-1.5 ${
                    msg.sender === 'user' ? 'text-teal-200 text-right' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div className="flex items-start gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-spin" />
                <span className="font-semibold">
                  {language === 'bn' ? 'আপনার আর্থিক তথ্য বিশ্লেষণ করা হচ্ছে...' : 'Analyzing your financial data & calculating insights...'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-700/80 bg-white dark:bg-slate-850">
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
              placeholder={
                language === 'bn'
                  ? 'আপনার সঞ্চয়, বাজেট বা খরচ সম্পর্কে যেকোনো প্রশ্ন লিখুন...'
                  : 'Ask anything about your savings, budget, or spending...'
              }
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 transition"
              disabled={loading}
            />
            <button
              id="ai-ask-submit-btn"
              type="submit"
              disabled={loading || !question.trim()}
              className="px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl shadow-md shadow-teal-700/20 font-bold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'bn' ? 'পাঠান' : 'Ask'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
