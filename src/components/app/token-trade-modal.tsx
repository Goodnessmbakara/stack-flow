/**
 * Token Trade Modal
 * Modal for trading tokens discovered from AI tweets
 */

import { useState } from 'react';
import { X, ExternalLink, Copy, Check, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { type TokenMention, getTokenInfo } from '../../services/openRouterService';

interface TokenTradeModalProps {
  token: TokenMention | null;
  onClose: () => void;
}

export function TokenTradeModal({ token, onClose }: TokenTradeModalProps) {
  const [copied, setCopied] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');

  if (!token) return null;

  const tokenInfo = getTokenInfo(token.value);
  const displayTicker = token.symbol || tokenInfo?.ticker || token.value.slice(0, 6);
  const displayCA = token.type === 'contract' ? token.value : tokenInfo?.ca || '';

  const handleCopy = async () => {
    const textToCopy = displayCA || token.value;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrade = () => {
    // In a real app, this would execute the trade
    console.log(`Executing ${tradeType} for ${amount} of ${displayTicker}`);
    alert(`Trade submitted: ${tradeType.toUpperCase()} ${amount || '0'} ${displayTicker}`);
    onClose();
  };

  // Mock price data
  const mockPrice = (Math.random() * 100).toFixed(4);
  const mockChange = (Math.random() * 20 - 10).toFixed(2);
  const isPositive = parseFloat(mockChange) >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1D2215] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#37f741]/20 flex items-center justify-center">
              <span className="text-[#37f741] font-bold">{displayTicker.slice(0, 2)}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{displayTicker}</h2>
              <p className="text-sm text-slate-400">Trade Token</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Price Info */}
          <div className="bg-[#121412] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Current Price</span>
              <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-[#37f741]' : 'text-red-400'}`}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? '+' : ''}{mockChange}%
              </div>
            </div>
            <div className="text-2xl font-bold text-white">${mockPrice}</div>
          </div>

          {/* Contract Address */}
          {displayCA && (
            <div className="bg-[#121412] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">Contract Address</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-[#37f741] hover:text-[#40f749] transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <code className="text-sm text-white font-mono break-all">
                {displayCA}
              </code>
            </div>
          )}

          {/* Trade Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setTradeType('buy')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                tradeType === 'buy'
                  ? 'bg-[#37f741] text-black'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setTradeType('sell')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                tradeType === 'sell'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              Sell
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#121412] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#37f741]/50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={() => setAmount('100')}
                  className="px-2 py-1 text-xs bg-white/10 rounded text-slate-300 hover:bg-white/20"
                >
                  MAX
                </button>
                <span className="text-slate-400 text-sm">USD</span>
              </div>
            </div>
          </div>

          {/* Quick Amounts */}
          <div className="flex gap-2">
            {['25', '50', '100', '250'].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val)}
                className="flex-1 py-2 rounded-lg bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors"
              >
                ${val}
              </button>
            ))}
          </div>

          {/* Trade Button */}
          <button
            onClick={handleTrade}
            disabled={!amount || parseFloat(amount) <= 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              tradeType === 'buy'
                ? 'bg-[#37f741] hover:bg-[#40f749] text-black disabled:bg-[#37f741]/50'
                : 'bg-red-500 hover:bg-red-400 text-white disabled:bg-red-500/50'
            } disabled:cursor-not-allowed`}
          >
            <ArrowRightLeft className="w-5 h-5" />
            {tradeType === 'buy' ? 'Buy' : 'Sell'} {displayTicker}
          </button>

          {/* External Links */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href={`https://dexscreener.com/search?q=${displayCA || displayTicker}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-[#37f741] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              DexScreener
            </a>
            <a
              href={`https://birdeye.so/token/${displayCA}?chain=solana`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-[#37f741] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Birdeye
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenTradeModal;
