import { useState } from 'react';
import { Icons } from '../ui/icons';
import Button from '../atoms/Button';

interface MemePool {
  id: string;
  meme: string;
  description: string;
  image?: string;
  totalPool: number;
  participants: number;
  timeLeft: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  viralScore: number;
  creator: string;
  minimumEntry: number;
  expectedReturn: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

const memePools: MemePool[] = [
  {
    id: '1',
    meme: '🚀 Bitcoin to $150K',
    description: 'Community believes BTC will hit $150K by end of 2025 based on institutional adoption and ETF flows.',
    image: '/assets/Graphics/Revolutionizing Crypto Options 1.png',
    totalPool: 45687,
    participants: 234,
    timeLeft: '15 days',
    sentiment: 'bullish',
    viralScore: 89,
    creator: 'CryptoProphet',
    minimumEntry: 50,
    expectedReturn: '200-400%',
    riskLevel: 'High'
  },
  {
    id: '2',
    meme: '⚡ STX Stacking Surge',
    description: 'Stacks ecosystem growth and Bitcoin DeFi adoption will drive STX price action through Q1 2025.',
    image: '/assets/Graphics/Transforming Crypto Options 1.png',
    totalPool: 23456,
    participants: 156,
    timeLeft: '8 days',
    sentiment: 'bullish',
    viralScore: 76,
    creator: 'StacksMaxi',
    minimumEntry: 25,
    expectedReturn: '50-150%',
    riskLevel: 'Medium'
  },
  {
    id: '3',
    meme: '🐻 Crypto Winter Returns',
    description: 'Expecting market correction due to regulatory concerns and macro economic factors.',
    image: '/assets/Graphics/01.png',
    totalPool: 18923,
    participants: 89,
    timeLeft: '22 days',
    sentiment: 'bearish',
    viralScore: 62,
    creator: 'BearMarketKing',
    minimumEntry: 100,
    expectedReturn: '75-200%',
    riskLevel: 'High'
  },
  {
    id: '4',
    meme: '🌊 Volatility Wave Incoming',
    description: 'Options market showing extreme volatility signals. Perfect for straddle strategies.',
    image: '/assets/Graphics/2.png',
    totalPool: 12345,
    participants: 67,
    timeLeft: '5 days',
    sentiment: 'neutral',
    viralScore: 71,
    creator: 'VolTrader',
    minimumEntry: 75,
    expectedReturn: '100-300%',
    riskLevel: 'Medium'
  }
];

export function MemeInvesting() {
  const [selectedPool, setSelectedPool] = useState<MemePool | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('100');

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400 bg-green-400/20';
      case 'bearish': return 'text-red-400 bg-red-400/20';
      case 'neutral': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleJoinPool = () => {
    if (selectedPool) {
      // TODO: Implement actual pool joining logic
      console.log('Joining pool:', selectedPool.meme, 'Amount:', investmentAmount);
      alert(`Joined "${selectedPool.meme}" pool with $${investmentAmount}`);
      setSelectedPool(null);
    }
  };

  if (selectedPool) {
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => setSelectedPool(null)}
          className="flex items-center gap-2 text-[#BDF738] hover:text-[#D4FF5A] transition-colors"
        >
          <Icons.arrowDownRight className="w-4 h-4 rotate-90" />
          Back to Pools
        </button>

        {/* Pool details */}
        <div className="bg-[#1D2215] p-6 rounded-lg space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-bold text-2xl mb-2">{selectedPool.meme}</h3>
              <p className="text-[#ECECEC] text-base leading-relaxed mb-4">{selectedPool.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getSentimentColor(selectedPool.sentiment)}`}>
                  {selectedPool.sentiment}
                </span>
                <span className="text-[#7A7A7A]">by {selectedPool.creator}</span>
                <span className={`${getRiskColor(selectedPool.riskLevel)}`}>{selectedPool.riskLevel} Risk</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Icons.waves className="w-5 h-5 text-[#BDF738]" />
                <span className="text-[#BDF738] font-bold text-lg">{selectedPool.viralScore}/100</span>
              </div>
              <p className="text-[#7A7A7A] text-sm">Viral Score</p>
            </div>
          </div>

          {/* Pool stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#171717] rounded-lg">
            <div className="text-center">
              <p className="text-[#7A7A7A] text-xs">Total Pool</p>
              <p className="text-white font-bold text-lg">{formatNumber(selectedPool.totalPool)}</p>
            </div>
            <div className="text-center">
              <p className="text-[#7A7A7A] text-xs">Participants</p>
              <p className="text-white font-bold text-lg">{selectedPool.participants}</p>
            </div>
            <div className="text-center">
              <p className="text-[#7A7A7A] text-xs">Time Left</p>
              <p className="text-white font-bold text-lg">{selectedPool.timeLeft}</p>
            </div>
            <div className="text-center">
              <p className="text-[#7A7A7A] text-xs">Expected Return</p>
              <p className="text-white font-bold text-lg">{selectedPool.expectedReturn}</p>
            </div>
          </div>
        </div>

        {/* Investment form */}
        <div className="bg-[#1D2215] p-6 rounded-lg space-y-4">
          <h4 className="text-[#ECECEC] font-semibold">Join Pool</h4>
          
          <div>
            <label className="block text-[#ECECEC] text-sm mb-2">
              Investment Amount (Min: {formatNumber(selectedPool.minimumEntry)})
            </label>
            <div className="bg-gradient-to-r w-full h-[50px] from-[#BDF738] rounded-lg to-[#FDEE61] overflow-hidden p-px">
              <div className="rounded-lg px-5 bg-[#171717] h-full flex justify-between items-center">
                <input
                  type="number"
                  className="h-full w-[70%] bg-transparent border-none outline-none text-sm text-[#D6D6D6]"
                  placeholder={selectedPool.minimumEntry.toString()}
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  min={selectedPool.minimumEntry}
                />
                <p className="text-sm text-[#7A7A7A]">USD</p>
              </div>
            </div>
          </div>

          <div className="bg-[#171717] p-4 rounded-lg">
            <h5 className="text-[#ECECEC] font-semibold mb-2">Pool Mechanics</h5>
            <ul className="text-[#7A7A7A] text-sm space-y-1">
              <li>• Funds are pooled together and executed as a single strategy</li>
              <li>• Returns are distributed proportionally to your contribution</li>
              <li>• Pool executes when target is reached or time expires</li>
              <li>• You can exit early with a small penalty fee</li>
            </ul>
          </div>

          <Button 
            variant="gradient" 
            className="w-full text-black font-bold"
            onClick={handleJoinPool}
            disabled={Number(investmentAmount) < selectedPool.minimumEntry}
          >
            Join Pool - {formatNumber(Number(investmentAmount) || selectedPool.minimumEntry)}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-xl">Meme-Driven Pools</h3>
        <p className="text-[#7A7A7A] text-sm">Community-powered investment ideas</p>
      </div>

      {/* Pools grid */}
      <div className="grid grid-cols-1 gap-4">
        {memePools.map((pool) => (
          <div
            key={pool.id}
            onClick={() => setSelectedPool(pool)}
            className="bg-[#1D2215] p-4 rounded-lg hover:bg-[#2A2F25] transition-colors cursor-pointer border border-transparent hover:border-[#BDF738]/20"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg mb-1">{pool.meme}</h4>
                <p className="text-[#7A7A7A] text-sm mb-2 line-clamp-2">{pool.description}</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className={`px-2 py-1 rounded-full font-bold ${getSentimentColor(pool.sentiment)}`}>
                    {pool.sentiment}
                  </span>
                  <span className="text-[#7A7A7A]">by {pool.creator}</span>
                  <span className={`${getRiskColor(pool.riskLevel)}`}>{pool.riskLevel}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Icons.waves className="w-4 h-4 text-[#BDF738]" />
                <span className="text-[#BDF738] font-bold">{pool.viralScore}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-[#ECECEC]">{formatNumber(pool.totalPool)} pool</span>
                <span className="text-[#7A7A7A]">{pool.participants} participants</span>
                <span className="text-[#BDF738]">{pool.timeLeft} left</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#ECECEC] font-bold">{pool.expectedReturn}</span>
                <Icons.arrowUpRight className="w-4 h-4 text-[#BDF738]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create pool CTA */}
      <div className="bg-[#1D2215] p-4 rounded-lg border border-[#BDF738]/20">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-[#ECECEC] font-semibold mb-1">Got a Meme Idea?</h4>
            <p className="text-[#7A7A7A] text-sm">Submit your investment meme and let the community decide!</p>
          </div>
          <Button variant="gradient" className="text-black font-bold">
            Create Pool
          </Button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-[#1D2215] p-4 rounded-lg border border-[#BDF738]/20">
        <div className="flex items-start gap-3">
          <Icons.questionMark className="w-5 h-5 text-[#BDF738] mt-0.5" />
          <div>
            <h4 className="text-[#ECECEC] font-semibold mb-1">How Meme Investing Works</h4>
            <p className="text-[#7A7A7A] text-sm leading-relaxed">
              Community members submit investment ideas based on memes, trends, or market sentiment. 
              Others can join these pools by contributing funds. When the pool reaches its target or timeline, 
              the strategy is executed and profits are shared proportionally.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}