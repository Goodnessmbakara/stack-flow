/**
 * Copy Trading Dashboard Page - Premium Glassmorphism Design
 * Main hub for copy trading features - pools, whale tracking, and user positions
 * Uses REAL blockchain data only - no hardcoded content
 */

import { useState, useEffect } from "react";
import { CopyTradingPools } from "../app/copy-trading-pools";
import { WhaleTracker } from "../app/whale-tracker";
import { useWallet } from "../../context/WalletContext";
import { useWhaleWebSocket } from "../../hooks/useWhaleWebSocket";
import { WhaleAlert } from "../ui/whale-alert";
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Activity, 
  Sparkles, 
  BarChart3, 
  ArrowUpRight,
  Layers,
  Radio,
  Clock
} from 'lucide-react';
import {
  type CopyTradingPool,
} from "../../services/socialSentimentService";
import { type WhaleProfile } from "../../services/ecosystemWhaleService";

interface UserPosition {
  poolId: string;
  poolName: string;
  investedAmount: number;
  currentValue: number;
  performance: number;
  joinedAt: number;
}

export default function CopyTradingDashboard() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'pools' | 'whales' | 'positions'>('whales');
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [stats, setStats] = useState({
    totalInvested: 0,
    totalValue: 0,
    totalPools: 0,
    avgPerformance: 0
  });
  
  // Real-time whale WebSocket connection
  const { connected, latestTransaction, transactionHistory, error } = useWhaleWebSocket();
  const [showAlert, setShowAlert] = useState(false);
  const [showOnlySignificant, setShowOnlySignificant] = useState(true);

  // Show alert for new significant transactions
  useEffect(() => {
    if (latestTransaction?.isSignificant) {
      setShowAlert(true);
    }
  }, [latestTransaction]);

  // Load user positions from localStorage (in production, this would be from blockchain)
  useEffect(() => {
    if (isConnected && address) {
      const storageKey = `copy-trading-positions-${address}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const positions = JSON.parse(saved);
          setUserPositions(positions);

          const totalInvested = positions.reduce((sum: number, p: UserPosition) => sum + p.investedAmount, 0);
          const totalValue = positions.reduce((sum: number, p: UserPosition) => sum + p.currentValue, 0);
          const avgPerf = positions.length > 0
            ? positions.reduce((sum: number, p: UserPosition) => sum + p.performance, 0) / positions.length
            : 0;

          setStats({
            totalInvested,
            totalValue,
            totalPools: positions.length,
            avgPerformance: avgPerf
          });
        } catch (error) {
          console.error('Error loading positions:', error);
        }
      }
    }
  }, [address, isConnected]);

  const handlePoolJoin = (pool: CopyTradingPool) => {
    console.log('User joined pool:', pool.name);
  };

  const handleWhaleSelect = (whale: WhaleProfile) => {
    console.log('Selected whale:', whale.address);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const tabs = [
    { id: 'whales' as const, label: 'Whale Tracker', icon: TrendingUp, description: 'Real-time blockchain data' },
    { id: 'pools' as const, label: 'Trading Pools', icon: Users, description: 'Copy expert strategies' },
    { id: 'positions' as const, label: 'My Positions', icon: Wallet, description: 'Your active trades' },
  ];

  return (
    <div className="min-h-screen bg-[#1D2215] text-white relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#37F741]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#37F741]/3 to-transparent rounded-full" />
      </div>

      {/* Hero Header */}
      <div className="relative border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#37F741]/20 to-[#37F741]/5 flex items-center justify-center border border-[#37F741]/20 shadow-lg shadow-[#37F741]/10">
                  <Layers className="w-6 h-6 text-[#37F741]" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold">
                    <span className="bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
                      Copy Trading
                    </span>
                  </h1>
                </div>
              </div>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl">
                Track whale wallets, follow expert strategies, and mirror successful trades on Stacks
              </p>
            </div>

            {/* Real-time Status Indicator */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-[#37F741] animate-pulse' : 'bg-red-500'}`} />
                <Radio className={`w-4 h-4 ${connected ? 'text-[#37F741]' : 'text-red-400'}`} />
                <span className="text-xs text-slate-400">
                  {connected ? 'Live' : error ? 'Disconnected' : 'Connecting...'}
                </span>
              </div>
              {transactionHistory.length > 0 && (
                <div className="ml-2 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] text-purple-300">
                  {transactionHistory.length} events
                </div>
              )}
            </div>

            {/* Stats Cards */}
            {isConnected && (
              <div className="flex flex-wrap gap-3">
                <div className="backdrop-blur-xl bg-white/[0.03] rounded-xl px-5 py-3 border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <Wallet className="w-3 h-3" />
                    <span>Invested</span>
                  </div>
                  <div className="text-xl font-bold text-white">{formatCurrency(stats.totalInvested)} <span className="text-sm text-slate-400">STX</span></div>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.03] rounded-xl px-5 py-3 border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <BarChart3 className="w-3 h-3" />
                    <span>Value</span>
                  </div>
                  <div className="text-xl font-bold text-white">{formatCurrency(stats.totalValue)} <span className="text-sm text-slate-400">STX</span></div>
                </div>
                <div className="backdrop-blur-xl bg-white/[0.03] rounded-xl px-5 py-3 border border-white/10">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Returns</span>
                  </div>
                  <div className={`text-xl font-bold ${stats.avgPerformance >= 0 ? 'text-[#37F741]' : 'text-red-400'}`}>
                    {formatPercentage(stats.avgPerformance)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative sticky top-0 z-20 backdrop-blur-xl bg-[#1D2215]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#37F741]/20 to-[#37F741]/10 border border-[#37F741]/30 shadow-lg shadow-[#37F741]/5'
                    : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activeTab === tab.id
                    ? 'bg-[#37F741]/20'
                    : 'bg-white/5'
                }`}>
                  <tab.icon className={`w-4 h-4 ${
                    activeTab === tab.id ? 'text-[#37F741]' : 'text-slate-400'
                  }`} />
                </div>
                <div className="text-left">
                  <div className={`text-sm font-medium ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-300'
                  }`}>
                    {tab.label}
                  </div>
                  <div className="text-[10px] text-slate-500 hidden sm:block">
                    {tab.description}
                  </div>
                </div>
                {tab.id === 'positions' && userPositions.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-300 border border-purple-500/20">
                    {userPositions.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Whale Tracker Tab */}
        {activeTab === 'whales' && (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="backdrop-blur-xl bg-gradient-to-r from-[#37F741]/5 to-purple-500/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#37F741]/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-[#37F741]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">Real Blockchain Data</h3>
                  <p className="text-xs text-slate-400">
                    Track the most active whale wallets on Stacks mainnet. All data is fetched directly from the blockchain — no simulated or mock addresses.
                  </p>
                </div>
              </div>
            </div>

            <WhaleTracker maxWhales={10} onWhaleSelect={handleWhaleSelect} />

            {/* Real-time Activity Feed */}
            {transactionHistory.length > 0 && (
              <div className="backdrop-blur-xl bg-white/[0.02] rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#37F741]" />
                    <h3 className="text-sm font-semibold text-white">Live Whale Activity</h3>
                    <div className="w-2 h-2 rounded-full bg-[#37F741] animate-pulse" />
                  </div>
                  <button
                    onClick={() => setShowOnlySignificant(!showOnlySignificant)}
                    className={`text-xs px-3 py-1 rounded-lg transition-all ${
                      showOnlySignificant
                        ? 'bg-[#37F741]/20 text-[#37F741] border border-[#37F741]/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                    }`}
                  >
                    {showOnlySignificant ? 'Significant Only' : 'All Transactions'}
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {transactionHistory
                    .filter(tx => !showOnlySignificant || tx.isSignificant)
                    .map((tx, idx) => (
                      <div
                        key={`${tx.transaction.tx_id}-${idx}`}
                        className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-slate-400">
                                {tx.whale.alias || `${tx.whale.address.slice(0, 6)}...${tx.whale.address.slice(-4)}`}
                              </span>
                              {tx.isSignificant && (
                                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-[10px] text-yellow-300 font-medium">
                                  WHALE ALERT
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-white mb-2">{tx.transaction.action}</p>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`flex items-center gap-1 ${
                                tx.transaction.intent === 'bullish' ? 'text-[#37F741]' :
                                tx.transaction.intent === 'bearish' ? 'text-red-400' :
                                'text-slate-400'
                              }`}>
                                <span className="text-base">
                                  {tx.transaction.intent === 'bullish' ? '🟢' : 
                                   tx.transaction.intent === 'bearish' ? '🔴' : '⚪'}
                                </span>
                                {tx.transaction.intent}
                              </span>
                              {tx.transaction.protocol && (
                                <span className="text-slate-500">via {tx.transaction.protocol}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#37F741]">
                              ${tx.transaction.valueUSD.toLocaleString()}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              {tx.transaction.valueSTX.toLocaleString()} STX
                            </div>
                            <div className="text-[10px] text-slate-600 mt-1">
                              {new Date(tx.transaction.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trading Pools Tab */}
        {activeTab === 'pools' && (
          <div className="space-y-6">
            <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/5 to-[#37F741]/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white mb-1">Copy Trading Pools</h3>
                  <p className="text-xs text-slate-400">
                    Join pools managed by proven traders. Your funds are invested automatically following their strategies.
                  </p>
                </div>
              </div>
            </div>
            
            <CopyTradingPools maxPools={10} onPoolJoin={handlePoolJoin} />
          </div>
        )}

        {/* My Positions Tab */}
        {activeTab === 'positions' && (
          <div className="space-y-6">
            {!isConnected ? (
              <div className="backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/10 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#37F741]/10 to-purple-500/10 flex items-center justify-center border border-white/10">
                  <Wallet className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Connect Your Wallet</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Connect your wallet to view your copy trading positions and track your portfolio performance
                </p>
              </div>
            ) : userPositions.length === 0 ? (
              <div className="backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/10 p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#37F741]/10 to-purple-500/10 flex items-center justify-center border border-white/10">
                  <Activity className="w-10 h-10 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold mb-3">No Active Positions</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  You haven't joined any copy trading pools yet. Start by exploring available pools or tracking whale wallets!
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('pools')}
                    className="px-6 py-3 rounded-xl font-semibold bg-[#37F741] text-black hover:bg-[#37F741]/90 transition-all shadow-lg shadow-[#37F741]/20"
                  >
                    Browse Pools
                  </button>
                  <button
                    onClick={() => setActiveTab('whales')}
                    className="px-6 py-3 rounded-xl font-semibold bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    Track Whales
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile Stats */}
                <div className="lg:hidden grid grid-cols-2 gap-3 mb-6">
                  <div className="backdrop-blur-xl bg-white/[0.03] rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-slate-400 mb-1">Invested</div>
                    <div className="text-lg font-bold">{formatCurrency(stats.totalInvested)} STX</div>
                  </div>
                  <div className="backdrop-blur-xl bg-white/[0.03] rounded-xl p-4 border border-white/10">
                    <div className="text-xs text-slate-400 mb-1">Value</div>
                    <div className="text-lg font-bold">{formatCurrency(stats.totalValue)} STX</div>
                  </div>
                </div>

                {userPositions.map((position) => (
                  <div
                    key={position.poolId}
                    className="backdrop-blur-xl bg-white/[0.02] rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{position.poolName}</h3>
                        <p className="text-sm text-slate-400">
                          Joined {new Date(position.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        position.performance >= 0
                          ? 'bg-[#37F741]/20 text-[#37F741]'
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {formatPercentage(position.performance)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Invested</div>
                        <div className="font-semibold">{formatCurrency(position.investedAmount)} STX</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Current Value</div>
                        <div className="font-semibold">{formatCurrency(position.currentValue)} STX</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">P&L</div>
                        <div className={`font-semibold ${
                          position.currentValue - position.investedAmount >= 0 ? 'text-[#37F741]' : 'text-red-400'
                        }`}>
                          {formatCurrency(position.currentValue - position.investedAmount)} STX
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button className="text-sm text-[#37F741] hover:underline font-medium flex items-center gap-1">
                          View Details
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Whale Alert Notification */}
      {showAlert && latestTransaction?.isSignificant && (
        <WhaleAlert
          transaction={latestTransaction}
          onDismiss={() => setShowAlert(false)}
        />
      )}

      {/* Footer accent line */}
      <div className="fixed bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#37F741]/20 to-transparent" />
    </div>
  );
}
