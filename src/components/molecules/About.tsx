import { ReactElement } from "react";
import { GoArrowUpRight } from "react-icons/go";
import leverage_img from "../../assets/icons/Leverage 1.png";
import risk_management_img from "../../assets/icons/Risk Management.png";
import flexibility_img from "../../assets/icons/Flexibility.png";
import rev_img from "../../assets/Graphics/Revolutionizing Crypto Options 1.png";

const serviceBoxes = [
  {
    icon: leverage_img,
    title: "Leverage",
    description: "Control more crypto with minimal investment.",
    iconSize: "h-12 w-12",
  },
  {
    icon: risk_management_img,
    title: "Risk Management",
    description: "Hedge against potential cryptocurrency losses.",
    iconSize: "h-12 w-12",
  },
  {
    icon: flexibility_img,
    title: "Flexibility",
    description: "Profit in any market condition.",
    iconSize: "h-16 w-12",
  },
];

const About = (): ReactElement => {
  return (
    <div
      id="about"
      className="bg-gradient-to-b from-[#101210] via-[#0c0d0c] to-[#080908] pt-5 pb-16"
    >
      <div className="container px-4 mx-auto md:px-7 lg:px-12">
        <div className="flex flex-wrap">
          <div className="w-full lg:w-1/2">
            <div className="p-8 text-white">
              <h4 className="text-xl mb-2 text-[#bbf838]">About us</h4>
              <h1 className="text-4xl font-bold">
                Revolutionizing Crypto Options
              </h1>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap service-bg">
          <div className="w-full lg:w-1/2">
            <div className="serivce-thumb">
              <img
                src={rev_img}
                className="w-[clamp(24rem,50vw,35rem)] filter drop-shadow-[30px_20px_10px_#000000] pr-16"
                alt="Revolutionizing Crypto Options"
              />
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="flex flex-col space-y-6">
              {serviceBoxes.map((service, index) => (
                <a
                  key={index}
                  href="https://optrix-finance.gitbook.io/optrix.finance/introduction/about-us/mastering-on-chain-options-trading"
                  className="block "
                  target="_blank"
                >
                  <div className="flex items-center justify-between flex-1 p-6 transition-all bg-white rounded-lg single-service-box2 bg-opacity-10 hover:bg-opacity-20">
                    <div>
                      <div className="service-icon pr-2.5">
                        <img
                          src={service.icon}
                          className={service.iconSize}
                          alt={service.title}
                        />
                      </div>
                      <div className="flex-1 service-content">
                        <h2 className="mb-2 text-xl font-semibold text-white service-title">
                          {service.title}
                        </h2>
                        <p className="mb-4 text-gray-300 service-desc">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    <GoArrowUpRight className="text-[#3E3F3D] text-[2.2rem]" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
