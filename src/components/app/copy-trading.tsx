import { useState } from 'react';
import { Icons } from '../ui/icons';
import Button from '../atoms/Button';
import { TraderProfile } from '../../lib/types';
import { useRealTimeData } from '../../hooks/useRealTimeData';

interface CopyTradeSettings {
  amount: number;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  maxTradesPerDay: number;
  stopLoss: number;
  takeProfit: number;
}

const CopyTrading = () => {
  const { traders, loading, error, refreshData } = useRealTimeData();
  const [selectedTrader, setSelectedTrader] = useState<TraderProfile | null>(null);
  const [copySettings, setCopySettings] = useState<CopyTradeSettings>({
    amount: 100,
    riskLevel: 'Moderate',
    maxTradesPerDay: 3,
    stopLoss: 10,
    takeProfit: 25
  });

  // Auto-select the first trader once data is loaded
  useState(() => {
    if (!loading && traders.length > 0 && !selectedTrader) {
      setSelectedTrader(traders[0]);
    }
  });

  // Handle loading state
  if (loading) {
    return (
      <div className="w-full h-full p-8 bg-[#1D2215] rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bbf838]"></div>
          <p className="text-white">Loading Real Trader Wallets...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="w-full h-full p-8 bg-[#1D2215] rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-red-400">Error loading trader data: {error}</p>
          <Button onClick={refreshData} variant="gradient">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Handle no data state
  if (!traders || traders.length === 0) {
    return (
      <div className="w-full h-full p-8 bg-[#1D2215] rounded-lg flex items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <p className="text-white">No active trader wallets found</p>
          <Button onClick={refreshData} variant="gradient">
            <Icons.refresh className="w-4 h-4 mr-2" />
            Refresh Traders
          </Button>
        </div>
      </div>
    );
  }

  const handleCopyTrade = async () => {
    if (!selectedTrader) return;
    // Smart contract integration would go here
    alert(`Started copying ${selectedTrader.displayName} with ${copySettings.amount} STX.`);
  };

  return (
    <div className="w-full h-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Copy Trading</h2>
          <p className="text-gray-400 text-sm">
            Follow top Stacks wallets and mirror their strategies
          </p>
        </div>
        <Button onClick={refreshData} variant="default" className="text-sm">
          <Icons.refresh className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Real-time data indicator */}
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-green-400">Live Wallet Data</span>
        <span className="text-gray-500">• {traders.length} Wallets Found</span>
      </div>

      {/* Top Traders List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Top Performing Wallets</h3>
        
        <div className="grid gap-4">
          {traders.map((trader) => (
            <div
              key={trader.id}
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedTrader?.id === trader.id
                  ? 'border-[#bbf838] bg-[#bbf838]/10'
                  : 'border-gray-600 bg-[#2A2A2A] hover:border-gray-500'
              }`}
              onClick={() => setSelectedTrader(trader)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* <img
                    src={trader.avatar}
                    alt={trader.displayName}
                    className="w-10 h-10 rounded-full"
                  /> */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{trader.displayName}</span>
                      {trader.verified && (
                        <Icons.verified className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">
                      {trader.address.slice(0, 8)}...{trader.address.slice(-6)}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-4 text-sm">
                    <div>
                      <p className="text-green-400 font-semibold">+{trader.totalReturn.toFixed(1)}%</p>
                      <p className="text-gray-400">Return</p>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{trader.winRate.toFixed(1)}%</p>
                      <p className="text-gray-400">Win Rate</p>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{trader.totalTrades}</p>
                      <p className="text-gray-400">Trades</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Copy Settings */}
      {selectedTrader && (
        <div className="p-6 bg-[#2A2A2A] rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-white">Copy Settings for {selectedTrader.displayName}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">Copy Amount (STX)</label>
              <input
                type="number"
                value={copySettings.amount}
                onChange={(e) => setCopySettings(prev => ({ 
                  ...prev, 
                  amount: parseFloat(e.target.value) || 0 
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                min="10"
                step="10"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-300 mb-2">Risk Level</label>
              <select
                value={copySettings.riskLevel}
                onChange={(e) => setCopySettings(prev => ({ 
                  ...prev, 
                  riskLevel: e.target.value as CopyTradeSettings['riskLevel']
                }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="Conservative">Conservative</option>
                <option value="Moderate">Moderate</option>
                <option value="Aggressive">Aggressive</option>
              </select>
            </div>
          </div>
          
          <Button 
            onClick={handleCopyTrade}
            variant="gradient"
            className="w-full"
          >
            Start Copying Wallet
          </Button>
        </div>
      )}
    </div>
  );
};

export default CopyTrading;