import {
  CandlestickData,
  createChart,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";

import { useEffect, useRef, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { Icons } from "../ui/icons";
import { calculatePnL, formatPnL, getPnLColorClass } from "../../services/pnlCalculator";
import { priceService } from "../../services/priceService";
// import TradingViewWidget from "./trading-widget";

type Props = {
  asset: string;
  onPriceSelect?: (price: number) => void;
};

export function TradingChart({ asset }: Props) {
  const { state, formatNumber } = useAppContext();
  const { assetPrice, isFetching, strategy, amount, selectedPremium, selectedProfitZone } = state;
  const [expectedPrice, setExpectedPrice] = useState<number>(assetPrice);
  const [currentPrice, setCurrentPrice] = useState<number>(assetPrice);

  // Update expected price when asset price changes
  useEffect(() => {
    if (assetPrice > 0) {
      setExpectedPrice(assetPrice);
      setCurrentPrice(assetPrice);
    }
  }, [assetPrice]);

  // Subscribe to real-time price updates
  useEffect(() => {
    const assetType = asset as 'STX' | 'BTC' | 'ETH';
    const unsubscribe = priceService.subscribe(assetType, (priceData) => {
      setCurrentPrice(priceData.price);
    });

    return unsubscribe;
  }, [asset]);

  // Handle chart click for price selection
  const handleChartClick = (price: number) => {
    setExpectedPrice(price);
  };

  // Calculate projected P&L using proper options pricing
  const calculateProjectedPnL = (): number => {
    if (!strategy || !amount || !selectedPremium || !currentPrice) {
      return 0;
    }

    const pnlResult = calculatePnL({
      strategy: strategy as any,
      currentPrice,
      strikePrice: currentPrice, // For projected P&L, we use current price as strike
      amount: parseFloat(amount),
      premium: parseFloat(selectedPremium),
      expectedPrice
    }, true); // isProjected = true

    return pnlResult.pnl;
  };

  return (
    <div className="w-full h-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[#ECECEC] text-sm font-semibold flex items-center gap-2">
          {asset === "ETH" ? <Icons.eth /> : asset === "BTC" ? <Icons.bitcoin /> : <Icons.bitcoin />}
          {asset} / USD
        </div>
        <div className="space-y-2">
          <p className="text-[#ECECEC] text-xs">Current Price</p>
          <p className="text-[#D6D6D6] text-base font-bold">
            {isFetching ? "..." : formatNumber(currentPrice)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between *:w-full">
        <div className="space-y-2">
          <p className="text-[#ECECEC] text-xs">Expected Price</p>
          <p className="text-[#D6D6D6] text-base font-bold">
            {isFetching ? "..." : formatNumber(expectedPrice)}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[#ECECEC] text-xs">Your Net P&L</p>
          <p className={`flex items-baseline gap-2 text-[#D6D6D6] font-bold ${getPnLColorClass(calculateProjectedPnL())}`}>
            <span className="text-base">
              {formatPnL(calculateProjectedPnL())}
            </span>
            <span className="text-[#D6D6D6] font-bold text-sm">
              {currentPrice > 0 ? (((expectedPrice - currentPrice) / currentPrice) * 100).toFixed(1) : '0.0'}%
            </span>
          </p>
        </div>

        <p className="text-[#7A7A7A] text-xs">
          Choose the expected price level on the chart to calculate P&L
        </p>
      </div>

      <div className="w-full h-[404px] relative overflow-hidden rounded-lg">
        <LightweightChart asset={asset} onPriceSelect={handleChartClick} />
        {/* <TradingViewWidget asset={asset} /> */}
      </div>
    </div>
  );
}

type BinanceKlineMessage = {
  k: {
    t: number; // Start time of this candlestick
    o: string; // Open price
    h: string; // High price
    l: string; // Low price
    c: string; // Close price
  };
};

export const LightweightChart: React.FC<Props> = ({ asset, onPriceSelect }) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create the chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#171717" },
        textColor: "#C3BCDB",
      },
      grid: {
        vertLines: { color: "#171717" },
        horzLines: { color: "#171717" },
      },
    });

    chart.timeScale().applyOptions({ borderColor: "#71649C" });
    chart.timeScale().fitContent();

    // Set up custom price formatter
    const currentLocale = window.navigator.languages[0];
    const myPriceFormatter = Intl.NumberFormat(currentLocale, {
      style: "currency",
      currency: "USD",
    }).format;

    chart.applyOptions({
      localization: {
        priceFormatter: myPriceFormatter,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      wickUpColor: "#3aa67b",
      upColor: "#3aa67b",
      wickDownColor: "#eb3333",
      downColor: "#eb3333",
      borderVisible: false,
    });

    candleSeriesRef.current = candleSeries;

    // Add click handler for price selection
    if (onPriceSelect) {
      chart.subscribeClick((param) => {
        if (param.point && param.seriesData) {
          const data = param.seriesData.get(candleSeries);
          if (data && 'close' in data) {
            onPriceSelect(data.close);
          }
        }
      });
    }

    // Fetch historical data
    const fetchHistoricalData = async () => {
      try {
        let data: CandlestickData[] = [];
        
        if (asset === "STX") {
          // Use CoinGecko API for STX data with fallback
          console.log("Fetching STX data from CoinGecko");
          try {
            const response = await fetch(
              `https://api.coingecko.com/api/v3/coins/stacks/market_chart?vs_currency=usd&days=1&interval=hourly`
            );

            if (!response.ok) {
              throw new Error(`CoinGecko API error: ${response.status}`);
            }

            const coinGeckoData = await response.json();
            const prices = coinGeckoData.prices;
            
            if (prices && prices.length > 0) {
              // Convert CoinGecko data to candlestick format
              data = prices.map((price: [number, number]) => {
                const time = price[0] / 1000; // Convert to seconds
                const value = price[1];
                // Create OHLC from price data (simplified)
                const variation = value * 0.02; // 2% variation
                return {
                  time: time as any,
                  open: value,
                  high: value + variation,
                  low: value - variation,
                  close: value,
                };
              });
            } else {
              throw new Error("No price data from CoinGecko");
            }
          } catch (error) {
            console.warn("CoinGecko failed, using realistic STX data");
            // Create realistic STX data based on current market
            const now = Date.now() / 1000;
            const basePrice = 0.6; // STX is around $0.6
            data = Array.from({ length: 24 }, (_, i) => {
              const time = now - (24 - i) * 3600; // Hourly intervals
              const variation = (Math.random() - 0.5) * 0.1; // 10% variation
              const price = basePrice + variation;
              return {
                time: time as any,
                open: price,
                high: price + Math.random() * 0.02,
                low: price - Math.random() * 0.02,
                close: price + (Math.random() - 0.5) * 0.01,
              };
            });
          }
        } else {
          // Use Binance for BTC/ETH
          let symbol = "";
          if (asset === "BTC") {
            symbol = "BTCUSDT";
          } else if (asset === "ETH") {
            symbol = "ETHUSDT";
          } else {
            symbol = `${asset.toUpperCase()}USDT`;
          }
          
          console.log(`Fetching data for ${symbol} from Binance`);
          const response = await fetch(
            `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1m&limit=1000`
          );

          if (!response.ok) {
            throw new Error(`Binance API error: ${response.status}`);
          }

          const binanceData: Array<[number, string, string, string, string]> = await response.json();
          
          // Convert Binance data to candlestick format
          data = binanceData.map((k) => ({
            time: (k[0] / 1000) as any, // Convert ms to seconds
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
          }));
        }

        console.log(`Fetched ${data.length} data points for ${asset}`);
        candleSeries.setData(data as any);
        console.log("Chart data set successfully");
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
        // Fallback: create realistic dummy data
        const now = Date.now() / 1000;
        const basePrice = asset === "STX" ? 0.6 : asset === "BTC" ? 50000 : 3000;
        const dummyData: CandlestickData[] = Array.from({ length: 100 }, (_, i) => {
          const time = now - (100 - i) * 60; // 1 minute intervals
          const variation = (Math.random() - 0.5) * (basePrice * 0.05); // 5% variation
          return {
            time: time as any,
            open: basePrice + variation,
            high: basePrice + variation + Math.random() * (basePrice * 0.02),
            low: basePrice + variation - Math.random() * (basePrice * 0.02),
            close: basePrice + variation + (Math.random() - 0.5) * (basePrice * 0.01),
          };
        });
        candleSeries.setData(dummyData);
        console.log(`Using fallback data for ${asset} chart`);
      }
    };

    fetchHistoricalData();

    // WebSocket for live updates
    let ws: WebSocket;
    try {
      if (asset === "STX") {
        // STX not available on Binance WebSocket, skip live updates
        console.log("STX not available on Binance WebSocket, skipping live updates");
        ws = null as any;
      } else {
        // Use the same symbol logic for WebSocket
        let symbol = "";
        if (asset === "BTC") {
          symbol = "btcusdt";
        } else if (asset === "ETH") {
          symbol = "ethusdt";
        } else {
          symbol = `${asset.toLowerCase()}usdt`;
        }
        
        ws = new WebSocket(
          `wss://stream.binance.com:9443/ws/${symbol}@kline_1m`
        );
      }
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      ws = null as any;
    }

    if (ws) {
      ws.onmessage = (event: MessageEvent) => {
        try {
          const message: BinanceKlineMessage = JSON.parse(event.data);

          if (message.k) {
            const kline = message.k;

            const candlestickData: CandlestickData = {
              // @ts-expect-error time wahala
              time: kline.t / 1000,
              open: parseFloat(kline.o),
              high: parseFloat(kline.h),
              low: parseFloat(kline.l),
              close: parseFloat(kline.c),
            };

            const lastCandleTime = candleSeriesRef.current?.data()?.at(-1)?.time;

            if (lastCandleTime === candlestickData.time) {
              // Update the last candle
              candleSeriesRef.current?.update(candlestickData);
            } else if (candlestickData.time > (lastCandleTime || 0)) {
              // Add a new candle
              candleSeriesRef.current?.setData([
                ...(candleSeriesRef.current?.data() || []),
                candlestickData,
              ]);
            }
          }
        } catch (error) {
          console.error("WebSocket message handling error:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.resize(
          chartContainerRef.current.clientWidth,
          chartContainerRef.current.clientHeight
        );
      }
    };

    window.addEventListener("resize", handleResize);

    chartRef.current = chart;

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      if (ws) {
        ws.close();
      }
    };
  }, [asset]);

  return (
    <div
      ref={chartContainerRef}
      style={{
        backgroundColor: "black",
        borderRadius: 9,
      }}
      className="w-full h-full"
    />
  );
};
