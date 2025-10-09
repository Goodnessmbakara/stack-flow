import {
  CandlestickData,
  createChart,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";

import { useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { Icons } from "../ui/icons";
import TradingViewWidget from "./trading-widget";

type Props = {
  asset: string;
  visible: boolean;
};

export function TradingChart({ asset, visible }: Props) {
  const price = Math.random() * 1000;
  const { state, formatNumber } = useAppContext();
  const { assetPrice, isFetching, priceChange24h } = state;

  // Safe handling of priceChange24h
  const safePriceChange24h = priceChange24h ?? 0;

  return (
    <div className="w-full h-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[#ECECEC] text-sm font-semibold flex items-center gap-2">
          {asset === "STX" ? <Icons.bitcoin /> : <Icons.bitcoin />}
          {asset} / USD
          <span
            className={`text-xs font-bold ${
              safePriceChange24h >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {safePriceChange24h >= 0 ? "+" : ""}
            {safePriceChange24h.toFixed(2)}%
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-[#ECECEC] text-xs">Current Price</p>
          <p className="text-[#D6D6D6] text-base font-bold">
            {isFetching ? "..." : formatNumber(assetPrice || 0)}
          </p>
        </div>
      </div>

      {/* Pass the visible prop to the widget */}
      <TradingViewWidget asset={asset} visible={visible} />

      <div className="flex items-center justify-between *:w-full">
        <div className="space-y-2">
          <p className="text-[#ECECEC] text-xs">Expected Price</p>
          <p className="text-[#D6D6D6] text-base font-bold">
            {isFetching ? "..." : formatNumber(assetPrice || 0)}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[#ECECEC] text-xs">Your Net P&L</p>
          <p
            className={`flex items-baseline gap-2 text-[#D6D6D6] font-bold ${
              price > 0 ? "text-lime-400" : "text-red-400"
            }`}
          >
            <span className="text-base">${price.toFixed(2)}</span>
            <span className="text-[#D6D6D6] font-bold text-sm">-100%</span>
          </p>
        </div>
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

export const LightweightChart: React.FC<Props> = ({ asset }) => {
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
      wickDownColor: "#e54560",
      downColor: "#e54560",
      borderVisible: false,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    candleSeriesRef.current = candleSeries;

    // WebSocket connection for real-time data
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${asset.toLowerCase()}usdt@kline_1m`
    );

    let lastCandleTime: number | null = null;

    ws.onmessage = (event) => {
      try {
        const message: BinanceKlineMessage = JSON.parse(event.data);
        const kline = message.k;

        if (kline && candleSeriesRef.current) {
          const candlestickData: CandlestickData = {
            time: Math.floor(kline.t / 1000) as any, // Convert to seconds
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
          };

          // Check if this is a new candle or an update to the existing one
          if (!lastCandleTime || candlestickData.time === lastCandleTime) {
            // Update the existing candle
            lastCandleTime = candlestickData.time as number;
            candleSeriesRef.current?.update(candlestickData);
          } else if ((candlestickData.time as number) > (lastCandleTime || 0)) {
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
      ws.close();
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
