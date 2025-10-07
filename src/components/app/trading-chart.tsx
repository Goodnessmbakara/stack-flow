import {
  CandlestickData,
  createChart,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";

import { memo, useEffect, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { Icons } from "../ui/icons";
import TradingViewWidget from "./trading-widget";

type Props = {
  asset: string;
  visible: boolean; // Add visible prop
};

export function TradingChart({ asset, visible }: Props) {
  const price = Math.random() * 1000;
  const { state, formatNumber } = useAppContext();
  const { assetPrice, isFetching, priceChange24h } = state;

  return (
    <div className="w-full h-full space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[#ECECEC] text-sm font-semibold flex items-center gap-2">
          {asset === "STX" ? <Icons.bitcoin /> : <Icons.bitcoin />}
          {asset} / USD
          <span
            className={`text-xs font-bold ${
              priceChange24h >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {priceChange24h >= 0 ? "+" : ""}
            {priceChange24h.toFixed(2)}%
          </span>
        </div>
        <div className="space-y-2">
          <p className="text-[#ECECEC] text-xs">Current Price</p>
          <p className="text-[#D6D6D6] text-base font-bold">
            {isFetching ? "..." : formatNumber(assetPrice)}
          </p>
        </div>
      </div>

      {/* Pass the visible prop to the widget */}
      <TradingViewWidget asset={asset} visible={visible} />

      <div className="flex items-center justify-between *:w-full">
        <div className="space-y-2">
          <p className="text-[#ECECEC] text-xs">Expected Price</p>
          <p className="text-[#D6D6D6] text-base font-bold">
            {isFetching ? "..." : formatNumber(assetPrice)}
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
      wickDownColor: "#eb3333",
      downColor: "#eb3333",
      borderVisible: false,
    });

    candleSeriesRef.current = candleSeries;

    // Fetch historical data
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${asset.toUpperCase()}USDT&interval=1m&limit=1000`
        );

        const data: Array<[number, string, string, string, string]> =
          await response.json();

        // @ts-expect-error time here not matching too
        const formattedData: CandlestickData[] = data.map((k) => ({
          time: k[0] / 1000, // Convert ms to seconds
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));

        candleSeries.setData(formattedData);
      } catch (error) {
        console.error("Failed to fetch historical data:", error);
      }
    };

    fetchHistoricalData();

    // WebSocket for live updates
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/${asset.toLowerCase()}usdt@kline_1m`
    );

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
