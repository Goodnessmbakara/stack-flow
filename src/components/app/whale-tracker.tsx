/**
 * Whale Tracker Component - Premium Glassmorphism Design
 * Displays REAL whale wallet activities from the Stacks blockchain
 * No hardcoded data - only real blockchain-derived whale profiles
 */

import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink, TrendingUp, Activity, Users, Zap, Eye } from 'lucide-react';
import { ecosystemWhaleService, type WhaleProfile } from "../../services/ecosystemWhaleService";
import { useWhaleWebSocket, WhaleTransaction } from "../../hooks/useWhaleWebSocket";
import { TransactionCard } from "../ui/transaction-card";
import { WhaleAlert } from "../ui/whale-alert";

interface WhaleTrackerProps {
  onWhaleSelect?: (whale: WhaleProfile) => void;
  maxWhales?: number;
}

export function WhaleTracker({ onWhaleSelect, maxWhales = 10 }: WhaleTrackerProps) {
  const [whales, setWhales] = useState<WhaleProfile[]>([]);
  const [selectedWhale, setSelectedWhale] = useState<WhaleProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'defi' | 'nft' | 'stacking'>('all');
  const [error, setError] = useState<string | null>(null);
  const [alertTransaction, setAlertTransaction] = useState<WhaleTransaction | null>(null);
  
  // WebSocket integration for real-time updates
  const { connected, latestTransaction, transactionHistory } = useWhaleWebSocket();

  const fetchWhales = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    try {
      // Fetch REAL whale data from blockchain
      const whaleData = await ecosystemWhaleService.getWhales();
      
      // Filter by category if needed
      let filtered = whaleData;
      if (filter !== 'all') {
        filtered = whaleData.filter((w: WhaleProfile) => {
          const protocols = w.activity?.protocols || [];
          switch (filter) {
            case 'defi': return protocols.some((p: string) => ['ALEX', 'Arkadiko', 'Velar', 'StackingDAO'].includes(p));
            case 'nft': return protocols.some((p: string) => ['Gamma', 'STXNFT', 'NFT'].includes(p));
            case 'stacking': return protocols.includes('StackingDAO');
            default: return true;
          }
        });
      }
      
      setWhales(filtered.slice(0, maxWhales));
    } catch (err) {
      console.error('[WhaleTracker] Error fetching whales:', err);
      setError('Unable to fetch whale data. Connect to mainnet to see real data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWhales();
  }, [filter, maxWhales]);
  
  // Listen for real-time whale transactions
  useEffect(() => {
    if (latestTransaction) {
      console.log('[WhaleTracker] New transaction received:', latestTransaction);
      
      // Show alert if significant
      if (latestTransaction.isSignificant) {
        setAlertTransaction(latestTransaction);
      }
      
      // Auto-refresh whale list to show updated data
      fetchWhales(true);
    }
  }, [latestTransaction]);

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getActivityColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'from-green-400 to-emerald-500';
      case 'medium': return 'from-yellow-400 to-amber-500';
      case 'low': return 'from-orange-400 to-red-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="relative">
        {/* Glassmorphism container */}
        <div className="backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/10 p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#37F741]/20 to-[#37F741]/5 flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#37F741]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Whale Tracker</h3>
              <p className="text-xs text-slate-400">Real-time blockchain data</p>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="backdrop-blur-lg bg-white/[0.03] rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-1/3"></div>
                      <div className="h-3 bg-white/5 rounded w-2/3"></div>
                    </div>
                    <div className="h-6 w-20 bg-white/10 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-[#37F741]/10 via-transparent to-purple-500/10 rounded-3xl blur-xl opacity-50" />
      
      {/* Glassmorphism container */}
      <div className="relative backdrop-blur-xl bg-white/[0.02] rounded-2xl border border-white/10 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#37F741]/20 to-[#37F741]/5 flex items-center justify-center border border-[#37F741]/20">
              <Activity className="w-5 h-5 text-[#37F741]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Whale Tracker</h3>
              <p className="text-xs text-slate-400">Real-time Stacks mainnet data</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            {connected && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold">LIVE</span>
              </div>
            )}
            
            {/* Filter Pills */}
            <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-black/30 border border-white/5">
              {(['all', 'defi', 'nft', 'stacking'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    filter === f
                      ? 'bg-[#37F741]/20 text-[#37F741] border border-[#37F741]/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Refresh Button */}
            <button
              onClick={() => fetchWhales(true)}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-400">{error}</p>
          </div>
        )}

        {/* Whale List */}
        <div className="space-y-3">
          {whales.map((whale, index) => (
            <div
              key={whale.address}
              className={`group relative overflow-hidden cursor-pointer transition-all duration-300 ${
                selectedWhale?.address === whale.address ? 'ring-1 ring-[#37F741]/50' : ''
              }`}
              onClick={() => {
                setSelectedWhale(selectedWhale?.address === whale.address ? null : whale);
                onWhaleSelect?.(whale);
              }}
            >
              {/* Card glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#37F741]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              
              {/* Card content */}
              <div className="relative backdrop-blur-md bg-white/[0.03] rounded-xl p-4 border border-white/5 group-hover:border-white/10 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                        index < 3 ? 'from-[#37F741]/30 to-[#37F741]/10' : 'from-slate-700/50 to-slate-800/50'
                      } flex items-center justify-center border ${
                        index < 3 ? 'border-[#37F741]/30' : 'border-white/10'
                      } shadow-lg`}>
                        <span className={`font-bold text-lg ${index < 3 ? 'text-[#37F741]' : 'text-slate-300'}`}>
                          #{index + 1}
                        </span>
                      </div>
                      {/* Activity indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-r ${getActivityColor(whale.activity?.activityLevel || 'medium')} border-2 border-[#1D2215]`} />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {whale.alias || formatAddress(whale.address)}
                        </span>
                        <a
                          href={`https://explorer.stacks.co/address/${whale.address}?chain=mainnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-500 hover:text-[#37F741] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        {whale.activity?.protocols.includes('StackingDAO') && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/20 text-orange-400 border border-orange-500/20">
                            STACKER
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">
                          {formatCurrency(whale.portfolio?.stxBalance || 0)} STX
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400">
                          {whale.activity?.txCount30d?.toLocaleString() || 0} txns
                        </span>
                        {whale.activity?.protocols && whale.activity.protocols.length > 0 && (
                          <>
                            <span className="text-xs text-slate-500">•</span>
                            <div className="flex items-center gap-1">
                              {whale.activity.protocols.slice(0, 3).map((protocol) => (
                                <span
                                  key={protocol}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-slate-400"
                                >
                                  {protocol}
                                </span>
                              ))}
                              {whale.activity.protocols.length > 3 && (
                                <span className="text-[10px] text-slate-500">
                                  +{whale.activity.protocols.length - 3}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TrendingUp className="w-4 h-4 text-[#37F741]" />
                      <span className="text-lg font-bold text-[#37F741]">
                        {formatCurrency(whale.portfolio?.totalValueUSD || 0)} USD
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {whale.activity?.lastActiveAt ? formatTimeAgo(new Date(whale.activity.lastActiveAt).getTime()) : 'Active'}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedWhale?.address === whale.address && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="backdrop-blur-sm bg-black/20 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">STX Balance</div>
                        <div className="font-bold text-white">{formatCurrency(whale.portfolio?.stxBalance || 0)} STX</div>
                      </div>
                      <div className="backdrop-blur-sm bg-black/20 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Total Net Worth</div>
                        <div className="font-bold text-[#37F741]">${formatCurrency(whale.portfolio?.totalValueUSD || 0)}</div>
                      </div>
                      <div className="backdrop-blur-sm bg-black/20 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Activity Level</div>
                        <div className="font-bold text-white capitalize">{whale.activity?.activityLevel || 'medium'}</div>
                      </div>
                      <div className="backdrop-blur-sm bg-black/20 rounded-lg p-3">
                        <div className="text-xs text-slate-500 mb-1">Profile Group</div>
                        <div className="font-bold text-purple-400 capitalize">{whale.category || 'Trader'}</div>
                      </div>
                    </div>

                    {/* Token Holdings */}
                    {whale.portfolio?.tokens && whale.portfolio.tokens.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#37F741]" />
                          Holdings & Ecosystem Exposure
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {whale.portfolio.tokens.map((token, i) => (
                            <div key={`${token.symbol}-${i}`} className="backdrop-blur-sm bg-white/[0.02] rounded-lg p-3 border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400 border border-white/5">
                                  {token.symbol.substring(0, 3)}
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white">{token.symbol}</div>
                                  <div className="text-[10px] text-slate-500">{formatCurrency(token.amount)} tokens</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold text-[#37F741]">
                                  ${formatCurrency(token.value || 0)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Transactions Section */}
                    {whale.recentTransactions && whale.recentTransactions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#37F741]" />
                          Recent Transactions
                        </h4>
                        <div className="space-y-2">
                          {whale.recentTransactions.map((tx) => (
                            <div key={tx.tx_id} className="text-xs backdrop-blur-sm bg-white/[0.02] rounded-lg p-2 border border-white/5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${tx.tx_status === 'success' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                <span className="text-slate-300 font-medium truncate max-w-[120px]">
                                  {tx.tx_type === 'contract_call' ? tx.contract_call?.function_name : tx.tx_type}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-500 font-mono">
                                  {tx.tx_id.slice(0, 6)}...{tx.tx_id.slice(-4)}
                                </span>
                                <a
                                  href={`https://explorer.stacks.co/txid/${tx.tx_id}?chain=mainnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#37F741] hover:text-white"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <a
                        href={`https://explorer.stacks.co/address/${whale.address}?chain=mainnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-[#37F741] hover:underline"
                      >
                        <Eye className="w-4 h-4" />
                        View on Explorer
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Copy address
                          navigator.clipboard.writeText(whale.address);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-[#37F741]/10 text-[#37F741] border border-[#37F741]/20 hover:bg-[#37F741]/20 transition-all"
                      >
                        Copy Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {whales.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No Whales Found</h4>
            <p className="text-sm text-slate-400 mb-4">
              {filter !== 'all' 
                ? `No whales found for the "${filter}" category. Try a different filter.`
                : 'Fetching whale data from Stacks mainnet...'}
            </p>
            <button
              onClick={() => fetchWhales(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#37F741]/10 text-[#37F741] hover:bg-[#37F741]/20 transition-all"
            >
              Refresh Data
            </button>
          </div>
        )}

        {/* Footer Stats */}
        {whales.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Live blockchain data
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {whales.length} whales tracked
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Stacks Mainnet
            </span>
          </div>
        )}
        
        {/* Live Transaction Feed */}
        {transactionHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Live Activity Feed
              </h4>
              <span className="text-xs text-white/50">
                {transactionHistory.length} recent transactions
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {transactionHistory.slice(0, 10).map((tx, index) => (
                <TransactionCard 
                  key={`${tx.transaction.tx_id}-${index}`}
                  transaction={tx}
                  onWhaleClick={(addr) => {
                    const whale = whales.find(w => w.address === addr);
                    if (whale) {
                      setSelectedWhale(whale);
                      onWhaleSelect?.(whale);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Whale Alert Notification */}
      {alertTransaction && (
        <WhaleAlert 
          transaction={alertTransaction}
          onDismiss={() => setAlertTransaction(null)}
        />
      )}
    </div>
  );
}
