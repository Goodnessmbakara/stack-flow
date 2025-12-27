import { ReactElement, useEffect, useRef } from "react";
import { TeamSection } from "../molecules/team-section";

const AboutPage = (): ReactElement => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top on mount unless hash is present
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0d120c] overflow-x-hidden">
      {/* 1. Cinematic Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[#0d120c]">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#37F741]/10 via-[#0d120c] to-[#0d120c]"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>

        {/* 3D Floating Elements (CSS Animation) */}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#37F741]/20 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#37F741]/10 rounded-full blur-[120px] animate-bounce-slow"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto" ref={heroRef}>
          <h4 className="text-[#37F741] font-mono tracking-[0.2em] mb-4 animate-fade-in-up">ORIGIN OF THE FLOW</h4>
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tight leading-none animate-fade-in-up delay-100">
            WE ARE THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#37F741] to-white drop-shadow-[0_0_30px_rgba(55,247,65,0.3)]">
              ARCHITECTS
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Building the connective tissue between Bitcoin's security and Stacks' programmability.
          </p>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full p-1">
             <div className="w-1.5 h-3 bg-[#37F741] rounded-full mx-auto animate-scroll-down"></div>
          </div>
        </div>
      </section>

      {/* 2. Mission / "DeFi Squared" Section */}
      <section className="py-32 px-4 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
           <div>
              <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
                DeFi <br />
                <span className="text-[#37F741]">Squared</span>.
              </h2>
           </div>
           <div className="space-y-8">
              <p className="text-xl text-gray-300 leading-relaxed border-l-4 border-[#37F741] pl-6">
                StackFlow isn't just another platform. It's a protocol designed to amplify liquidity and sentiment.
              </p>
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <h3 className="text-4xl font-bold text-white mb-2">100%</h3>
                    <p className="text-gray-500 uppercase tracking-widest text-sm">Non-Custodial</p>
                 </div>
                 <div>
                    <h3 className="text-4xl font-bold text-white mb-2">&lt;1s</h3>
                    <p className="text-gray-500 uppercase tracking-widest text-sm">Block Time</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 3. The Team Section (Imported) */}
      <TeamSection />

      {/* 4. Timeline / History */}
      <section className="py-32 bg-[#0a0c0a] relative">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-white text-center mb-16">The Flow of Time</h2>
            <div className="border-l-2 border-[#37F741]/20 ml-4 md:mx-auto relative space-y-16">
               
               {/* Timeline Items */}
               {[
                 { year: "2024 Q3", title: "Inception", desc: "The concept of Capital Flow Sentiment is born on Stacks." },
                 { year: "2024 Q4", title: "Protocol V1", desc: "Smart Contracts deployed to testnet. Core team assembled." },
                 { year: "2025 Q1", title: "Public Beta", desc: "StackFlow opens to the first 1,000 users." },
                 { year: "Future", title: "Decentralization", desc: "Community governance and token launch." },
               ].map((item, i) => (
                  <div key={i} className="relative pl-12 md:w-1/2 md:ml-auto md:pl-12 group">
                     <div className="absolute left-[-5px] top-2 w-3 h-3 bg-[#37F741] rounded-full ring-4 ring-[#0d120c] group-hover:scale-150 transition-transform"></div>
                     <span className="text-[#37F741] font-mono text-sm mb-2 block">{item.year}</span>
                     <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                     <p className="text-gray-400">{item.desc}</p>
                  </div>
               ))}

            </div>
         </div>
      </section>

    </div>
  );
};

export default AboutPage;
