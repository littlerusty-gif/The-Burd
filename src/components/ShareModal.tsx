import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  Smartphone,
  QrCode,
  Sparkles,
  Send,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName?: string;
  shareUrl?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  appName = 'The Burd',
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeUrl, setActiveUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const url =
      shareUrl ||
      (typeof window !== 'undefined'
        ? window.location.origin
        : 'https://thebirdbook.app');
    setActiveUrl(url);

    // Generate crisp QR SVG
    QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((svg) => setQrSvg(svg))
      .catch((err) => console.error('Failed to generate QR SVG:', err));

    // Generate PNG Data URL for downloading
    QRCode.toDataURL(url, {
      width: 512,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#ffffff',
      },
    })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch((err) => console.error('Failed to generate QR DataURL:', err));
  }, [isOpen, shareUrl]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(activeUrl);
      } else {
        const input = document.createElement('input');
        input.value = activeUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy to clipboard:', e);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: appName,
          text: 'Explore live bird sightings, flight corridors, and mega-roosts on The Burd!',
          url: activeUrl,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'the-burd-qr.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <QrCode size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1.5">
                <span>Share The Burd</span>
                <Sparkles size={14} className="text-emerald-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Scan with any phone camera or share live link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 flex flex-col items-center">
          {/* QR Code Container */}
          <div className="relative p-4 bg-white rounded-2xl shadow-xl border-4 border-slate-800 flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
            {qrSvg ? (
              <div
                className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-slate-100 rounded-lg">
                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {/* Center Bird Glyph Badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-emerald-400 flex items-center justify-center shadow-lg">
                <span className="text-sm">🪶</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
            <Smartphone size={13} className="text-emerald-400" />
            <span>Point camera to open instantly on iOS or Android</span>
          </div>

          {/* Quick Action Buttons Row */}
          <div className="grid grid-cols-2 gap-2.5 w-full mt-4">
            <button
              onClick={handleCopyLink}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                  : 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-750 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Download size={14} />
              <span>Download QR</span>
            </button>
          </div>

          {/* URL Bar */}
          <div className="w-full mt-3 flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1.5 pl-3 text-xs">
            <span className="truncate text-slate-300 font-mono text-[11px] flex-1">
              {activeUrl}
            </span>
            <button
              onClick={handleNativeShare}
              className="py-1 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shrink-0 ml-1.5 transition-colors"
            >
              <Share2 size={12} />
              <span>Share</span>
            </button>
          </div>

          {/* Social Quick-Share Chips */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 w-full flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Quick Share:</span>
            <div className="flex items-center gap-1.5">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  'Check out The Burd for live bird sightings, flight corridors, and roost tracking!'
                )}&url=${encodeURIComponent(activeUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
              >
                X (Twitter)
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Check out The Burd: ${activeUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                WhatsApp
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(
                  'The Burd - Live Birding & Flight Corridors'
                )}&body=${encodeURIComponent(
                  `Explore live bird sightings and flight corridors on The Burd: ${activeUrl}`
                )}`}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
