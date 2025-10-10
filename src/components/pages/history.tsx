import { useEffect, useState } from "react";
import CustomConnectButton from "../atoms/ConnectButton";
import { useWallet } from "../../context/WalletContext";
import closePositionLogo from "./../../assets/icons/closeHegic.svg";
import { getExplorerUrl } from "../../blockchain/stacks/transactionManager";

interface TradePosition {
  id: string;
  strategy: string;
  asset: string;
  amount: number;
  strikePrice: number;
  premium: number;
  expiryBlock: number;
  currentBlock: number;
  status: 'active' | 'expired' | 'exercised';
  txId: string;
  createdAt: string;
  pnl?: number;
  markPrice?: number;
}

export default function HistoryPage() {
  const { address } = useWallet();
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState<Error | null>(null);
  const [positions, setPositions] = useState<TradePosition[]>([]);

  const fetchUserPositions = async () => {
    if (!address) return;
    
    setIsFetching(true);
    setIsError(null);
    
    try {
      console.log("Fetching positions for:", address);
      
      // Fetch transaction history from Stacks API
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${address}/transactions?limit=50`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      
      const data = await response.json();
      // const contractAddress = "ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH";
      
      // Filter for our contract transactions
      const contractTxs = data.results?.filter((tx: any) => 
        tx.tx_type === 'contract_call' && 
        tx.contract_call?.contract_id?.includes('stackflow-options-v2')
      ) || [];
      
      // Get current block height
      const blockResponse = await fetch('https://api.testnet.hiro.so/v2/info');
      const blockData = await blockResponse.json();
      const currentBlock = blockData.stacks_tip_height || 0;
      
      // Convert transactions to positions
      const userPositions: TradePosition[] = contractTxs.map((tx: any) => {
        const functionName = tx.contract_call?.function_name;
        const args = tx.contract_call?.function_args || [];
        
        // Parse function arguments based on strategy type
        let strategy = 'CALL';
        let amount = 0;
        let strikePrice = 0;
        let premium = 0;
        let expiryBlock = 0;
        
        if (functionName === 'create-call-option' && args.length >= 4) {
          amount = parseInt(args[0]?.repr?.replace('u', '')) / 1000000;
          strikePrice = parseInt(args[1]?.repr?.replace('u', '')) / 1000000;
          premium = parseInt(args[2]?.repr?.replace('u', '')) / 1000000;
          expiryBlock = parseInt(args[3]?.repr?.replace('u', ''));
        } else if (functionName === 'create-put-option' && args.length >= 4) {
          strategy = 'PUT';
          amount = parseInt(args[0]?.repr?.replace('u', '')) / 1000000;
          strikePrice = parseInt(args[1]?.repr?.replace('u', '')) / 1000000;
          premium = parseInt(args[2]?.repr?.replace('u', '')) / 1000000;
          expiryBlock = parseInt(args[3]?.repr?.replace('u', ''));
        } else if (functionName === 'create-strap-option' && args.length >= 4) {
          strategy = 'STRAP';
          amount = parseInt(args[0]?.repr?.replace('u', '')) / 1000000;
          strikePrice = parseInt(args[1]?.repr?.replace('u', '')) / 1000000;
          premium = parseInt(args[2]?.repr?.replace('u', '')) / 1000000;
          expiryBlock = parseInt(args[3]?.repr?.replace('u', ''));
        }
        
        // Determine status
        let status: 'active' | 'expired' | 'exercised' = 'active';
        if (currentBlock > expiryBlock) {
          status = 'expired';
        }
        
        // Calculate P&L (simplified)
        const markPrice = strikePrice * 0.95; // Simplified current price
        const pnl = (markPrice - strikePrice) * amount - premium;
        
        return {
          id: tx.tx_id,
          strategy,
          asset: 'STX',
          amount,
          strikePrice,
          premium,
          expiryBlock,
          currentBlock,
          status,
          txId: tx.tx_id,
          createdAt: new Date(tx.burn_block_time * 1000).toISOString(),
          pnl,
          markPrice
        };
      }).filter((pos: any) => pos.amount > 0); // Only include valid positions
      
      setPositions(userPositions);
      console.log(`Found ${userPositions.length} positions`);
      
    } catch (error) {
      console.error('Error fetching positions:', error);
      setIsError(error as Error);
      setPositions([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchUserPositions();
  }, [address]);
  
  return (
    <div className="bg-[#1D2215] h-fit rounded-lg py-7 px-6">
      {!address && <CustomConnectButton />}
      {isError && (
        <div className="font-semibold text-white">
          Error: {isError?.message}
        </div>
      )}
      {isFetching && (
        <div className="flex items-center justify-center h-full self-center">
          <div className="w-4 h-4 bg-white/80 rounded-full animate-[flash_0.5s_ease-out_infinite_alternate] delay-100" />
        </div>
      )}
      {positions.length > 0 ? (
        <div className="rounded-lg flex items-center justify-between flex-col gap-8">
          {positions.map((position) => (
            <div key={position.id} className="bg-[#252A1C] p-4 flex items-center gap-8 justify-between w-full">
              <div>
                <span className="text-green-400 font-semibold">
                  {position.amount.toFixed(2)}
                </span>
                <span className="text-gray-400 ml-1">{position.strategy}</span>
                <div className="text-gray-400 text-sm">≈${position.markPrice?.toFixed(2) || '0.00'}</div>
              </div>

              <div>
                <div className="text-gray-400 text-sm">Strike Price</div>
                <div className="text-white">${position.strikePrice.toFixed(2)}</div>
              </div>

              <div>
                <div className="text-gray-400 text-sm">Net P&L</div>
                <div className={position.pnl && position.pnl > 0 ? "text-green-400" : "text-red-400"}>
                  ${position.pnl?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-sm">Status</div>
                <div className={`text-sm font-semibold ${
                  position.status === 'active' ? 'text-green-400' : 
                  position.status === 'expired' ? 'text-red-400' : 
                  'text-yellow-400'
                }`}>
                  {position.status.toUpperCase()}
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-sm">Expires In</div>
                <div className="text-white">
                  {position.expiryBlock - position.currentBlock} blocks
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <a 
                  href={getExplorerUrl(position.txId)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  View TX
                </a>
                <img src={closePositionLogo} alt="Close" className="text-white cursor-pointer hover:opacity-70" />
              </div>
            </div>
          ))}
        </div>
      ) : !isFetching && address ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">No positions found</div>
          <div className="text-gray-500 text-sm">You haven't executed any trades yet</div>
        </div>
      ) : null}
    </div>
  );
}
