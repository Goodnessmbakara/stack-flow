import { useLayoutEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Icons } from "../ui/icons";

export function DashboardLayout() {
  const path = useLocation().pathname;

  useLayoutEffect(() => {
    if (path === "/app" || path === "/app/trade" || path === "/app/") {
      window.location.href = "/app/trade/new";
    }
  }, [path]);

  const navigationItems = [
    { 
      path: '/trade', 
      label: 'Create Trade', 
      icon: Icons.trending,
      description: 'Create and execute option strategies'
    },
    { 
      path: '/trade/history', 
      label: 'Portfolio', 
      icon: Icons.wallet,
      description: 'Track your positions and performance'
    },
    { 
      path: '/trade/copy', 
      label: 'Auto Trading', 
      icon: Icons.users,
      description: 'Follow successful traders automatically'
    },
    { 
      path: '/trade/sentiment', 
      label: 'Market Intel', 
      icon: Icons.activity,
      description: 'Real-time sentiment and signals'
    }
  ];

  return (
    <div className="pb-10 pt-28 mx-auto space-y-10 max-w-[1068px] px-5">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-transparent bg-clip-text bg-linear-to-r from-[#37f741] to-[#FDEE61] text-5xl font-bold tracking-tight">
            Trade One-Click Option Strategies
          </h1>
          <p className="text-[#999999] text-sm">
            Bitcoin-secured DeFi options trading on Stacks blockchain
          </p>
        </div>

        <div className="flex items-center gap-6 flex-wrap">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = path === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative font-semibold transition-all duration-200 group ${
                  isActive ? "text-[#ececec]" : "text-[#666666] hover:text-[#999999]"
                }`}
                title={item.description}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? "text-[#37f741]" : "text-[#666666] group-hover:text-[#37f741]"
                  }`} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-[#37f741] transition-all duration-300"></span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      <Outlet />
    </div>
  );
}
