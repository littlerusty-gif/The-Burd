import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Heart,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Coffee,
  Check,
  Feather,
} from 'lucide-react';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  paypalEmail?: string;
}

const PRESET_AMOUNTS = [
  { value: 5, label: '$5', desc: 'Field Coffee & Birdseed' },
  { value: 10, label: '$10', desc: 'Feeder Supporter' },
  { value: 25, label: '$25', desc: 'Trail & Roost Guide' },
  { value: 50, label: '$50', desc: 'Telemetry & Server Host' },
  { value: 100, label: '$100', desc: 'Flyway Patron' },
];

export const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  paypalEmail = 'littlerusty@gmail.com',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [donorNote, setDonorNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentAmountNum = parseFloat(customAmount) || 0;
  const isValidAmount = currentAmountNum >= 1;

  const handleSelectPreset = (val: number) => {
    setSelectedPreset(val);
    setCustomAmount(val.toString());
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow digits and single decimal
    if (/^\d*\.?\d{0,2}$/.test(val)) {
      setCustomAmount(val);
      const parsed = parseFloat(val);
      const matched = PRESET_AMOUNTS.find((p) => p.value === parsed);
      setSelectedPreset(matched ? matched.value : null);
    }
  };

  const handleDonateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount) return;

    setIsSubmitting(true);

    // Build standard PayPal donation URL
    const itemName = donorNote
      ? `The Burd Donation (${donorNote.slice(0, 50)})`
      : 'The Burd - Wildlife Telemetry & Community Field Support';

    // Submit the standard secure PayPal webscr form
    if (formRef.current) {
      formRef.current.submit();
    } else {
      const donateUrl = `https://www.paypal.com/donate?business=${encodeURIComponent(
        paypalEmail
      )}&currency_code=USD&amount=${currentAmountNum.toFixed(
        2
      )}&item_name=${encodeURIComponent(itemName)}`;
      window.open(donateUrl, '_blank', 'noopener,noreferrer');
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Heart size={18} className="fill-amber-400/20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-1.5">
                <span>Support The Burd</span>
                <Sparkles size={14} className="text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Direct PayPal contribution for server telemetry & development
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
        <form onSubmit={handleDonateSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Recipient Account Badge */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-[10px]">
                PP
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">PayPal Recipient:</span>
                <span className="font-semibold text-slate-200 font-mono text-xs">{paypalEmail}</span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Verified
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Donation Amount
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {PRESET_AMOUNTS.map((preset) => {
                const isSelected = selectedPreset === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleSelectPreset(preset.value)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md scale-102'
                        : 'bg-slate-800/80 hover:bg-slate-750 text-slate-200 border-slate-700 font-semibold'
                    }`}
                  >
                    <div className="text-sm">{preset.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Input Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Or Enter Custom Amount (USD)
              </label>
              {currentAmountNum > 0 && (
                <span className="text-xs text-amber-400 font-mono font-bold">
                  ${currentAmountNum.toFixed(2)} USD
                </span>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-base">
                $
              </div>
              <input
                type="text"
                value={customAmount}
                onChange={handleCustomInputChange}
                placeholder="Custom amount (e.g. 15.00)"
                className="w-full pl-8 pr-16 py-2.5 bg-slate-950/90 border border-slate-750 focus:border-amber-400 rounded-xl text-base font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-bold text-slate-400">
                USD
              </div>
            </div>
            {!isValidAmount && (
              <p className="text-[11px] text-rose-400 mt-1">
                Please enter an amount of at least $1.00.
              </p>
            )}
          </div>

          {/* Optional Supporter Note */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Optional Note / Encouragement
            </label>
            <input
              type="text"
              value={donorNote}
              onChange={(e) => setDonorNote(e.target.value)}
              placeholder="e.g. Thanks for the flight corridors & crow roost alerts!"
              maxLength={80}
              className="w-full px-3 py-2 bg-slate-950/90 border border-slate-750 focus:border-amber-400 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Primary PayPal Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValidAmount || isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-98 ${
                isValidAmount && !isSubmitting
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black tracking-tight">
                <span className="text-[#003087]">Pay</span>
                <span className="text-[#0079C1]">Pal</span>
              </div>
              <span className="text-slate-950">
                Donate ${currentAmountNum > 0 ? currentAmountNum.toFixed(2) : '0.00'}
              </span>
              <ExternalLink size={15} className="text-slate-950/70" />
            </button>
          </div>

          {/* Trust & Transparency Note */}
          <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-400">
            <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-300 font-semibold mb-0.5">
                Official PayPal Checkout
              </p>
              <p>
                Clicking opens the official PayPal donation portal in a secure window. You can pay using your PayPal balance, bank account, or debit/credit card.
              </p>
            </div>
          </div>
        </form>

        {/* Hidden Form for Instant PayPal Webscr Post */}
        <form
          ref={formRef}
          action="https://www.paypal.com/cgi-bin/webscr"
          method="post"
          target="_blank"
          className="hidden"
        >
          <input type="hidden" name="cmd" value="_donations" />
          <input type="hidden" name="business" value={paypalEmail} />
          <input
            type="hidden"
            name="item_name"
            value={
              donorNote
                ? `The Burd Support (${donorNote.slice(0, 60)})`
                : 'The Burd - Wildlife Telemetry & Community Field Support'
            }
          />
          <input type="hidden" name="amount" value={currentAmountNum.toFixed(2)} />
          <input type="hidden" name="currency_code" value="USD" />
          <input type="hidden" name="no_shipping" value="1" />
          <input type="hidden" name="tax" value="0" />
        </form>
      </div>
    </div>
  );
};
