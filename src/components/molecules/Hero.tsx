import { ReactElement } from "react";
import Button from "../atoms/Button";
import { Link } from "react-router-dom";
import Marquee from "react-fast-marquee";

const Hero = (): ReactElement => {
  return (
    <section id="home">
      <div className="w-screen h-full bg-[#1a1a1a] overflow-hidden md:py-20">
        <div className="max-w-[1440px] mx-auto relative w-full h-full">
          <div className="flex flex-col items-center justify-center w-full h-full text-white pt-14 ">
            <div className="container px-5 md:px-7 lg:px-12">
              <div className="relative flex flex-col items-center md:flex-row">
                {/* <!-- Left Column (Text) --> */}
                <div className="max-w-[503px] space-y-5  max-md:mt-20">
                  <a
                    href="https://assuredefi.com/projects/options-ai"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src="assets/verified.png"
                        alt="verified"
                        className="w-10 mt-4"
                      />
                      <h6 className="text-sm font-normal text-white">
                        Assure Defi Kyc'ed
                      </h6>
                    </div>
                  </a>

                  <div className="space-y-5 text-4xl font-black md:text-6xl ">
                    <h1 className="gradient-text">
                      StackFlow <br className="brr" />
                      Bitcoin-Secured <br className="brr" />
                      DeFi
                    </h1>
                    <h1>Sentiment Trading</h1>
                  </div>
                  <p className="text-lg md:text-2xl text-[#f6f6f6] ">
                    Ride the flow of capital and sentiment on Stacks. Track whales, copy trades, and engage in meme-driven investing.
                  </p>

                  <div className="flex items-center gap-5">
                    <Button variant="gradient" className="text-black">
                      <Link
                        to="https://t.me/stackflow_io"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Join Community
                      </Link>
                    </Button>
                    <Button>
                      <Link
                        to={"/app/trade/new"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Launch StackFlow
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* <!-- Right Column (Image) --> */}
                <div className="w-full">
                  <div>
                    <video
                      src="/hero.mp4"
                      className="object-cover w-full h-auto"
                      autoPlay
                      muted
                      loop
                      playsInline
                    ></video>
                  </div>
                </div>
              </div>
            </div>
            {/* marquee */}

            <div className="max-w-[1110px] mx-auto py-10 relative slider-mask ">
              <Marquee autoFill>
                <div className="flex items-center justify-between gap-20 pl-20 *:flex *:items-center *:gap-3 *:uppercase *:text-sm *:font-medium *:w-full *:whitespace-nowrap">
                  <div>
                    <img src="/assets/check.png" />
                    <h5>privacy</h5>
                  </div>
                  <div>
                    <img src="/assets/check.png" />
                    <h5>full custody</h5>
                  </div>
                  <div>
                    <img src="/assets/check.png" />
                    <h5>decentralized</h5>
                  </div>
                  <div>
                    <img src="/assets/check.png" />
                    <h5>whale tracking</h5>
                  </div>
                  <div>
                    <img src="/assets/check.png" />
                    <h5>copy trading</h5>
                  </div>
                  <div>
                    <img src="/assets/check.png" />
                    <h5>privacy</h5>
                  </div>
                  <div>
                    <img src="/assets/check.png" />
                    <h5>Full custody</h5>
                  </div>
                  <div>
                    <img src="/assets/check.png" />
                    <h5>decentralized</h5>
                  </div>
                </div>
              </Marquee>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
