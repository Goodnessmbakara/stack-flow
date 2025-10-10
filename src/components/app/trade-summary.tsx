import { useState, useEffect } from "react";
import CustomConnectButton from "../atoms/ConnectButton";
import { Icons } from "../ui/icons";
import { useAppContext } from "../../context/AppContext";
import ConfirmModal from "../molecules/ConfirmModal";
import SuccessModal from "../molecules/SuccessModal";
import { TransactionStatus } from "../molecules/TransactionStatus";
import { toast } from "react-toastify";
import { useWallet } from "../../context/WalletContext";
import { useTokenService } from "../../services/tokenService";
import { getSocialSentimentDashboard } from "../../services/priceService";

export function TradeSummary() {
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTransactionStatus, setShowTransactionStatus] = useState(false);
  const [txHash, setTxHash] = useState<string>("");
  const [txStatus, setTxStatus] = useState<"pending" | "success" | "failed">("pending");
  const [explorerUrl, setExplorerUrl] = useState<string>("");
  
  // Social sentiment states
  const [socialData, setSocialData] = useState<any>(null);

  const { state } = useAppContext();
  const { asset, strategy, isFetching, selectedPremium, period, amount } = state;
  const { address } = useWallet();
  const tokenService = useTokenService();

  // Fetch token balance
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!address || !tokenService) return;

      try {
        // Try sBTC first, fallback to USDC, then STX
        let balance = await tokenService.getTokenBalance('sBTC');
        if (balance === 0) {
          balance = await tokenService.getTokenBalance('USDC');
        }
        if (balance === 0) {
          balance = await tokenService.getTokenBalance('STX');
        }
        setUsdcBalance(balance);
      } catch (error) {
        console.error('Error fetching token balance:', error);
        setUsdcBalance(0);
      }
    };

    if (address) {
      fetchTokenBalance();
    }
  }, [address, tokenService]);

  // Fetch social sentiment data for BTC (Social Sentiment) tab
  useEffect(() => {
    if (asset === "BTC") {
      const fetchSocialData = async () => {
        try {
          const data = await getSocialSentimentDashboard();
          setSocialData(data);
        } catch (error) {
          console.error('Failed to fetch social sentiment data:', error);
        }
      };

      fetchSocialData();
      // Refresh every 60 seconds for real-time updates
      const interval = setInterval(fetchSocialData, 60000);
      return () => clearInterval(interval);
    }
  }, [asset]);

  const handleExecuteTrade = () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    if (asset === "BTC" && strategy === "Copy Trading") {
      handleCopyTrade();
      return;
    }

    if (asset === "BTC" && strategy === "Meme-Driven Investing") {
      handleMemePoolJoin();
      return; 
    }

    // Regular STX trading flow
    setShowConfirmModal(true);
  };

  const handleCopyTrade = async () => {
    try {
      setShowTransactionStatus(true);
      setTxStatus("pending");
      
      // Simulate copy trade execution
      setTimeout(() => {
        setTxStatus("success");
        setTxHash(`0x${Math.random().toString(16).substr(2, 8)}`);
        toast.success(`Copy trade executed successfully!`);
        setTimeout(() => {
          setShowTransactionStatus(false);
          setShowSuccessModal(true);
        }, 2000);
      }, 3000);
    } catch (error) {
      setTxStatus("failed");
      toast.error("Failed to execute copy trade");
    }
  };

  const handleMemePoolJoin = () => {
    setShowTransactionStatus(true);
    setTxStatus("pending");
    
    // Simulate meme pool joining
    setTimeout(() => {
      setTxStatus("success");
      setTxHash(`0x${Math.random().toString(16).substr(2, 8)}`);
      toast.success("Successfully joined meme pool!");
      setTimeout(() => {
        setShowTransactionStatus(false);
        setShowSuccessModal(true);
      }, 2000);
    }, 3000);
  };

  const getPremiumValue = () => {
    if (asset === "BTC") {
      // For social sentiment, show different metrics
      if (strategy === "Copy Trading" && socialData) {
        return `${socialData.sBTCSentiment?.score || 50}/100 Score`;
      }
      if (strategy === "Meme-Driven Investing" && socialData) {
        return `${socialData.memePools?.length || 0} Live Pools`;
      }
      return "Loading...";
    }
    return `${selectedPremium} STX`;
  };

  const getStrategyDescription = () => {
    if (asset === "BTC") {
      if (strategy === "Copy Trading") {
        return `Mirror successful whale traders with real-time sentiment signals`;
      }
      if (strategy === "Meme-Driven Investing") {
        return `Join viral meme pools with ${socialData?.trendingMemes?.length || 0} trending tokens`;
      }
    }
    return `${strategy} strategy for ${period} days`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-400';
      case 'bearish': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  return (
    <div className="space-y-4">
      {/* Social Sentiment Display for BTC */}
      {asset === "BTC" && socialData && (
        <div className="bg-[#1D2215] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              {strategy === "Copy Trading" ? "🐋 Copy Trading Hub" : "🎭 Meme Trading Pools"}
            </h3>
            <span className="text-xs bg-green-500 text-black px-2 py-1 rounded">LIVE</span>
          </div>
          
          {/* sBTC Sentiment Overview */}
          <div className="bg-[#2a2a2a] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">
                {strategy === "Copy Trading" ? "sBTC Market Sentiment" : "Trending Memes"}
              </span>
              <span className={`text-sm font-bold capitalize ${getSentimentColor(socialData.sBTCSentiment?.sentiment || 'neutral')}`}>
                {socialData.sBTCSentiment?.sentiment || 'neutral'}
              </span>
            </div>
            
            {strategy === "Copy Trading" && (
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-gray-400">Score</p>
                  <p className="text-white font-bold">{socialData.sBTCSentiment?.score || 50}/100</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">24h Change</p>
                  <p className={`font-bold ${(socialData.sBTCSentiment?.price_momentum || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {(socialData.sBTCSentiment?.price_momentum || 0) > 0 ? '+' : ''}{(socialData.sBTCSentiment?.price_momentum || 0).toFixed(2)}%
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">Volume</p>
                  <p className="text-white font-bold">${((socialData.sBTCSentiment?.volume || 0) / 1000000000).toFixed(1)}B</p>
                </div>
              </div>
            )}

            {strategy === "Meme-Driven Investing" && socialData.trendingMemes && (
              <div className="space-y-2">
                {socialData.trendingMemes.slice(0, 3).map((meme: any, index: number) => (
                  <div key={meme.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-[#37f741] font-bold">#{index + 1}</span>
                      <span className="text-white">{meme.symbol}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`${meme.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {meme.price_change_percentage_24h > 0 ? '+' : ''}{meme.price_change_percentage_24h.toFixed(1)}%
                      </span>
                      <span className="text-gray-400">🔥{meme.viral_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Trade Summary */}
      <div className="bg-[#1D2215] p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            {asset === "BTC" ? "🌐 Social Trading" : "💎 Strategy Summary"}
          </h3>
          {asset === "BTC" && socialData?.sBTCSentiment && (
            <span className={`text-xs px-2 py-1 rounded font-bold ${
              socialData.sBTCSentiment.sentiment === 'bullish' ? 'bg-green-500 text-black' :
              socialData.sBTCSentiment.sentiment === 'bearish' ? 'bg-red-500 text-white' :
              'bg-yellow-500 text-black'
            }`}>
              {socialData.sBTCSentiment.sentiment.toUpperCase()}
            </span>
          )}
        </div>

        {/* Strategy Info */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#ECECEC]">Strategy:</span>
            <span className="text-sm font-semibold text-white">{strategy}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-[#ECECEC]">
              {asset === "BTC" ? "Signal Strength:" : "Premium:"}
            </span>
            <span className="text-sm font-semibold text-[#37f741]">
              {getPremiumValue()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-[#ECECEC]">Amount:</span>
            <span className="text-sm font-semibold text-white">
              {amount} {asset === "BTC" ? "USD" : "STX"}
            </span>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-3">
          <p className="text-xs text-gray-400 mb-3">
            {getStrategyDescription()}
          </p>
          
          {address ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Available Balance:</span>
                <span className="text-white">
                  {usdcBalance !== null ? `${usdcBalance.toFixed(2)} ${asset === "BTC" ? "USD" : "STX"}` : "Loading..."}
                </span>
              </div>
              
              <button
                onClick={handleExecuteTrade}
                disabled={isFetching || usdcBalance === 0}
                className="w-full bg-gradient-to-r from-[#37f741] to-[#FDEE61] text-black font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetching ? (
                  <div className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  <>
                    {asset === "BTC" ? 
                      (strategy === "Copy Trading" ? "🔄 Execute Copy Trade" : "🎯 Join Meme Pool") : 
                      "⚡ Execute Trade"
                    }
                  </>
                )}
              </button>
            </div>
          ) : (
            <CustomConnectButton />
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          setShowConfirmModal(false);
          // Handle STX trading confirmation
        }}
      />

      {showSuccessModal && (
        <SuccessModal
          onClose={() => setShowSuccessModal(false)}
          txHash={txHash}
        />
      )}

      {showTransactionStatus && (
        <TransactionStatus
          status={txStatus}
          txHash={txHash}
          onClose={() => setShowTransactionStatus(false)}
        />
      )}
    </div>
  );
}
