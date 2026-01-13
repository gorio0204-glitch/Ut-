import React, { useState, useEffect } from 'react';
import { Fund } from '../types';

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

  // Handlers
  
  const handlePriceChange = (val: string) => {
    setPrice(val);
    const p = parseFloat(val) || 0;
    
    if (mode === 'UNIT') {
      // Re-calculate Total if in Unit mode
      const q = parseFloat(quantity) || 0;
      const r = parseFloat(feeRate) || 0;
      
      const subtotal = p * q;
      const calculatedFee = isBuy ? Math.round(subtotal * (r / 100)) : 0;
      setFee(calculatedFee.toString());
      
      const total = isBuy ? subtotal + calculatedFee : subtotal;
      setTotalAmount(total > 0 ? total.toString() : '');
      
    } else {
      // Re-calculate Units if in Amount mode
      const t = parseFloat(totalAmount) || 0;
      const r = parseFloat(feeRate) || 0;
      
      if (p > 0) {
        if (isBuy) {
          // Formula: Units = Total / (Price * (1 + Rate%))
          const units = t / (p * (1 + r / 100));
          setQuantity(units.toFixed(4));
          
          const principal = units * p;
          const calculatedFee = t - principal;
          setFee(calculatedFee.toFixed(0)); 
        } else {
          // Sell: Total = P * Q
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
            // Formula: Units = Total / (Price * (1 + Rate%))
            const units = t / (p * (1 + r / 100));
            setQuantity(units.toFixed(4));
            
            // Fee = Total - Principal
            const principal = units * p;
            const calculatedFee = t - principal;
            setFee(calculatedFee.toFixed(0));
         } else {
            // Sell: Units = Total / Price
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
      // Amount mode: Total is fixed, re-calculate units and fee amount
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
      // In Amount mode, total is fixed. If fee changes, principal changes.
      // Total = Principal + Fee
      const t = parseFloat(totalAmount) || 0;
      const newPrincipal = t - f;
      
      if (newPrincipal > 0 && p > 0) {
         const newUnits = newPrincipal / p;
         setQuantity(newUnits.toFixed(4));
         
         // Recalculate rate based on new principal
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

  // Render helpers
  const numPrice = parseFloat(price || '0');
  const numQty = parseFloat(quantity || '0');
  const numFee = parseFloat(fee || '0');
  const numTotal = parseFloat(totalAmount || '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className={`p-4 border-b flex justify-between items-center ${isBuy ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <h3 className={`text-lg font-bold flex items-center gap-2 ${isBuy ? 'text-emerald-800' : 'text-red-800'}`}>
            {isBuy ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            ) : (
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            )}
            {isBuy ? '申購模擬' : '贖回模擬'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-100">
            <p className="font-medium text-slate-800 truncate">{fund.name}</p>
            <p className="text-xs text-slate-500 mt-1">目前持有: <span className="font-bold text-slate-700">{fund.unitsHeld || 0}</span> 單位</p>
        </div>

        {/* Mode Toggle */}
        <div className="px-6 pt-4">
          <div className="bg-slate-100 p-1 rounded-lg flex">
            <button
              type="button"
              onClick={() => {
                setMode('UNIT');
              }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                mode === 'UNIT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              依單位數
            </button>
            <button
               type="button"
               onClick={() => {
                 setMode('AMOUNT');
               }}
               className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                 mode === 'AMOUNT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
            >
              依總金額
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 pt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              交易價格 ({fund.currency})
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              required
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 outline-none transition-all font-mono"
              style={{ 
                  borderColor: isBuy ? '#10b981' : '#ef4444', 
                  boxShadow: 'none' 
              }}
            />
          </div>

          {/* Dynamic Inputs based on Mode */}
          <div className="space-y-4">
             {mode === 'UNIT' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    交易單位數
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 outline-none transition-all font-mono"
                    style={{ borderColor: isBuy ? '#10b981' : '#ef4444' }}
                    autoFocus
                  />
                </div>
             ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    交易總金額 ({fund.currency})
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={totalAmount}
                    onChange={(e) => handleTotalAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 outline-none transition-all font-mono"
                    style={{ borderColor: isBuy ? '#10b981' : '#ef4444' }}
                    autoFocus
                  />
                </div>
             )}
          </div>

          {isBuy && (
            <div className="flex gap-4">
              <div className="w-1/3">
                 <label className="block text-sm font-medium text-slate-700 mb-1">
                  費率 (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={feeRate}
                  onChange={(e) => handleFeeRateChange(e.target.value)}
                  placeholder="%"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-center"
                />
              </div>
              <div className="w-2/3">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  手續費 ({fund.currency})
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={fee}
                  onChange={(e) => handleFeeAmountChange(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 outline-none transition-all font-mono"
                  style={{ 
                      borderColor: '#10b981', 
                      boxShadow: 'none' 
                  }}
                />
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl space-y-2">
            {isBuy && mode === 'AMOUNT' ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">交易總金額</span>
                    <span className="text-sm font-mono text-slate-600">
                        {numTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-xs text-slate-400">扣除手續費 {feeRate ? `(${feeRate}%)` : ''}</span>
                    <span className="text-sm font-mono text-red-500">
                        - {numFee.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-slate-400">實際投資金額</span>
                    <span className="text-sm font-mono text-emerald-600 font-medium">
                        = {(numTotal - numFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 mt-1 bg-white p-2 rounded border border-slate-100">
                      <span className="text-sm font-bold text-slate-700">實際買入單位</span>
                      <span className="text-lg font-bold text-emerald-600">
                          {quantity || '0'}
                      </span>
                  </div>
                </>
             ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">小計 (價格 x 單位)</span>
                    <span className="text-sm font-mono text-slate-600">
                        {(numPrice * numQty).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {isBuy && numFee > 0 && (
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-xs text-slate-400">手續費 {feeRate ? `(${feeRate}%)` : ''}</span>
                      <span className="text-sm font-mono text-slate-600">
                          + {numFee.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-1">
                      <span className="text-sm font-medium text-slate-500">
                          {isBuy ? '預估總支出' : '預估總回收'}
                      </span>
                      <span className={`text-xl font-bold ${isBuy ? 'text-emerald-600' : 'text-red-600'}`}>
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
              className="flex-1 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 text-white rounded-lg font-bold shadow-lg transition-all transform active:scale-95 ${
                  isBuy 
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30' 
                  : 'bg-red-500 hover:bg-red-600 shadow-red-500/30'
              }`}
            >
              確認{isBuy ? '買入' : '賣出'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TradeModal;