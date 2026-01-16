import React, { useState, useEffect } from 'react';
import { Fund } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'BUY' | 'SELL';
  fund: Fund | null;
  onConfirm: (fundIsin: string, type: 'BUY' | 'SELL', quantity: number, price: number, fee: number) => void;
}

type CalculationMode = 'UNIT' | 'AMOUNT';

const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose, type, fund, onConfirm }) => {
  const [mode, setMode] = useState<CalculationMode>('UNIT');
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [fee, setFee] = useState<string>('');
  const [feeRate, setFeeRate] = useState<string>('');
  
  const { t } = useLanguage();
  const isBuy = type === 'BUY';

  useEffect(() => {
    if (isOpen && fund) {
      const defaultPrice = type === 'BUY' 
        ? (fund.buyPrice || fund.price) 
        : (fund.sellPrice || fund.price);
      setPrice(defaultPrice.toString());
      setQuantity('');
      setTotalAmount('');
      setFee('');
      setFeeRate(type === 'BUY' ? '1.5' : ''); 
      setMode('UNIT');
    }
  }, [isOpen, fund, type]);

  if (!isOpen || !fund) return null;

  // Handlers (Same logic as before, omitted for brevity of visuals only updates)
  const handlePriceChange = (val: string) => {
    setPrice(val);
    const p = parseFloat(val) || 0;
    if (mode === 'UNIT') {
      const q = parseFloat(quantity) || 0;
      const r = parseFloat(feeRate) || 0;
      const subtotal = p * q;
      const calculatedFee = isBuy ? Math.round(subtotal * (r / 100)) : 0;
      setFee(calculatedFee.toString());
      const total = isBuy ? subtotal + calculatedFee : subtotal;
      setTotalAmount(total > 0 ? total.toString() : '');
    } else {
      const t = parseFloat(totalAmount) || 0;
      const r = parseFloat(feeRate) || 0;
      if (p > 0) {
        if (isBuy) {
          const units = t / (p * (1 + r / 100));
          setQuantity(units.toFixed(4));
          const principal = units * p;
          const calculatedFee = t - principal;
          setFee(calculatedFee.toFixed(0)); 
        } else {
          const units = t / p;
          setQuantity(units.toFixed(4));
        }
      }
    }
  };

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    if (mode === 'UNIT') {
      const p = parseFloat(price) || 0;
      const q = parseFloat(val) || 0;
      const r = parseFloat(feeRate) || 0;
      const subtotal = p * q;
      const calculatedFee = isBuy ? Math.round(subtotal * (r / 100)) : 0;
      setFee(calculatedFee.toString());
      const total = isBuy ? subtotal + calculatedFee : subtotal;
      setTotalAmount(total > 0 ? total.toString() : '');
    }
  };

  const handleTotalAmountChange = (val: string) => {
    setTotalAmount(val);
    if (mode === 'AMOUNT') {
      const p = parseFloat(price) || 0;
      const t = parseFloat(val) || 0;
      const r = parseFloat(feeRate) || 0;
      if (p > 0) {
         if (isBuy) {
            const units = t / (p * (1 + r / 100));
            setQuantity(units.toFixed(4));
            const principal = units * p;
            const calculatedFee = t - principal;
            setFee(calculatedFee.toFixed(0));
         } else {
            const units = t / p;
            setQuantity(units.toFixed(4));
         }
      }
    }
  };

  const handleFeeRateChange = (val: string) => {
    setFeeRate(val);
    const r = parseFloat(val) || 0;
    const p = parseFloat(price) || 0;
    if (mode === 'UNIT') {
      const q = parseFloat(quantity) || 0;
      const subtotal = p * q;
      const calculatedFee = Math.round(subtotal * (r / 100));
      setFee(calculatedFee.toString());
      setTotalAmount((subtotal + calculatedFee).toString());
    } else {
      const t = parseFloat(totalAmount) || 0;
      if (p > 0 && isBuy) {
         const units = t / (p * (1 + r / 100));
         setQuantity(units.toFixed(4));
         const principal = units * p;
         const calculatedFee = t - principal;
         setFee(calculatedFee.toFixed(0));
      }
    }
  };

  const handleFeeAmountChange = (val: string) => {
    setFee(val);
    const f = parseFloat(val) || 0;
    const p = parseFloat(price) || 0;
    if (mode === 'UNIT') {
       const q = parseFloat(quantity) || 0;
       if (p * q > 0) {
          const calculatedRate = (f / (p * q)) * 100;
          setFeeRate(calculatedRate.toFixed(2));
       }
       setTotalAmount((p * q + f).toString());
    } else {
      const t = parseFloat(totalAmount) || 0;
      const newPrincipal = t - f;
      if (newPrincipal > 0 && p > 0) {
         const newUnits = newPrincipal / p;
         setQuantity(newUnits.toFixed(4));
         const calculatedRate = (f / newPrincipal) * 100;
         setFeeRate(calculatedRate.toFixed(2));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price || '0');
    const numQty = parseFloat(quantity || '0');
    const numFee = parseFloat(fee || '0');
    if (numPrice > 0 && numQty > 0) {
      onConfirm(fund.isin, type, numQty, numPrice, numFee);
      onClose();
    }
  };

  const numPrice = parseFloat(price || '0');
  const numQty = parseFloat(quantity || '0');
  const numFee = parseFloat(fee || '0');
  const numTotal = parseFloat(totalAmount || '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-scaleIn relative z-10 border border-white/20">
        <div className={`p-5 border-b flex justify-between items-center ${isBuy ? 'bg-emerald-50/80 border-emerald-100' : 'bg-red-50/80 border-red-100'}`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isBuy ? 'text-emerald-800' : 'text-red-800'}`}>
            {isBuy ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            )}
            {isBuy ? t('tradeBuyTitle') : t('tradeSellTitle')}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-white/50 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-5 bg-slate-50/50 border-b border-slate-100">
            <p className="font-bold text-slate-800 truncate text-lg">{fund.name}</p>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-xs font-mono">{fund.isin}</span>
              {t('currentHoldings')}: <span className="font-bold text-slate-800">{fund.unitsHeld || 0}</span> {t('units')}
            </p>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-5">
          <div className="bg-slate-100 p-1.5 rounded-xl flex shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode('UNIT');
              }}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                mode === 'UNIT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t('unitMode')}
            </button>
            <button
               type="button"
               onClick={() => {
                 setMode('AMOUNT');
               }}
               className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                 mode === 'AMOUNT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
            >
              {t('amountMode')}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {t('tradePrice')} ({fund.currency})
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              required
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl focus:ring-4 outline-none transition-all font-mono text-lg font-bold shadow-sm"
              style={{ 
                  borderColor: isBuy ? '#10b981' : '#ef4444', 
                  boxShadow: isBuy ? '0 0 0 1px #10b981' : '0 0 0 1px #ef4444'
              }}
            />
          </div>

          <div className="space-y-4">
             {mode === 'UNIT' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t('tradeUnits')}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-4 outline-none transition-all font-mono text-lg font-bold"
                    style={{ 
                      borderColor: isBuy ? '#10b981' : '#ef4444',
                      color: isBuy ? '#065f46' : '#991b1b',
                      backgroundColor: isBuy ? '#ecfdf5' : '#fef2f2'
                    }}
                    autoFocus
                  />
                </div>
             ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t('tradeAmount')} ({fund.currency})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={totalAmount}
                    onChange={(e) => handleTotalAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border rounded-xl focus:ring-4 outline-none transition-all font-mono text-lg font-bold"
                    style={{ 
                      borderColor: isBuy ? '#10b981' : '#ef4444',
                      color: isBuy ? '#065f46' : '#991b1b',
                      backgroundColor: isBuy ? '#ecfdf5' : '#fef2f2'
                    }}
                    autoFocus
                  />
                </div>
             )}
          </div>

          {isBuy && (
            <div className="flex gap-4">
              <div className="w-1/3">
                 <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('feeRate')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={feeRate}
                    onChange={(e) => handleFeeRateChange(e.target.value)}
                    placeholder="%"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-center"
                  />
                  <span className="absolute right-2 top-2 text-slate-400 text-sm">%</span>
                </div>
              </div>
              <div className="w-2/3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t('feeAmount')}
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={fee}
                  onChange={(e) => handleFeeAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                />
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-5 rounded-2xl space-y-3 border border-slate-100">
            {isBuy && mode === 'AMOUNT' ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">{t('tradeAmount')}</span>
                    <span className="text-sm font-mono text-slate-700">
                        {numTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                    <span className="text-xs text-slate-500 font-medium">{t('feeAmount')} {feeRate ? `(${feeRate}%)` : ''}</span>
                    <span className="text-sm font-mono text-red-500">
                        - {numFee.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs font-bold text-slate-700">{t('estTotalCost')}</span>
                    <span className="text-lg font-mono text-emerald-600 font-bold">
                        = {(numTotal - numFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
             ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 font-medium">{t('subtotal')}</span>
                    <span className="text-sm font-mono text-slate-700">
                        {(numPrice * numQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isBuy && numFee > 0 && (
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-xs text-slate-500 font-medium">{t('feeAmount')} {feeRate ? `(${feeRate}%)` : ''}</span>
                      <span className="text-sm font-mono text-slate-700">
                          + {numFee.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-1">
                      <span className="text-sm font-bold text-slate-700">
                          {isBuy ? t('estTotalCost') : t('estTotalReturn')}
                      </span>
                      <span className={`text-xl font-mono font-bold ${isBuy ? 'text-emerald-600' : 'text-red-600'}`}>
                        {(mode === 'AMOUNT' ? numTotal : (isBuy ? numPrice * numQty + numFee : numPrice * numQty)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                  </div>
                </>
             )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors text-sm"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className={`flex-1 py-3 text-white rounded-xl font-bold shadow-lg transition-all transform active:scale-95 text-sm ${
                  isBuy 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' 
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
              }`}
            >
              {isBuy ? t('confirmBuy') : t('confirmSell')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;