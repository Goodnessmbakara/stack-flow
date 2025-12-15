/**
 * Copy Trading Dashboard Page
 * Main hub for copy trading features - pools, whale tracking, and user positions
 */

import { useState, useEffect } from "react";
import { CopyTradingPools } from "../app/copy-trading-pools";
import { WhaleTracker } from "../app/whale-tracker";
import { useWallet } from "../../context/WalletContext";
import { Users, TrendingUp, Wallet } from 'lucide-react';
import {
    type CopyTradingPool,
    type WhaleWallet
} from "../../services/socialSentimentService";

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
    const [activeTab, setActiveTab] = useState<'pools' | 'whales' | 'positions'>('pools');
    const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
    const [stats, setStats] = useState({
        totalInvested: 0,
        totalValue: 0,
        totalPools: 0,
        avgPerformance: 0
    });

    // Load user positions from localStorage (in production, this would be from blockchain)
    useEffect(() => {
        if (isConnected && address) {
            const storageKey = `copy-trading-positions-${address}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const positions = JSON.parse(saved);
                    setUserPositions(positions);

                    // Calculate stats
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
        // This will be called after successful pool join from JoinPoolModal
        console.log('User joined pool:', pool.name);
        // Refresh positions would happen here
    };

    const handleWhaleSelect = (whale: WhaleWallet) => {
        console.log('Selected whale:', whale.alias);
        // Could open a modal to follow whale or copy their strategy
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

    return (
        <div className="min-h-screen bg-[#1D2215] text-white">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-[#40F749] accent-glow">
                                Copy Trading Dashboard
                            </h1>
                            <p className="text-slate-400 mt-2">
                                Follow successful traders and mirror their strategies automatically
                            </p>
                        </div>
                        {isConnected && (
                            <div className="hidden md:flex items-center gap-4">
                                <div className="card px-4 py-2">
                                    <div className="text-xs text-slate-400">Total Invested</div>
                                    <div className="text-lg font-bold">{formatCurrency(stats.totalInvested)} STX</div>
                                </div>
                                <div className="card px-4 py-2">
                                    <div className="text-xs text-slate-400">Current Value</div>
                                    <div className="text-lg font-bold">{formatCurrency(stats.totalValue)} STX</div>
                                </div>
                                <div className="card px-4 py-2">
                                    <div className="text-xs text-slate-400">Avg Performance</div>
                                    <div className={`text-lg font-bold ${stats.avgPerformance >= 0 ? 'text-[#37F741]' : 'text-red-400'}`}>
                                        {formatPercentage(stats.avgPerformance)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
                <div className="border-b border-white/10 bg-black/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <button
                            onClick={() => setActiveTab('pools')}
                            className={`py-4 px-2 border-b-2 transition-colors font-medium ${activeTab === 'pools'
                                ? 'border-[var(--accent-green)] text-[var(--accent-green)]'
                                : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Copy Trading Pools
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('whales')}
                            className={`py-4 px-2 border-b-2 transition-colors font-medium ${activeTab === 'whales'
                                ? 'border-purple-400 text-purple-400'
                                : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Whale Tracker
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('positions')}
                            className={`py-4 px-2 border-b-2 transition-colors font-medium ${activeTab === 'positions'
                                ? 'border-[var(--accent-green)] text-[var(--accent-green)]'
                                : 'border-transparent text-slate-400 hover:text-white'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Wallet className="w-5 h-5" />
                                My Positions
                                {userPositions.length > 0 && (
                                    <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-0.5 rounded-full">
                                        {userPositions.length}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'pools' && (
                    <div>
                        <div className="mb-6">
                            <p className="text-slate-300">
                                Join copy trading pools managed by proven traders. Your funds are invested automatically following their strategies.
                            </p>
                        </div>
                        <CopyTradingPools maxPools={10} onPoolJoin={handlePoolJoin} />
                    </div>
                )}

                {activeTab === 'whales' && (
                    <div>
                        <div className="mb-6">
                            <p className="text-slate-300">
                                Track and follow successful whale wallets. Get alerts when they make significant moves.
                            </p>
                        </div>
                        <WhaleTracker maxWhales={10} onWhaleSelect={handleWhaleSelect} />
                    </div>
                )}

                {activeTab === 'positions' && (
                    <div>
                        {!isConnected ? (
                            <div className="text-center py-16">
                                <Wallet className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                                <p className="text-slate-400 mb-6">
                                    Connect your wallet to view your copy trading positions
                                </p>
                            </div>
                        ) : userPositions.length === 0 ? (
                            <div className="text-center py-16">
                                <TrendingUp className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No Active Positions</h3>
                                <p className="text-slate-400 mb-6">
                                    You haven't joined any copy trading pools yet. Start by exploring available pools!
                                </p>
                                    <button
                                    onClick={() => setActiveTab('pools')}
                                    className="px-6 py-3 rounded-lg font-semibold"
                                    style={{ backgroundColor: 'var(--accent-green)', color: '#000', boxShadow: '0 10px 30px rgba(55,247,65,0.08)' }}
                                >
                                    Browse Pools
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Stats Cards - Mobile */}
                                <div className="md:hidden grid grid-cols-2 gap-4 mb-6">
                                    <div className="card p-4">
                                        <div className="text-xs text-slate-400 mb-1">Invested</div>
                                        <div className="text-lg font-bold">{formatCurrency(stats.totalInvested)} STX</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="text-xs text-slate-400 mb-1">Value</div>
                                        <div className="text-lg font-bold">{formatCurrency(stats.totalValue)} STX</div>
                                    </div>
                                </div>

                                {userPositions.map((position) => (
                                    <div
                                        key={position.poolId}
                                        className="card p-6"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold mb-1">{position.poolName}</h3>
                                                <p className="text-sm text-slate-400">
                                                    Joined {new Date(position.joinedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                                <div className={`px-3 py-1 rounded-full text-sm font-medium ${position.performance >= 0
                                                ? 'bg-[#37F741]/20 text-[#37F741]'
                                                : 'bg-red-500/20 text-red-300'
                                                }`}>
                                                {formatPercentage(position.performance)}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div>
                                                <div className="text-xs text-slate-400 mb-1">Invested</div>
                                                <div className="font-semibold">{formatCurrency(position.investedAmount)} STX</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 mb-1">Current Value</div>
                                                <div className="font-semibold">{formatCurrency(position.currentValue)} STX</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-400 mb-1">P&L</div>
                                                <div className={`font-semibold ${position.currentValue - position.investedAmount >= 0
                                                    ? 'text-green-400'
                                                    : 'text-red-400'
                                                    }`}>
                                                    {formatCurrency(position.currentValue - position.investedAmount)} STX
                                                </div>
                                            </div>
                                            <div className="flex items-end">
                                                <button className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                                                    View Details →
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
        </div>
    );
}
