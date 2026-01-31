import { ReactElement } from "react";
import { GoArrowUpRight } from "react-icons/go";

const Services = (): ReactElement => {
  const features = [
    {
      icon: "./src/assets/new graphics/1.png",
      title: "Whale Tracking",
      subtitle: "& Copy Trading",
      description: "Track successful traders on Stacks and automatically mirror their moves with real-time signal detection.",
      gridArea: "md:col-span-2",
    },
    {
      icon: "./src/assets/new graphics/2.png",
      title: "Bitcoin Secured",
      subtitle: "Infrastructure",
      description: "Built on Stacks, leveraging Bitcoin's proof-of-work for trustless DeFi without compromising decentralization.",
      gridArea: "md:col-span-1",
    },
    {
      icon: "./src/assets/new graphics/rocket.png",
      title: "Meme Pools",
      subtitle: "Community Driven",
      description: "Join viral investment opportunities with real-time viral score tracking and social sentiment analysis.",
      gridArea: "md:col-span-1",
    },
    {
      icon: "./src/assets/new graphics/3.png",
      title: "Capital Strategies",
      subtitle: "Advanced & Proven",
      description: "Access 12+ sentiment strategies: bullish, bearish, high vol, and low vol for every market condition.",
      gridArea: "md:col-span-2",
    },
    {
      icon: "./src/assets/new graphics/4.png",
      title: "Self Custody",
      subtitle: "Smart Contracts",
      description: "Your assets never leave your wallet. All logic executed through transparent, audited Clarity contracts.",
      gridArea: "md:col-span-1",
    },
    {
      icon: "./src/assets/new graphics/5.png",
      title: "Social Signals",
      subtitle: "Real-Time AI",
      description: "AI-powered engine aggregates whale behavior and community memes for dynamic trading insights.",
      gridArea: "md:col-span-2", // Highlighting this one
    },
  ];

  return (
    <section id="services" className="relative py-32 bg-[#0d120c] overflow-hidden">
      {/* 1. Fluid Background Flow */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <svg className="w-full h-full" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-100 450 C 200 450, 400 300, 720 450 C 1040 600, 1240 450, 1540 450" stroke="#37F741" strokeWidth="2" strokeDasharray="10 10" className="animate-pulse" />
            <path d="M-100 600 C 200 600, 400 750, 720 600 C 1040 450, 1240 600, 1540 600" stroke="#37F741" strokeWidth="1" opacity="0.5" />
            <circle cx="720" cy="450" r="300" fill="url(#grad1)" opacity="0.1" />
            <defs>
              <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{stopColor:"#37F741", stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:"#0d120c", stopOpacity:0}} />
              </radialGradient>
            </defs>
         </svg>
      </div>

      <div className="container px-4 mx-auto md:px-7 lg:px-12 relative z-10">
        <div className="text-center mb-20">
          <h4 className="text-[#37F741] font-bold tracking-widest uppercase mb-4 text-sm">The Flow Ecosystem</h4>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6">
            Ride the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#37F741] to-white">Capital Stream</span>.
          </h1>
          <p className="max-w-2xl mx-auto text-gray-400 text-lg">
            A complete suite of Bitcoin-secured tools designed for the next generation of social traders.
          </p>
        </div>

        {/* 2. Honeycomb / Masonry-style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`
                group relative 
                rounded-[2rem] 
                bg-[#0d120c]/60 backdrop-blur-md 
                border border-white/5 
                hover:border-[#37F741]/40 hover:bg-[#0d120c]/80
                transition-all duration-500 ease-out
                overflow-hidden
                ${feature.gridArea}
                hover:-translate-y-2 hover:shadow-[0_20px_40px_-20px_rgba(55,247,65,0.2)]
              `}
            >
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-4 group-hover:translate-x-0">
                <GoArrowUpRight className="text-[#37F741] text-2xl" />
              </div>

              <div className="h-full p-8 flex flex-col justify-between relative">
                {/* 3. Floating 3D Icon */}
                <div className="mb-6 relative">
                   <div className="absolute inset-0 bg-[#37F741] blur-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full"></div>
                   <img 
                    src={feature.icon} 
                    alt={feature.title} 
                    className="h-20 w-auto object-contain transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" 
                   />
                </div>
                
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white leading-tight mb-1">
                    {feature.title}
                  </h3>
                   <span className="block text-sm font-bold text-[#37F741] opacity-80 uppercase tracking-wide mb-4">
                    {feature.subtitle}
                  </span>
                  <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
