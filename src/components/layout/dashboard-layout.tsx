import { useLayoutEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

export function DashboardLayout() {
  const path = useLocation().pathname;

  useLayoutEffect(() => {
    if (path === "/app" || path === "/app/trade" || path === "/app/") {
      window.location.href = "/app/trade/new";
    }
  }, [path]);

  return (
    <div className="pb-10 pt-28 mx-auto space-y-10 max-w-[1068px] px-5">
      {" "}
      <div className="space-y-5 ">
        <h1 className="text-transparent bg-clip-text bg-linear-to-r from-[#37f741] to-[#FDEE61] text-4xl font-bold tracking-tight">
          Trade One-Click Option Strategies
        </h1>{" "}
        <div className="flex items-center gap-5">
          <Link
            to={"/trade"}
            className={`text-[#666666] relative font-semibold ${path === "/trade" ? "text-[#ececec]" : ""
              }`}
          >
            New Strategy
            {path === "/trade" ? (
              <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-[#37f741] transition-all duration-300 group-hover:h-full"></span>
            ) : null}
          </Link>
          <Link
            to={"/trade/history"}
            className={`text-[#666666] relative font-semibold ${path === "/trade/history" ? "text-[#ececec]" : ""
              }`}
          >
            My Strategies
            {path === "/trade/history" ? (
              <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-[#37f741] transition-all duration-300 group-hover:h-full"></span>
            ) : null}
          </Link>
          <Link
            to={"/trade/copy"}
            className={`text-[#666666] relative font-semibold ${path === "/trade/copy" ? "text-[#ececec]" : ""
              }`}
          >
            Copy Trading
            {path === "/trade/copy" ? (
              <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-[#37f741] transition-all duration-300 group-hover:h-full"></span>
            ) : null}
          </Link>
          <Link
            to={"/trade/sentiment"}
            className={`text-[#666666] relative font-semibold ${path === "/trade/sentiment" ? "text-[#ececec]" : ""
              }`}
          >
            Sentiment
            {path === "/trade/sentiment" ? (
              <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-[#37f741] transition-all duration-300 group-hover:h-full"></span>
            ) : null}
          </Link>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
