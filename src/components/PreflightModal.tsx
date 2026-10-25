import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, RefreshCw, Copy, Check, ExternalLink, X } from 'lucide-react';
import { DiagnosticItem, PreflightSummary, runPreflightDiagnostics } from '../utils/preflightCheck';

interface PreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: PreflightSummary | null;
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
}

export const PreflightModal: React.FC<PreflightModalProps> = ({
  isOpen,
  onClose,
  summary,
  onRefresh,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const passedCount = summary?.items.filter((i) => i.status === 'success').length || 0;
  const totalCount = summary?.items.length || 5;

  const handleCopyReport = async () => {
    if (!summary) return;
    const text = [
      `=== The Burd - Pre-Flight Diagnostics Report ===`,
      `Timestamp: ${new Date(summary.timestamp).toISOString()}`,
      `Origin: ${typeof window !== 'undefined' ? window.location.origin : 'unknown'}`,
      `Overall Status: ${summary.allPassed ? 'ALL PASSED' : summary.hasError ? 'ERROR' : 'WARNING'} (${passedCount}/${totalCount})`,
      '',
      ...summary.items.map((i) => {
        const symbol = i.status === 'success' ? '[✓]' : i.status === 'warning' ? '[!]' : '[X]';
        let str = `${symbol} ${i.title} (${i.status.toUpperCase()} - ${i.latencyMs || 0}ms)\n   ${i.message}`;
        if (i.recommendation) {
          str += `\n   Action Needed: ${i.recommendation}`;
        }
        return str;
      }),
    ].join('\n');

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  const getStatusIcon = (status: DiagnosticItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle size={18} className="text-amber-400 shrink-0" />;
      case 'error':
        return <XCircle size={18} className="text-rose-400 shrink-0" />;
      default:
        return <RefreshCw size={18} className="text-slate-400 animate-spin shrink-0" />;
    }
  };

  const getStatusBadge = (status: DiagnosticItem['status']) => {
    switch (status) {
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            PASS
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            WARNING
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            FAIL
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            TESTING
          </span>
        );
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Diagnostics Modal Card */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95vw] max-w-2xl bg-slate-950/98 backdrop-blur-2xl border border-slate-800 rounded-2xl shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150 font-sans"
        role="dialog"
        aria-modal="true"
        aria-label="Production Readiness Diagnostics"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Pre-Flight Diagnostics Check
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  The Burd v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated validation of origins, API keys, service workers & telemetry proxies
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Score Banner */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2.5 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                summary?.allPassed
                  ? 'bg-emerald-400 shadow-md shadow-emerald-400/50'
                  : summary?.hasError
                  ? 'bg-rose-500 animate-pulse'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-slate-200">
              Audit Status: {passedCount} of {totalCount} Checks Passing
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
              title="Rerun Diagnostics"
            >
              <RefreshCw size={13} className={isLoading ? 'animate-spin text-emerald-400' : ''} />
              <span>{isLoading ? 'Auditing...' : 'Rerun Checks'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              title="Copy Report to Clipboard"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Items List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
          {summary?.items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                item.status === 'success'
                  ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  : item.status === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-rose-950/20 border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-2.5 mb-1.5">
                <div className="flex items-center gap-2.5">
                  {getStatusIcon(item.status)}
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{item.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({item.badgeLabel})
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {typeof item.latencyMs === 'number' && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {item.latencyMs}ms
                    </span>
                  )}
                  {getStatusBadge(item.status)}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-7">
                {item.message}
              </p>

              {item.details && (
                <div className="text-[11px] font-mono text-slate-400 pl-7 mt-1 break-all">
                  {item.details}
                </div>
              )}

              {/* Exact Google Cloud Console or Vercel Fix Box */}
              {item.recommendation && (
                <div className="mt-2.5 ml-7 p-2.5 rounded-lg bg-slate-950 border border-amber-500/25 text-amber-200/90 text-[11px] leading-relaxed">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5 mb-1">
                    <ExternalLink size={12} />
                    <span>Action Required (GCP / Vercel Configuration):</span>
                  </div>
                  <p>{item.recommendation}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400">
            Last checked: {summary ? new Date(summary.timestamp).toLocaleTimeString() : 'Never'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all active:scale-95 shadow-sm"
          >
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
};

export default PreflightModal;
