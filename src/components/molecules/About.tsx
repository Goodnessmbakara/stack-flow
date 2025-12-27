import { ReactElement } from "react";
import { GoArrowUpRight } from "react-icons/go";
import whale_tracking_img from "../../assets/new graphics/1.png";
import bitcoin_security_img from "../../assets/new graphics/2.png";
import social_trading_img from "../../assets/new graphics/rocket.png";
import stackflow_hero_img from "../../assets/new graphics/3.png";

const About = (): ReactElement => {
  return (
    <div id="about" className="relative bg-[#0d120c] py-24 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-[#37F741]/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-[#37F741]/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="container px-4 mx-auto md:px-7 lg:px-12 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-[#37F741]/10 border border-[#37F741]/20 backdrop-blur-md">
             <span className="text-[#37F741] text-sm font-bold tracking-wide uppercase">Deep Ecosystem</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            The Flow of <span className="text-[#37F741] inline-block relative">
              Smart Money
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#37F741] opacity-40" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl">
            StackFlow is the first Bitcoin-secured sentiment trading protocol. 
            We combine on-chain transparency with community signals.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
          
          {/* Main Card - Whale Tracking (Span 8) */}
          <div className="md:col-span-8 group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-xl hover:border-[#37F741]/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(55,247,65,0.05)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-[#0d120c]/40 group-hover:bg-[#0d120c]/20 transition-all duration-500"></div>
            
            <div className="relative h-full flex flex-col md:flex-row items-center p-8 md:p-12 gap-8">
              <div className="flex-1 text-left z-10">
                <div className="w-12 h-12 rounded-2xl bg-[#37F741] flex items-center justify-center mb-6 shadow-[#37F741]/20 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <img src={whale_tracking_img} className="w-8 h-8 filter brightness-0 invert" alt="Whale" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Whale Tracking</h3>
                <p className="text-gray-400 leading-relaxed text-lg">
                  Don't just watch the market—see who's moving it. Track high-volume wallets and copy their trades in real-time on Stacks.
                </p>
                <div className="mt-8 flex items-center gap-2 text-[#37F741] font-bold cursor-pointer hover:gap-4 transition-all">
                  <span>Start Tracking</span>
                  <GoArrowUpRight className="text-xl" />
                </div>
              </div>
              <div className="flex-1 h-full min-h-[200px] w-full relative">
                 <img src={stackflow_hero_img} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-none group-hover:scale-110 group-hover:rotate-3 transition-transform duration-700 ease-out drop-shadow-2xl" alt="Platform" />
              </div>
            </div>
          </div>

          {/* Tall Card - Social Sentiment (Span 4, Row Span 2) */}
          <div className="md:col-span-4 md:row-span-2 group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-xl hover:border-[#37F741]/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(55,247,65,0.05)]">
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#37F741]/5 to-[#37F741]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             
             <div className="relative h-full flex flex-col p-8">
                <div className="w-14 h-14 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-6 group-hover:border-[#37F741]/50 transition-colors">
                  <img src={social_trading_img} className="w-8 h-8" alt="Social" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-4">Social Sentiment</h3>
                <p className="text-gray-400 mb-8">
                  DeFi isn't just numbers—it's people. Join meme-driven pools and sentiment-based strategies powered by real community signals.
                </p>

                <div className="mt-auto relative w-full h-[300px] rounded-2xl bg-black/20 border border-white/5 overflow-hidden group-hover:border-[#37F741]/20 transition-colors">
                   {/* Abstract UI representation */}
                   <div className="absolute top-4 left-4 right-4 h-2 rounded-full bg-white/10"></div>
                   <div className="absolute top-8 left-4 w-1/2 h-2 rounded-full bg-white/5"></div>
                   <img src={social_trading_img} className="absolute bottom-[-20%] right-[-20%] w-[120%] opacity-80 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700" alt="Rocket" />
                </div>
             </div>
          </div>

          {/* Small Card - Security (Span 4) */}
          <div className="md:col-span-4 group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-xl hover:border-[#37F741]/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(55,247,65,0.05)]">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-[#37F741]/10 transition-colors duration-500"></div>
            
            <div className="relative h-full p-8 flex flex-col justify-between">
              <div>
                <div className="mb-6 inline-flex p-3 rounded-xl bg-white/5 border border-white/5">
                   <img src={bitcoin_security_img} className="w-6 h-6" alt="Security" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Bitcoin Secured</h3>
                <p className="text-gray-400 text-sm">
                  Leveraging Stacks to anchor all settlements on the most secure blockchain in history.
                </p>
              </div>
              <div className="w-full h-1 rounded-full bg-white/10 mt-6 overflow-hidden">
                <div className="h-full w-2/3 bg-[#37F741] shadow-[0_0_10px_#37F741]"></div>
              </div>
            </div>
          </div>

          {/* Small Card - Non-Custodial (Span 4) */}
          <div className="md:col-span-4 group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/5 backdrop-blur-xl hover:border-[#37F741]/30 transition-all duration-500 hover:shadow-[0_0_30px_rgba(55,247,65,0.05)]">
             <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity duration-500">
                {/* Abstract grid background */}
                <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(circle, #37F741 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
             </div>
             
             <div className="relative h-full p-8 flex flex-col justify-center text-center">
                <h3 className="text-5xl font-bold text-white mb-1 group-hover:text-[#37F741] transition-colors duration-300">100%</h3>
                <p className="text-gray-300 font-medium">Non-Custodial</p>
                <p className="text-gray-500 text-xs mt-2">Your keys, your coins. Always.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;
