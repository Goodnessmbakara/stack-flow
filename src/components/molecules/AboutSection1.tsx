import Button from "../atoms/Button";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import { Link } from "react-router-dom";

const AboutSection1 = () => {
  return (
    <section className="bg-[#0d120c] text-white pt-24  border-b border-y border-y-white/10 pb-10">
      <div className="container px-4 mx-auto md:px-7 lg:px-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <div className="text-4xl font-bold">
                <h1>Ride the Flow of</h1>
                <h1>Capital and Sentiment</h1>
                <h1>On Bitcoin-Secured</h1>
                <h1>Infrastructure</h1>
              </div>

              <p className="text-[#7b7b7b] w-full md:w-3/4">
                Built on Stacks blockchain. Track whales, copy trades, and join
                meme-driven investment pools with professional sentiment
                strategies.
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3 border-b border-b-white/10 pb-10 text-[#7b7b7b]">
              {[
                "Whale Tracking & Copy Trading",
                "Bitcoin-Secured Smart Contracts",
                "Social Sentiment Strategies",
              ].map((item) => (
                <li key={item} className="flex items-center space-x-2">
                  <IoCheckmarkDoneOutline className="text-[#bbf737] " />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <Link
              to="/about"
              className="flex items-center justify-start w-full gap-2 text-black"
            >
              <Button variant="gradient">See About</Button>
            </Link>
          </div>

          {/* Right Column */}
          <div className="relative mt-18">
            <img
              src="/src/assets/new graphics/4.png"
              alt="StackFlow Platform"
              className="w-[clamp(20rem,40vw,590px)] filter drop-shadow-[30px_20px_10px_#000000]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection1;
