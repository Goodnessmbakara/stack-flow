import Button from "../atoms/Button";
import { FaRegEnvelope } from "react-icons/fa6";
import { IoCheckmarkDoneOutline } from "react-icons/io5";

const AboutSection1 = () => {
  return (
    <section className="bg-[#0d120c] text-white pt-24  border-b border-y border-y-white/10 pb-10">
      <div className="container px-4 mx-auto md:px-7 lg:px-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Left Column */}
          <div className="space-y-8">
            <div>
              <div className="text-4xl font-bold">
                <h1>Revolutionize Your</h1>
                <h1>Trading Journey</h1>
                <h1>With AI-Powered</h1>
                <h1>Predefined Strategies</h1>
              </div>

              <p className="text-[#7b7b7b] w-full md:w-3/4">
                Pioneering on-chain crypto options trading. Transparent, secure,
                and user-centric platform for confident trading.
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3 border-b border-b-white/10 pb-10 text-[#7b7b7b]">
              {[
                "Transparent Trading",
                "Predefined Strategies",
                "User-Centric Approach",
              ].map((item) => (
                <li key={item} className="flex items-center space-x-2">
                  <IoCheckmarkDoneOutline className="text-[#bbf737] " />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <a
              href="https://optrix-finance.gitbook.io/optrix.finance/introduction/about-us/role-of-ai-in-optrix.finance"
              className="flex items-center justify-end w-full gap-2 text-black"
              target="_blank"
            >
              <FaRegEnvelope className="text-[#bbf737] text-[1.3rem]" />
              <Button variant="gradient">Know more</Button>
            </a>
          </div>

          {/* Right Column */}
          <div className="relative mt-18">
            <img
              src="/src/assets/Graphics/Transforming Crypto Options 1.png"
              alt="Transforming Crypto Options"
              className="w-[clamp(20rem,40vw,590px)] filter drop-shadow-[30px_20px_10px_#000000]"
            />
            <div className="absolute inset-0 flex items-end w-full about-shape">
              <img
                src="/src/assets/images/resource/shap-1.png"
                alt="Shape"
                className="absolute"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection1;
