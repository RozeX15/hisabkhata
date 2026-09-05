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
  Zap,
  WifiOff,
  ShieldCheck,
  ExternalLink,
  FileCode2,
  Sparkles
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isDesktop, isInIframe, install, openInAppWindow } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios' | 'desktop'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });
  const [installSuccess, setInstallSuccess] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleNativeInstall = async () => {
    setIsInstalling(true);
    try {
      if (isInstallable) {
        const accepted = await install();
        if (accepted) {
          setInstallSuccess(true);
        }
      } else if (isInIframe) {
        openInAppWindow();
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDownloadLauncher = () => {
    const appUrl = window.location.origin;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Hishab Khata App</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="manifest" href="${appUrl}/manifest.json">
<link rel="icon" href="${appUrl}/icon.svg">
<meta http-equiv="refresh" content="0; url=${appUrl}">
<style>
body { font-family: system-ui, -apple-system, sans-serif; background: #042F2E; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
.card { background: rgba(255,255,255,0.08); padding: 32px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15); max-width: 360px; }
h2 { margin: 0 0 8px; font-size: 22px; }
p { margin: 0 0 20px; color: #94A3B8; font-size: 13px; }
a { display: inline-block; background: #0D9488; color: #fff; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; }
</style>
</head>
<body>
<div class="card">
  <h2>Hishab Khata App</h2>
  <p>Redirecting to your smart finance app...</p>
  <a href="${appUrl}">Launch App Now</a>
</div>
<script>window.location.href = "${appUrl}";</script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HishabKhata-App.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        
        {/* Header with App Banner */}
        <div className="relative p-6 bg-gradient-to-br from-teal-800 via-teal-700 to-slate-900 text-white">
          <button
            id="download-app-close-btn"
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
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> One-Tap Install
                </span>
                <span className="text-xs text-teal-200">v2.4.1</span>
              </div>
              <h2 className="text-xl font-black tracking-tight mt-1">
                Install Hishab Khata App
              </h2>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Fast, 1-tap installation on Android, iPhone & Desktop
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Status: Already Installed */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                  App Already Installed!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Hishab Khata is running in standalone app mode on this device.
                </p>
              </div>
            </div>
          )}

          {/* Primary One-Tap Install Action */}
          {!isInstalled && !installSuccess && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 border border-teal-200/80 dark:border-teal-800/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-700/30">
                    <Download className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Instant One-Tap Install
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Add to home screen / app menu directly
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {isInstallable ? (
                  <button
                    id="pwa-one-tap-install-btn"
                    onClick={handleNativeInstall}
                    disabled={isInstalling}
                    className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-md shadow-teal-700/30 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isInstalling ? 'Installing...' : 'Install App Now (1-Tap)'}</span>
                  </button>
                ) : isInIframe ? (
                  <button
                    id="pwa-open-install-btn"
                    onClick={openInAppWindow}
                    className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-md shadow-teal-700/30 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Window to Install</span>
                  </button>
                ) : isIOS ? (
                  <div className="w-full py-2.5 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs font-semibold flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Tap <strong>Share</strong> in Safari &gt; tap <strong>Add to Home Screen</strong></span>
                  </div>
                ) : (
                  <button
                    id="pwa-direct-install-btn"
                    onClick={handleNativeInstall}
                    className="flex-1 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-md shadow-teal-700/30 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App (1-Tap)</span>
                  </button>
                )}

                <button
                  id="pwa-download-launcher-btn"
                  onClick={handleDownloadLauncher}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 border border-slate-200 dark:border-slate-700"
                  title="Download instant offline launcher file (.html)"
                >
                  <FileCode2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Download Shortcut</span>
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
                The app is now added to your home screen / app menu. You can launch it anytime.
              </p>
            </div>
          )}

          {/* Quick Features List */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <div className="text-[11px] font-bold text-slate-900 dark:text-white">Instant Launch</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">No Play Store wait</div>
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
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-2.5">
              {activePlatform === 'android' && (
                <>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Android (Chrome / Samsung Internet / Edge):
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>
                      উপরের <strong>"Install App Now (1-Tap)"</strong> বাটনে চাপ দিন।
                    </li>
                    <li>
                      অথবা ব্রাউজারের <strong>Menu (⋮)</strong> থেকে <strong>"Install app"</strong> বা <strong>"Add to Home screen"</strong> সিলেক্ট করুন।
                    </li>
                    <li>
                      কনফার্ম করলেই ফোনের হোম স্ক্রিনে অ্যাপ আইকন চলে আসবে।
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
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li className="flex items-center gap-1.5 flex-wrap">
                      <span>Safari ব্রাউজারের নিচে</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-bold text-[11px]">
                        <Share2 className="w-3 h-3 text-blue-500" /> Share
                      </span>
                      <span>আইকনে চাপ দিন।</span>
                    </li>
                    <li className="flex items-center gap-1.5 flex-wrap">
                      <span>নিচে স্ক্রল করে</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-bold text-[11px]">
                        <PlusSquare className="w-3 h-3 text-emerald-500" /> Add to Home Screen
                      </span>
                      <span>চাপ দিন।</span>
                    </li>
                    <li>
                      উপরের ডান পাশের <strong>"Add"</strong> চাপলেই হোম স্ক্রিনে অ্যাপ যুক্ত হয়ে যাবে।
                    </li>
                  </ol>
                </>
              )}

              {activePlatform === 'desktop' && (
                <>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Windows, Mac & Linux (Chrome / Edge):
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-300">
                    <li>
                      ব্রাউজারের অ্যাড্রেস বারের ডানপাশে <strong>Install Icon (⊕ বা 📥)</strong> এ ক্লিক করুন।
                    </li>
                    <li>
                      অথবা <strong>"Install App Now"</strong> বাটনে ক্লিক করে কনফার্ম করুন।
                    </li>
                    <li>
                      অ্যাপটি আপনার কম্পিউটারে আলাদা ডেস্কটপ উইন্ডোতে চালু হবে।
                    </li>
                  </ol>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-3">
            <button
              id="download-modal-done-btn"
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
