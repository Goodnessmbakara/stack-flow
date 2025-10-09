import { memo, useEffect, useRef } from "react";

function TradingViewWidget({
  asset,
  visible,
}: {
  asset: string;
  visible: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run if the widget is visible and the container is available
    if (!visible || !container.current) {
      return;
    }

    // Clear any previous widget instances
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "COINBASE:${asset}USD",
        "interval": "D",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "enable_publishing": false,
        "backgroundColor": "rgba(29, 34, 21, 1)",
        "gridColor": "rgba(255, 255, 255, 0.06)",
        "hide_top_toolbar": true,
        "hide_legend": true,
        "save_image": false,
        "calendar": false,
        "hide_volume": true,
        "support_host": "https://www.tradingview.com"
      }`;

    container.current.appendChild(script);

    // Cleanup function to remove the script when the component is not visible
    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, [asset, visible]); // Re-run the effect when visibility changes

  return (
    <div
      className="tradingview-widget-container h-[300px] w-full"
      ref={container}
      style={{ display: visible ? "block" : "none" }} // Hide container when not visible
    ></div>
  );
}

export default memo(TradingViewWidget);
