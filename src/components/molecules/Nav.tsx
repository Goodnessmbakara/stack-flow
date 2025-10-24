import { Fragment, ReactElement, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Button from "../atoms/Button";
import { IoCloseOutline } from "react-icons/io5";
import { MdOutlineMenu } from "react-icons/md";
import { useTurnkey, AuthState } from "@turnkey/react-wallet-kit";

import StackFlowIcon from "../../assets/stackflow-icon.svg";
import twitterIcon from "../../assets/icons/twitter.svg";

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  address?: string;
  balance?: string;
  onDisconnect: () => Promise<void>;
}

const DisconnectModal = ({
  isOpen,
  onClose,
  userName,
  address,
  balance,
  onDisconnect,
}: DisconnectModalProps) => {
  if (!isOpen) return null;

  const formatAddress = (addr?: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d120c] border border-gray-700 rounded-lg p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {/* User Info */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">Account</p>
            <p className="text-white font-semibold">
              {userName || "Connected Wallet"}
            </p>
          </div>

          {/* Address */}
          {address && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">Address</p>
              <p className="text-white font-mono text-sm break-all">
                {formatAddress(address)}
              </p>
            </div>
          )}

          {/* Balance */}
          {balance && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-2">STX Balance</p>
              <p className="text-green-400 font-semibold text-lg">{balance}</p>
            </div>
          )}
        </div>

        {/* Disconnect Button */}
        <button
          onClick={onDisconnect}
          className="w-full bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 py-2 px-4 rounded-lg transition font-medium"
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
};

const Nav = (): ReactElement => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [stxBalance, setStxBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { handleLogin, disconnectWalletAccount, authState, user } =
    useTurnkey();

  const isAuthenticated = authState === AuthState.Authenticated;

  // Fetch STX balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isAuthenticated || !user?.userEmail) return;

      setIsLoadingBalance(true);
      try {
        const principal = user.userEmail;
        const apiUrl = `https://stacks-testnet-api.testnet.stacks.org/v2/accounts/${principal}?proof=0`;
        const response = await fetch(apiUrl);
        const account = await response.json();

        // Convert microSTX (hex) to STX (1 STX = 1,000,000 microSTX)
        const balanceMicro = parseInt(account.balance, 16);
        const stxAmount = balanceMicro / 1_000_000;
        setStxBalance(stxAmount.toFixed(2));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setStxBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [isAuthenticated, user?.userEmail]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleNavClick = (section: string) => {
    if (location.pathname === "/") {
      const element = document.getElementById(section);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(`/#${section}`);
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

  const formatAddress = (address?: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleDisconnect = async () => {
    try {
      // Try to find wallet provider in various places
      const provider = (user as any)?.wallet?.walletProvider;

      if (provider) {
        await disconnectWalletAccount(provider);
      } else {
        // Fallback: just clear the session
        console.warn("No wallet provider found, clearing session");
      }

      setIsDisconnectModalOpen(false);
      setStxBalance(null);
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      setIsDisconnectModalOpen(false);
    }
  };

  const openDisconnectModal = () => {
    setIsDisconnectModalOpen(true);
  };

  return (
    <Fragment>
      {/* Desktop Navigation */}
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

              <ul className="flex list-none gap-5 m-0 *:cursor-pointer *:text-[1.1rem]">
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
                  rel="noopener noreferrer"
                >
                  <img src={twitterIcon} className="w-8 h-8" />
                </a>

                {isAuthenticated ? (
                  <Button
                    variant="gradient"
                    onClick={openDisconnectModal}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    {formatAddress(user?.userEmail)}
                  </Button>
                ) : (
                  <Button variant="gradient" onClick={() => handleLogin()}>
                    Connect Wallet
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed md:hidden bg-[#0d120c] w-full flex flex-col justify-between p-2 ${
          isMenuOpen ? "h-screen" : "h-fit"
        } z-40`}
      >
        <div>
          <div className="flex items-center justify-between text-white">
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
              <ul className="flex flex-col gap-4 *:border-b border-gray-800">
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
            <a className="w-full *:w-full" href="/whitepaper">
              <Button>Whitepaper</Button>
            </a>

            <div className="w-full">
              {isAuthenticated ? (
                <Button
                  variant="gradient"
                  onClick={openDisconnectModal}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  {formatAddress(user?.userEmail)}
                </Button>
              ) : (
                <Button variant="gradient" onClick={() => handleLogin()}>
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Disconnect Modal */}
      <DisconnectModal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        userName={user?.userName}
        address={user?.userId}
        balance={stxBalance || (isLoadingBalance ? "Loading..." : "0.00")}
        onDisconnect={handleDisconnect}
      />
    </Fragment>
  );
};

export default Nav;
