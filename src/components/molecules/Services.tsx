import shape2_img from "../../assets/images/resource/shape2.png";

const Services = () => {
  const features = [
    {
      icon: "./src/assets/1 AI powered.png",
      title: "AI-Powered Trading Strategies",
      description:
        "Optrix.Finance uses AI to automate trading strategies for bullish, bearish, and neutral markets.",
    },
    {
      icon: "./src/assets/2 telegram.png",
      title: "Seamless Telegram Integration",
      description:
        "Trade via Telegram with a bot offering real-time insights for easy on-the-go management.",
    },
    {
      icon: "./src/assets/3 on chain.png",
      title: "On-Chain Derivatives Trading",
      description:
        "Optrix.Finance offers AI-driven on-chain derivatives trading without third-party settlement needs.",
    },
    {
      icon: "./src/assets/4 low fee.png",
      title: "Low Fees + High Accessibility",
      description:
        "Optrix.Finance provides low fees and a user-friendly platform for all crypto derivatives traders.",
    },
    {
      icon: "./src/assets/5 Self- custody.png",
      title: "Self-Custody and Decentralization",
      description:
        "Optrix.Finance ensures users control their assets with a decentralized, self-custody-focused platform.",
    },
    {
      icon: "./src/assets/6 real time market.png",
      title: "Real-Time Market Sentiment Analysis",
      description:
        "Machine learning analyzes market sentiment for dynamic, data-driven trading strategy adjustments.",
    },
  ];

  return (
    <section id="services" className="py-16 relative bg-[#101210]">
      <div className="container px-4 mx-auto md:px-7 lg:px-12">
        <div className="relative">
          <div className="mb-16 text-center text-white">
            <h1 className="mb-2 text-4xl font-bold ">
              Empower Your Trading with
            </h1>
            <h1 className="mb-6 text-4xl font-bold">
              Advanced Tools and Resources
            </h1>
            <p className="text-lg text-white max-w-[43%] mx-auto">
              Utilize advanced tools and resources to enhance your on-chain
              crypto options trading.
            </p>
          </div>

          <div className="absolute top-0 right-0 dream-shape2">
            <img src={shape2_img} alt="shape" className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-[rgba(187,247,55,0.07)] to-transparent p-8 rounded-lg hover:from-transparent hover:to-[rgba(187,247,55,0.1)] transition-all duration-500 cursor-pointer flex flex-col items-center justify-center"
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
