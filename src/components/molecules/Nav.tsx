import { Fragment, ReactElement, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { IoCloseOutline } from "react-icons/io5";
import { MdOutlineMenu } from "react-icons/md";
import CustomConnectButton from "../atoms/ConnectButton";

import StackFlowIcon from "../../assets/stackflow-icon.svg";
import twitterIcon from "../../assets/icons/twitter.svg";

const Nav = (): ReactElement => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (section: string) => {
    // Standardize section keys
    let targetPath = "/";
    let targetHash = section;

    if (section === "about") {
      targetPath = "/about";
      targetHash = ""; // scroll to top of about page
    } else if (section === "the team") {
      targetPath = "/about";
      targetHash = "team";
    }

    if (location.pathname === targetPath) {
      if (targetHash) {
        const element = document.getElementById(targetHash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      navigate(`${targetPath}${targetHash ? `#${targetHash}` : ""}`);
      if (targetHash) {
        setTimeout(() => {
          const element = document.getElementById(targetHash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 300); // Increased timeout for page load
      }
    }
  };

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <Fragment>
      {/* Desktop Floating Glass Navbar - Unified Layout */}
      <div className="fixed top-6 left-0 right-0 z-50 hidden md:flex justify-center px-4">
        <div 
          className={`
            w-full max-w-[1440px] 
            mx-auto px-6 py-3 
            rounded-2xl 
            transition-all duration-300 ease-in-out
            border border-white/5
            flex items-center justify-between
            ${scrolled 
              ? "bg-[#0d120c]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border-white/10" 
              : "bg-[#0d120c]/60 backdrop-blur-md shadow-lg"
            }
          `}
        >
          {/* Left: Logo Section */}
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            title="StackFlow"
            onClick={handleLogoClick}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-[#37F741]/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img src={StackFlowIcon} alt="logo" className="w-10 relative z-10" />
            </div>
            <h4 className="text-xl font-bold text-white tracking-tight group-hover:text-[#37F741] transition-colors duration-300">
              StackFlow
            </h4>
          </div>

          {/* Right Group: Nav + Social + Wallet */}
          <div className="flex items-center gap-8">
            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              <ul className="flex list-none gap-6 m-0 items-center">
                {['About', 'Services', 'Options', 'The Team'].map((item) => (
                  <li
                    key={item}
                    className="relative text-white/80 text-[0.85rem] font-medium cursor-pointer transition-all duration-300 hover:text-[#37F741] group"
                    onClick={() => handleNavClick(item.toLowerCase())}
                  >
                    {item}
                    <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-[#37F741] transition-all duration-300 group-hover:w-full"></span>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="w-px h-6 bg-white/10"></div>

            {/* Social & Wallet */}
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/stackflowBTC"
                className="hover:opacity-80 hover:scale-110 transition-transform duration-300 bg-white/5 p-1.5 rounded-full border border-white/5 hover:border-[#37F741]/50 flex items-center justify-center"
                target="_blank"
              >
                <img src={twitterIcon} className="w-4 h-4" />
              </a>

              <div className="relative group min-w-[140px]">
                <CustomConnectButton />
                <div className="absolute top-full mt-2 right-0 hidden p-2 text-xs text-white bg-black/90 backdrop-blur border border-white/10 rounded-md whitespace-nowrap group-hover:block z-50">
                  Connecting Bitcoin Economy
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Glass Menu */}
      <div
        className={`fixed md:hidden w-full z-[1000] transition-all duration-300 ${
          isMenuOpen ? "h-screen bg-[#0d120c]/95 backdrop-blur-xl" : "h-[70px] bg-[#0d120c]/80 backdrop-blur-md"
        }`}
      >
        <div className="p-4 border-b border-white/5 h-full flex flex-col">
          <div className="flex items-center justify-between text-white shrink-0">
            <div
              className="font-bold flex items-center gap-2 cursor-pointer"
              onClick={handleLogoClick}
            >
              <img src={StackFlowIcon} alt="logo" className="w-10" />
              <span className="font-bold text-lg">StackFlow</span>
            </div>
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-full hover:bg-white/5 active:scale-95 transition-all"
            >
              {isMenuOpen ? (
                <IoCloseOutline className="text-2xl text-[#37F741]" />
              ) : (
                <MdOutlineMenu className="text-2xl" />
              )}
            </button>
          </div>
          
          {isMenuOpen && (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto mt-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <nav>
                <ul className="flex flex-col gap-2">
                  {['About', 'Services', 'Options', 'The Team'].map((item, idx) => (
                    <li
                      key={item}
                      className="text-white text-2xl font-light hover:text-[#37F741] hover:pl-2 cursor-pointer transition-all duration-300 py-3 border-b border-white/5"
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => {
                        handleNavClick(item.toLowerCase());
                        toggleMenu();
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="flex flex-col gap-4 mt-8">
                <div className="w-full">
                  <CustomConnectButton />
                </div>
                <div className="flex justify-center gap-4 py-4">
                  <a href="https://x.com/stackflowBTC" target="_blank" className="text-white/60 hover:text-[#37F741]">
                    <img src={twitterIcon} className="w-6 h-6 opacity-80" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export default Nav;
