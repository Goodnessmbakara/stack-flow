import { ReactElement } from "react";
import Button from "../atoms/Button";
import { Link } from "react-router-dom";
import Marquee from "react-fast-marquee";
import HeroImage from "../../assets/images/hero-3d-visual.png";
import { FaBitcoin, FaChartLine, FaShieldAlt, FaRocket, FaGlobe } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";

const Hero = (): ReactElement => {
  return (
    <section id="home" className="relative overflow-hidden bg-[#0d120c]">
      {/* Background Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#37F741]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#37F741]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1440px] mx-auto relative w-full pt-32 pb-20 px-6 md:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Column */}
          <div className="flex-1 space-y-8 z-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#37F741]/10 border border-[#37F741]/20 backdrop-blur-md">
              <div className="flex relative items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-[#37F741] animate-ping absolute opacity-75"></div>
                 <div className="w-2 h-2 rounded-full bg-[#37F741] relative"></div>
              </div>
              <span className="text-sm font-semibold tracking-wide text-[#37F741] uppercase">
                Live on Stacks
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
                <span className="block drop-shadow-[0_0_30px_rgba(55,247,65,0.3)]">
                  DeFi Squared.
                </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#37F741] via-white to-[#37F741] animate-gradient-x bg-[length:200%_auto]">
                  Bitcoin Secured.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                Unleash the power of <span className="text-white font-medium border-b border-[#37F741]">Stacks</span>. 
                Track whales, copy elite traders, and trade with meme-speed on the most secure blockchain in history.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Button variant="gradient" className="text-black font-bold px-8 py-4 text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(55,247,65,0.4)]">
                <Link to={"/trade"} className="flex items-center gap-2">
                  <FaRocket /> Launch App
                </Link>
              </Button>
              <Button className="px-8 py-4 text-lg border-white/20 hover:bg-white/5 backdrop-blur-sm">
                 <Link to={"/services"} className="flex items-center gap-2">
                   Explore Strategy
                 </Link>
              </Button>
            </div>
            
            <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-500 font-mono">
              <div>
                <span className="block text-2xl text-white font-bold">$125M+</span>
                Volume Traded
              </div>
              <div className="w-px h-10 bg-gray-800"></div>
              <div>
                 <span className="block text-2xl text-white font-bold">15k+</span>
                 Active Traders
              </div>
            </div>
          </div>

          {/* Visual Column */}
          <div className="flex-1 w-full relative z-10 group">
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm shadow-[0_0_60px_rgba(55,247,65,0.15)] transition-all duration-500 group-hover:shadow-[0_0_80px_rgba(55,247,65,0.25)] group-hover:border-[#37F741]/30">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#37F741]/10 to-transparent opacity-50"></div>
              <img
                src={HeroImage}
                alt="StackFlow Dashboard 3D"
                className="w-full h-auto transform transition-transform duration-700 hover:scale-105"
              />
              
              {/* Floating UI Cards */}
              <div className="absolute -bottom-6 -left-6 md:bottom-8 md:-left-8 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-4 shadow-2xl animate-bounce-slow max-md:hidden">
                <div className="bg-[#37F741]/20 p-3 rounded-xl">
                  <IoStatsChart className="text-[#37F741] text-2xl" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">APY</div>
                  <div className="text-lg font-bold text-white">+124.5%</div>
                </div>
              </div>

               <div className="absolute -top-6 -right-6 md:top-12 md:-right-8 p-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-4 shadow-2xl animate-float max-md:hidden">
                <div className="bg-orange-500/20 p-3 rounded-xl">
                   <FaBitcoin className="text-orange-500 text-2xl" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Bitcoin Layer</div>
                  <div className="text-lg font-bold text-white">Secured</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Marquee */}
      <div className="border-y border-white/5 bg-black/20 backdrop-blur-sm relative z-20">
        <Marquee autoFill speed={30} gradient={false} className="py-6">
          <div className="flex items-center gap-12 px-6">
            <FeatureItem icon={<FaChartLine />} text="Whale Tracking" />
            <FeatureItem icon={<IoStatsChart />} text="Copy Trading" />
            <FeatureItem icon={<FaBitcoin />} text="Bitcoin Secured" />
            <FeatureItem icon={<FaShieldAlt />} text="Non-Custodial" />
            <FeatureItem icon={<FaGlobe />} text="Global Access" />
            <FeatureItem icon={<FaRocket />} text="Meme Pools" />
             {/* Duplicate for seamless loop visual balance if needed, though autoFill handles it */}
          </div>
        </Marquee>
      </div>
    </section>
  );
};

const FeatureItem = ({ icon, text }: { icon: ReactElement, text: string }) => (
  <div className="flex items-center gap-3 text-gray-400 hover:text-[#37F741] transition-colors duration-300">
    <span className="text-xl opacity-80">{icon}</span>
    <span className="text-base font-semibold tracking-wider uppercase">{text}</span>
  </div>
);

export default Hero;


