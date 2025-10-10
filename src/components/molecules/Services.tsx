// import shape2_img from "../../assets/images/resource/shape2.png";

const Services = () => {
  const features = [
    {
      icon: "./src/assets/new graphics/1.png",
      title: "Whale Tracking & Copy Trading",
      description:
        "Track successful traders on Stacks and automatically mirror their moves. Follow the whales with real-time signal detection and efficient portfolio strategies.",
    },
    {
      icon: "./src/assets/new graphics/2.png",
      title: "Bitcoin-Secured Infrastructure",
      description:
        "Built on Stacks blockchain, StackFlow leverages Bitcoin's security for trustless DeFi trading without compromising decentralization.",
    },
    {
      icon: "./src/assets/new graphics/rocket.png",
      title: "Meme-Driven Community Pools",
      description:
        "Join viral investment opportunities with community-driven meme pools. Participate in social sentiment trading with real-time viral score tracking.",
    },
    {
      icon: "./src/assets/new graphics/3.png",
      title: "Advanced Capital Strategies",
      description:
        "Access 12+ proven sentiment strategies including bullish, bearish, high volatility, and low volatility approaches for every market condition.",
    },
    {
      icon: "./src/assets/new graphics/4.png",
      title: "Self-Custody & Clarity Smart Contracts",
      description:
        "Your assets never leave your wallet. All trading logic executed through audited Clarity smart contracts with transparent on-chain verification.",
    },
    {
      icon: "./src/assets/new graphics/5.png",
      title: "Real-Time Social Signals",
      description:
        "AI-powered sentiment engine aggregates whale behavior, community memes, and market data for dynamic trading insights and social investing.",
    },
  ];

  return (
    <section id="services" className="py-16 relative bg-[#101210]">
      <div className="container px-4 mx-auto md:px-7 lg:px-12">
        <div className="relative">
          <div className="mb-16 text-center text-white">
            <h1 className="mb-2 text-4xl font-bold ">
              Ride the Flow of Capital
            </h1>
            <h1 className="mb-6 text-4xl font-bold">and Sentiment on Stacks</h1>
            <p className="text-lg text-white max-w-[43%] mx-auto">
              Bitcoin-secured DeFi with whale tracking, copy trading, and
              meme-driven investing. Built on Stacks for the next generation of
              social traders.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 rounded-lg hover:from-transparent hover:to-[rgba(187,247,55,0.1)] transition-all duration-500 cursor-pointer flex flex-col items-center justify-center border border-1 border-[#37f741]/20 hover:border-[#37f741]/40 h-full"
            >
              <div className="mb-6">
                <img src={feature.icon} alt={feature.title} className="h-20" />
              </div>
              <div className="text-center">
                <h2 className="text-[1.5rem] font-bold mb-4 text-white">
                  {feature.title}
                </h2>
                <p className="text-gray-400 text-[1.2rem]">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
