import { Fragment, ReactElement, useState } from "react";
import Button from "../atoms/Button";
import { IoCloseOutline } from "react-icons/io5";
import { MdOutlineMenu } from "react-icons/md";
import CustomConnectButton from "../atoms/ConnectButton";

import StackFlowIcon from "../../assets/stackflow-icon.svg";
import twitterIcon from "../../assets/icons/twitter.svg";
import telegramIcon from "../../assets/icons/telegram.svg";

const Nav = (): ReactElement => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const showToast = () => {};
  return (
    <Fragment>
      <div className="fixed top-0 bg-[#0d120c] z-50 w-full py-4 hidden md:block">
        <div className="max-w-[1440px] mx-auto px-5 md:px-7 lg:px-12">
          <div className="flex items-center">
            <nav className="flex items-center justify-between w-full">
              <div>
                <div
                  className="sticky flex items-center gap-2"
                  title="StackFlow"
                >
                  <img src={StackFlowIcon} alt="logo" className="w-12" />
                  <h4 className="text-base font-bold text-white md:text-xl">
                    StackFlow
                  </h4>
                </div>
              </div>
              <ul className="flex list-none gap-5 m-0 [&>*]:cursor-pointer [&>*]:text-[1.1rem]">
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#home">Home</a>
                </li>
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#about">About</a>
                </li>
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#services">Services</a>
                </li>
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#options">Options</a>
                </li>
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#contact">Contact</a>
                </li>
              </ul>

              <div className="flex gap-2.5 items-center">
                <a
                  href="https://t.me/stackflow_io"
                  className="hover:opacity-80"
                  target="_blank"
                >
                  <img src={telegramIcon} className="w-6 h-6" />
                </a>
                <a
                  href="https://x.com/StackFlow_io"
                  className="hover:opacity-80"
                  target="_blank"
                >
                  <img src={twitterIcon} className="w-6 h-6" />
                </a>
                <a
                  href="/whitepaper"
                >
                  <Button>Whitepaper</Button>
                </a>

                <Button onClick={showToast} variant="gradient">
                  Chart
                </Button>
                <CustomConnectButton />

                <div className="absolute hidden p-2 text-white bg-gray-800 rounded group-hover:block">
                  Coming soon!!
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div
        className={`fixed md:hidden bg-[#0d120c] w-full  flex flex-col justify-between p-2 ${
          isMenuOpen ? "h-screen" : "h-fit"
        }`}
      >
        <div className="">
          <div className="flex items-center justify-between text-white ">
            <div className="font-bold flex items-center gap-1.5">
              <img src={StackFlowIcon} alt="logo" className="w-12" />
              <span className="font-bold text-white">StackFlow</span>
            </div>
            {isMenuOpen ? (
              <IoCloseOutline
                className="text-[1.7rem] cursor-pointer"
                onClick={toggleMenu}
              />
            ) : (
              <MdOutlineMenu
                onClick={toggleMenu}
                className="text-[1.7rem] cursor-pointer"
              />
            )}
          </div>
          {isMenuOpen && (
            <nav className="pt-10">
              <ul className="flex flex-col gap-4 [&>*]:border-b border-gray-800">
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#home">Home</a>
                </li>
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#about">About</a>
                </li>
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#services">Services</a>
                </li>
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#options">Options</a>
                </li>
                <li className="text-white hover:text-[#bbf737]">
                  <a href="#contact">Contact</a>
                </li>
              </ul>
            </nav>
          )}
        </div>

        {isMenuOpen && (
          <div className="flex flex-col w-full gap-2">
            <a
              className="w-full [&>*]:w-full"
              href="/whitepaper"
            >
              <Button>Whitepaper</Button>
            </a>

            <Button onClick={showToast} variant="gradient">
              Chart
            </Button>

            <div className="w-full">
              <CustomConnectButton />
            </div>
          </div>
        )}
      </div>
    </Fragment>
  );
};

export default Nav;
