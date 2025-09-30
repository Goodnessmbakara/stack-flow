import { FaRegEnvelope } from "react-icons/fa6";
import Button from "../atoms/Button";
import { IoCheckmarkDoneOutline } from "react-icons/io5";
import burn_img from "../../assets/Graphics/burn.png";
import shape_1 from "../../assets/images/resource/shap-1.png";

const AboutSection2 = () => {
  return (
    <section className="bg-[#0d120c]  text-white py-16">
      <div className="container px-4 mx-auto md:px-7 lg:px-12">
        <div className="grid items-center grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column - Image */}
          <div className="flex justify-start">
            <div className="relative ">
              <img
                src={burn_img}
                alt="Buyback and Burn"
                className="w-[clamp(20rem,50vw,500px)] filter drop-shadow-[30px_20px_10px_#000000]"
              />
              <div className="absolute inset-0">
                <img src={shape_1} alt="Shape" />
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="space-y-8">
            <div>
              <h1 className="mb-6 text-4xl font-bold">🔥Buyback & Burn</h1>
              <p className="text-gray-300">
                To demonstrate our commitment to increasing the value of $OPX
                for our users, we will allocate 50% of all revenue to the
                Buyback & Burn program. This initiative aims to lower the total
                supply of $OPX, enhancing its scarcity and value over time.
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-3 border-b border-b-white/10 pb-10 text-[#7b7b7b]">
              {[
                "50% Revenue Allocation",
                "Token Burn",
                "Frequency",
                "User-Centric Value Enhancement",
              ].map((item) => (
                <li key={item} className="flex items-center space-x-2">
                  <IoCheckmarkDoneOutline className="text-[#bbf737] " />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <a
              className="flex items-center justify-end w-full gap-2 text-black"
              href="https://optrix-finance.gitbook.io/optrix.finance/revenue-structure/buyback-and-burn"
              target="_blank"
            >
              <FaRegEnvelope className="text-[#bbf737] text-[1.3rem]" />
              <Button variant="gradient">Know more</Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection2;
