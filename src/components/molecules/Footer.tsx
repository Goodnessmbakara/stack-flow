import {
  FaTelegram,
  FaTwitter,
  FaYoutube,
  FaMedium,
  FaArrowUp,
} from "react-icons/fa";
import { useEffect, useState } from "react";
import logo from "../../assets/optrix logo 1.png";

const socialLinks = [
  { href: "https://t.me/optrix_fi_bot", icon: <FaTelegram /> },
  { href: "https://x.com/Optrix_Finance", icon: <FaTwitter /> },
  {
    href: "https://www.youtube.com/@Optrix_Finance",
    icon: <FaYoutube />,
  },
  {
    href: "https://medium.com/@optrix_finance",
    icon: <FaMedium />,
  },
];

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#options", label: "Options" },
];

const Footer = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalHeight) * 100;
      setProgress(currentProgress);
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="contact" className="py-16 bg-black">
      <div className="container px-4 mx-auto md:px-7 lg:px-12">
        <div className="grid grid-cols-1 gap-8 mb-12 md:grid-cols-2">
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Optrix.Finance" className="w-12" />
                <span className="font-bold text-white">Optrix.Finance</span>
              </div>

              <p className="mt-4 text-gray-300">
                Elevate your crypto options trading experience with
                Optrix.Finance's innovative platform.
              </p>

              <div className="flex gap-4 mt-6">
                {socialLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="text-gray-500 hover:text-gray-300 transition-colors [&>*]:text-[1.3rem] "
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 pt-8 border-t border-gray-800 md:grid-cols-2">
          <div>
            <p className="text-gray-300">
              2024 | Optrix.finance All rights reserved.
            </p>
          </div>

          <nav className="md:text-right">
            <ul className="flex flex-wrap gap-6 md:justify-end">
              {navLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-300 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div
          className={`fixed bottom-5 right-12 h-[46px] w-[46px] cursor-pointer rounded-full 
        shadow-[inset_0_0_0_2px_rgba(187,247,55,0.2)] z-[10000] transition-all duration-200
        ${
          isVisible
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible translate-y-4"
        }`}
          onClick={scrollToTop}
        >
          <svg className="w-full h-full -rotate-90" viewBox="-1 -1 102 102">
            <path
              d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98"
              className="stroke-[#bbf737] fill-none"
              strokeWidth="4"
              style={{
                transition: "stroke-dashoffset 200ms linear",
                strokeDasharray: "307.919, 307.919",
                strokeDashoffset: `${307.919 - (progress * 307.919) / 100}`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <FaArrowUp className="text-[#ffde5d] hover:text-[#2871ff] transition-colors duration-200 text-lg" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
