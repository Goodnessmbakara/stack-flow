import { Fragment, ReactElement, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Button from "../atoms/Button";
import { IoCloseOutline } from "react-icons/io5";
import { MdOutlineMenu } from "react-icons/md";
import CustomConnectButton from "../atoms/ConnectButton";

import StackFlowIcon from "../../assets/stackflow-icon.svg";
import twitterIcon from "../../assets/icons/twitter.svg";

const Nav = (): ReactElement => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleNavClick = (section: string) => {
    // If we're on the home page, just scroll to the section
    if (location.pathname === "/") {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Navigate to home page with the hash
      navigate(`/#${section}`);
      // After navigation, scroll to the section
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  // const showToast = () => {};
  return (
    <Fragment>
      <div className="fixed top-0 bg-[#0d120c] z-50 w-full py-4 hidden md:block">
        <div className="max-w-[1440px] mx-auto px-5 md:px-7 lg:px-12">
          <div className="flex items-center">
            <nav className="flex items-center justify-between w-full">
              <div>
                <div
                  className="sticky flex items-center gap-2 cursor-pointer"
                  title="StackFlow"
                  onClick={handleLogoClick}
                >
                  <img src={StackFlowIcon} alt="logo" className="w-12" />
                  <h4 className="text-base font-bold text-white md:text-xl">
                    StackFlow
                  </h4>
                </div>
              </div>
              <ul className="flex list-none gap-5 m-0 [&>*]:cursor-pointer [&>*]:text-[1.1rem]">
                <li
                  className="text-white hover:text-[#bbf737]"
                  onClick={() => handleNavClick("home")}
                >
                  Home
                </li>
                <Link className="text-white hover:text-[#bbf737]" to="/about">
                  About
                </Link>
                <li
                  className="text-white hover:text-[#bbf737]"
                  onClick={() => handleNavClick("services")}
                >
                  Services
                </li>
                <li
                  className="text-white hover:text-[#bbf737]"
                  onClick={() => handleNavClick("options")}
                >
                  Options
                </li>
                <li
                  className="text-white hover:text-[#bbf737]"
                  onClick={() => handleNavClick("contact")}
                >
                  Contact
                </li>
              </ul>

              <div className="flex gap-2.5 items-center">
                <a
                  href="https://x.com/stackflowBTC"
                  className="hover:opacity-80"
                  target="_blank"
                >
                  <img src={twitterIcon} className="w-8 h-8" />
                </a>

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
            <div
              className="font-bold flex items-center gap-1.5 cursor-pointer"
              onClick={handleLogoClick}
            >
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
                <li
                  className="text-white hover:text-[#bbf737] cursor-pointer"
                  onClick={() => {
                    handleNavClick("home");
                    toggleMenu();
                  }}
                >
                  Home
                </li>
                <li
                  className="text-white hover:text-[#bbf737] cursor-pointer"
                  onClick={() => {
                    handleNavClick("about");
                    toggleMenu();
                  }}
                >
                  About
                </li>
                <li
                  className="text-white hover:text-[#bbf737] cursor-pointer"
                  onClick={() => {
                    handleNavClick("services");
                    toggleMenu();
                  }}
                >
                  Services
                </li>
                <li
                  className="text-white hover:text-[#bbf737] cursor-pointer"
                  onClick={() => {
                    handleNavClick("options");
                    toggleMenu();
                  }}
                >
                  Options
                </li>
                <li
                  className="text-white hover:text-[#bbf737] cursor-pointer"
                  onClick={() => {
                    handleNavClick("contact");
                    toggleMenu();
                  }}
                >
                  Contact
                </li>
              </ul>
            </nav>
          )}
        </div>

        {isMenuOpen && (
          <div className="flex flex-col w-full gap-2">
            <a className="w-full [&>*]:w-full" href="/whitepaper">
              <Button>Whitepaper</Button>
            </a>

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
