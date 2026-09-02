import React, { useState } from 'react';
import { usePWAInstall } from '../lib/usePWAInstall';
import {
  Download,
  Smartphone,
  Laptop,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  Zap,
  Globe,
  WifiOff,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, install } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setInstallSuccess(true);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        
        {/* Header with App Banner */}
        <div className="relative p-6 bg-gradient-to-br from-teal-800 via-teal-700 to-slate-900 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-teal-700 p-2 shadow-lg flex items-center justify-center shrink-0">
              <img src="/icon.svg" alt="Hishab Khata" className="w-10 h-10 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Mobile & Desktop App
                </span>
                <span className="text-xs text-teal-200">v2.4.1</span>
              </div>
              <h2 className="text-xl font-black tracking-tight mt-1">
                Install Hishab Khata App
              </h2>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Fast, secure offline-ready personal finance app on your device
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Quick Features List */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-900 dark:text-white">Instant Launch</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">No App Store wait</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <WifiOff className="w-4 h-4 text-teal-500 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-900 dark:text-white">Offline Ready</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Works without net</div>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-900 dark:text-white">100% Secure</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Encrypted data</div>
            </div>
          </div>

          {/* 1-Click Browser Install Button (if browser supports beforeinstallprompt) */}
          {isInstallable && !isInstalled && !installSuccess && (
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      1-Click Direct Install Ready
                    </h4>
                    <p className="text-[11px] text-teal-700 dark:text-teal-300">
                      Your browser supports instant 1-tap installation!
                    </p>
                  </div>
                </div>
                <button
                  id="pwa-direct-install-btn"
                  onClick={handleNativeInstall}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-extrabold text-xs shadow-md shadow-teal-700/30 transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Install Now</span>
                </button>
              </div>
            </div>
          )}

          {installSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                Installation Triggered!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                The app is now added to your home screen / app menu.
              </p>
            </div>
          )}

          {/* Platform Tab Switcher */}
          <div>
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-3">
              <button
                type="button"
                onClick={() => setActivePlatform('android')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePlatform === 'android'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('ios')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePlatform === 'ios'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePlatform('desktop')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activePlatform === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>PC / Laptop</span>
              </button>
            </div>

            {/* Platform Guides */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-3">
              {activePlatform === 'android' && (
                <>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Android (Chrome / Samsung Internet / Edge):
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                    <li>
                      ব্রাউজারের উপরের ডান কোণায় <strong>৩টি ডট (Menu ⋮)</strong> আইকনে ট্যাপ করুন।
                    </li>
                    <li>
                      মেনু থেকে <strong>"Install app"</strong> অথবা <strong>"Add to Home screen"</strong> নির্বাচন করুন।
                    </li>
                    <li>
                      কনফার্মেশন ডায়ালগে <strong>"Install"</strong> বাটনে ক্লিক করলেই আপনার ফোনে অ্যাপ যুক্ত হয়ে যাবে।
                    </li>
                  </ol>
                </>
              )}

              {activePlatform === 'ios' && (
                <>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    iPhone / iPad (Safari Browser):
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-1.5 flex-wrap">
                      <span>Safari ব্রাউজারের নিচে থাকা</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-bold text-[11px]">
                        <Share2 className="w-3 h-3 text-blue-500" /> Share
                      </span>
                      <span>বাটনে ট্যাপ করুন।</span>
                    </li>
                    <li className="flex items-center gap-1.5 flex-wrap">
                      <span>একটু নিচে স্ক্রল করে</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-bold text-[11px]">
                        <PlusSquare className="w-3 h-3 text-emerald-500" /> Add to Home Screen
                      </span>
                      <span>অপশনটিতে চাপ দিন।</span>
                    </li>
                    <li>
                      উপরের ডান পাশের <strong>"Add"</strong> বাটনে ট্যাপ করলেই হোম স্ক্রিনে অ্যাপ আইকন চলে আসবে।
                    </li>
                  </ol>
                </>
              )}

              {activePlatform === 'desktop' && (
                <>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Windows, Mac & Linux (Chrome / Edge / Brave):
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
                    <li>
                      ব্রাউজারের URL অ্যাড্রেস বারের ডানপাশে থাকা <strong>Install Icon (⊕ বা 📥)</strong> এ ক্লিক করুন।
                    </li>
                    <li>
                      অথবা ব্রাউজার মেনু (⋮) &gt; <strong>Save and Share &gt; Install Hishab Khata</strong> নির্বাচন করুন।
                    </li>
                    <li>
                      এখন এটি আপনার ডেস্কটপে স্বতন্ত্র সফটওয়্যার উইন্ডো হিসেবে দ্রুত ওপেন হবে।
                    </li>
                  </ol>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
            >
              Got it, Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
