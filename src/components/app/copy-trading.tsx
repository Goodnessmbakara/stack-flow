import { useState } from 'react';
import { TraderProfile, CopyTradeSettings } from '../../lib/types';
import { topTraders } from '../../lib/dummy-data';
import { Icons } from '../ui/icons';
import Button from '../atoms/Button';

interface CopyTradingProps {
  onTraderSelect?: (trader: TraderProfile) => void;
}

export function CopyTrading({ onTraderSelect }: CopyTradingProps) {
  const [selectedTrader, setSelectedTrader] = useState<TraderProfile | null>(null);
  const [copyAmount, setCopyAmount] = useState('100');
  const [copySettings, setCopySettings] = useState<Partial<CopyTradeSettings>>({
    copyPercentage: 10,
    maxAmountPerTrade: 1000,
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num > 0 ? '+' : ''}${num.toFixed(1)}%`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleTraderSelect = (trader: TraderProfile) => {
    setSelectedTrader(trader);
    onTraderSelect?.(trader);
  };

  const handleCopyTrader = () => {
    if (selectedTrader) {
      // TODO: Implement actual copy trading logic
      console.log('Copy trader:', selectedTrader.displayName, 'Amount:', copyAmount, 'Settings:', copySettings);
      alert(`Started copying ${selectedTrader.displayName} with $${copyAmount}`);
    }
  };

  if (selectedTrader) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => setSelectedTrader(null)}
          className="flex items-center gap-2 text-[#BDF738] hover:text-[#D4FF5A] transition-colors"
        >
          <Icons.arrowDownRight className="w-4 h-4 rotate-90" />
          Back to Traders
        </button>

        {/* Selected trader details */}
        <div className="bg-[#1D2215] p-6 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#BDF738] to-[#FDEE61] rounded-full flex items-center justify-center">
                {selectedTrader.avatar ? (
                  <img src={selectedTrader.avatar} alt={selectedTrader.displayName} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <span className="text-black font-bold text-lg">{selectedTrader.displayName[0]}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold text-xl">{selectedTrader.displayName}</h3>
                  {selectedTrader.verified && (
                    <Icons.waves className="w-5 h-5 text-[#BDF738]" />
                  )}
                </div>
                <p className="text-[#7A7A7A] text-sm">{selectedTrader.address}</p>
                <p className="text-[#ECECEC] text-sm">{selectedTrader.followers} followers</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(selectedTrader.riskScore)} bg-opacity-20 bg-current`}>
              {selectedTrader.riskScore} Risk
            </div>
          </div>

          {/* Trader stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[#7A7A7A] text-xs">Total Return</p>
              <p className="text-white font-bold text-lg">{formatPercentage(selectedTrader.totalReturn)}</p>
            </div>
            <div className="text-center">
              <p className="text-[#7A7A7A] text-xs">Win Rate</p>
              <p className="text-white font-bold text-lg">{selectedTrader.winRate}%</p>
            </div>
            <div className="text-center">
              <p className="text-[#7A7A7A] text-xs">Total Trades</p>
              <p className="text-white font-bold text-lg">{selectedTrader.totalTrades}</p>
            </div>
            <div className="text-center">
              <p className="text-[#7A7A7A] text-xs">Assets</p>
              <p className="text-white font-bold text-lg">{selectedTrader.assets.join(', ')}</p>
            </div>
          </div>

          {/* Recent trades */}
          <div>
            <h4 className="text-[#ECECEC] font-semibold mb-3">Recent Trades</h4>
            <div className="space-y-2">
              {selectedTrader.recentTrades.slice(0, 3).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between bg-[#171717] p-3 rounded">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      trade.action === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {trade.action}
                    </span>
                    <span className="text-[#ECECEC]">{trade.amount} {trade.asset}</span>
                    <span className="text-[#7A7A7A] text-sm">@ {formatNumber(trade.price)}</span>
                  </div>
                  <div className="text-right">
                    {trade.pnl && (
                      <p className={`text-sm font-bold ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatNumber(trade.pnl)}
                      </p>
                    )}
                    <p className="text-[#7A7A7A] text-xs">{trade.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Copy settings */}
        <div className="bg-[#1D2215] p-6 rounded-lg space-y-4">
          <h4 className="text-[#ECECEC] font-semibold">Copy Settings</h4>
          
          {/* Copy amount */}
          <div>
            <label className="block text-[#ECECEC] text-sm mb-2">Investment Amount (USD)</label>
            <div className="bg-gradient-to-r w-full h-[50px] from-[#BDF738] rounded-lg to-[#FDEE61] overflow-hidden p-px">
              <div className="rounded-lg px-5 bg-[#171717] h-full flex justify-between items-center">
                <input
                  type="number"
                  className="h-full w-[70%] bg-transparent border-none outline-none text-sm text-[#D6D6D6]"
                  placeholder="100"
                  value={copyAmount}
                  onChange={(e) => setCopyAmount(e.target.value)}
                />
                <p className="text-sm text-[#7A7A7A]">USD</p>
              </div>
            </div>
          </div>

          {/* Copy percentage */}
          <div>
            <label className="block text-[#ECECEC] text-sm mb-2">Copy Percentage: {copySettings.copyPercentage}%</label>
            <input
              type="range"
              min="1"
              max="100"
              value={copySettings.copyPercentage}
              onChange={(e) => setCopySettings(prev => ({ ...prev, copyPercentage: Number(e.target.value) }))}
              className="w-full h-2 bg-[#171717] rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-[#7A7A7A] mt-1">
              <span>1%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Max amount per trade */}
          <div>
            <label className="block text-[#ECECEC] text-sm mb-2">Max Amount Per Trade (USD)</label>
            <div className="bg-gradient-to-r w-full h-[50px] from-[#BDF738] rounded-lg to-[#FDEE61] overflow-hidden p-px">
              <div className="rounded-lg px-5 bg-[#171717] h-full flex justify-between items-center">
                <input
                  type="number"
                  className="h-full w-[70%] bg-transparent border-none outline-none text-sm text-[#D6D6D6]"
                  placeholder="1000"
                  value={copySettings.maxAmountPerTrade}
                  onChange={(e) => setCopySettings(prev => ({ ...prev, maxAmountPerTrade: Number(e.target.value) }))}
                />
                <p className="text-sm text-[#7A7A7A]">USD</p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <Button 
            variant="gradient" 
            className="w-full text-black font-bold"
            onClick={handleCopyTrader}
          >
            Start Copying {selectedTrader.displayName}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-xl">Top Traders</h3>
        <p className="text-[#7A7A7A] text-sm">Choose a trader to copy their signals</p>
      </div>

      {/* Traders grid */}
      <div className="grid grid-cols-1 gap-4">
        {topTraders.map((trader) => (
          <div
            key={trader.id}
            onClick={() => handleTraderSelect(trader)}
            className="bg-[#1D2215] p-4 rounded-lg hover:bg-[#2A2F25] transition-colors cursor-pointer border border-transparent hover:border-[#BDF738]/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#BDF738] to-[#FDEE61] rounded-full flex items-center justify-center">
                  {trader.avatar ? (
                    <img src={trader.avatar} alt={trader.displayName} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-black font-bold">{trader.displayName[0]}</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-semibold">{trader.displayName}</h4>
                    {trader.verified && (
                      <Icons.waves className="w-4 h-4 text-[#BDF738]" />
                    )}
                  </div>
                  <p className="text-[#7A7A7A] text-sm">{trader.followers} followers</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#BDF738] font-bold text-lg">{formatPercentage(trader.totalReturn)}</p>
                <p className="text-[#7A7A7A] text-sm">{trader.winRate}% win rate</p>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#ECECEC]">{trader.totalTrades} trades</span>
                <span className={`${getRiskColor(trader.riskScore)}`}>{trader.riskScore} risk</span>
                <span className="text-[#7A7A7A]">{trader.assets.join(', ')}</span>
              </div>
              <Icons.arrowUpRight className="w-4 h-4 text-[#BDF738]" />
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-[#1D2215] p-4 rounded-lg border border-[#BDF738]/20">
        <div className="flex items-start gap-3">
          <Icons.questionMark className="w-5 h-5 text-[#BDF738] mt-0.5" />
          <div>
            <h4 className="text-[#ECECEC] font-semibold mb-1">How Copy Trading Works</h4>
            <p className="text-[#7A7A7A] text-sm leading-relaxed">
              When you copy a trader, you automatically mirror their trades proportionally to your investment amount. 
              You can set limits and stop copying anytime. Your funds stay in your wallet until execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}