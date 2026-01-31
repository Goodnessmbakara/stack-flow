import { Outlet } from "react-router-dom";
import Footer from "../molecules/Footer";
import Nav from "../molecules/Nav";
import { BetaBanner } from "../molecules/BetaBanner";
import { FeedbackWidget } from "../molecules/FeedbackWidget";

export function Layout() {
  return (
    <div className="w-full overflow-x-hidden">
      <BetaBanner />
      <Nav />
      <main id="#main-content" className=" bg-[#0F110F]">
        <Outlet />
      </main>
      <Footer />
      <FeedbackWidget />
    </div>
  );
}
