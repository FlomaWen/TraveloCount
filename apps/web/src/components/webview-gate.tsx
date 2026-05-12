'use client';

import { useEffect, useState, type ReactNode } from 'react';

const INAPP_UA_PATTERNS = [
  /FBAN|FBAV|FB_IAB|FBIOS/i,        // Facebook / Messenger
  /Instagram/i,                       // Instagram
  /Twitter|X-Mobile/i,                // X / Twitter
  /Snapchat/i,                        // Snapchat
  /TikTok|BytedanceWebview|musical_ly/i, // TikTok
  /Line\//i,                          // LINE
  /WhatsApp/i,                        // WhatsApp
  /WeChat|MicroMessenger/i,           // WeChat
  /LinkedInApp/i,                     // LinkedIn
  /Pinterest/i,                       // Pinterest
  /Slack/i,                           // Slack
  /Discord/i,                         // Discord
  /Telegram/i,                        // Telegram
];

function isInAppBrowser(ua: string): boolean {
  return INAPP_UA_PATTERNS.some((p) => p.test(ua));
}

export function WebviewGate({ children }: { children: ReactNode }) {
  const [check, setCheck] = useState<'pending' | 'inapp' | 'ok'>('pending');
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setCurrentUrl(window.location.href);
    setCheck(isInAppBrowser(navigator.userAgent) ? 'inapp' : 'ok');
  }, []);

  if (check === 'pending') {
    return <main className="min-h-screen bg-ink" />;
  }

  if (check === 'inapp') {
    return <InAppWarning url={currentUrl} />;
  }

  return <>{children}</>;
}

function InAppWarning({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink p-6 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-card-lg bg-accent text-accent-ink text-[28px]">
          🌐
        </div>
        <h1 className="mt-5 text-h1-onb">Ouvre ce lien dans ton navigateur</h1>
        <p className="mt-3 text-[14px] leading-[1.5] text-white/70">
          La connexion Google ne fonctionne pas dans les navigateurs intégrés aux applications
          (Messenger, Instagram, WhatsApp, etc.). Tu dois ouvrir cette page dans Safari ou Chrome.
        </p>

        <div className="mt-6 rounded-card bg-white/10 p-4 text-left text-[13px]">
          <div className="mb-2 font-bold text-accent">📱 Sur téléphone</div>
          <ul className="space-y-1.5 text-white/80">
            <li>• Touche les <strong>3 points</strong> (•••) ou l'icône <strong>partage</strong> en haut</li>
            <li>• Choisis <strong>"Ouvrir dans le navigateur"</strong> ou <strong>"Ouvrir dans Safari"</strong></li>
          </ul>
        </div>

        <div className="mt-3 rounded-card bg-white/10 p-4 text-left text-[13px]">
          <div className="mb-2 font-bold text-accent">💻 Sinon</div>
          <p className="text-white/80">
            Copie le lien et colle-le dans Chrome, Safari, Firefox…
          </p>
        </div>

        <button
          type="button"
          onClick={copy}
          className="mt-5 inline-flex h-[50px] w-full items-center justify-center rounded-input bg-accent text-[14px] font-bold text-accent-ink"
        >
          {copied ? '✓ Lien copié' : 'Copier le lien'}
        </button>

        <div className="mt-3 break-all rounded-input bg-white/5 px-3 py-2 text-[11px] font-mono text-white/50">
          {url}
        </div>
      </div>
    </main>
  );
}
