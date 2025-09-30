import { Outlet } from "react-router-dom";
import Footer from "../molecules/Footer";
import Nav from "../molecules/Nav";

export function Layout() {
  return (
    <div className="w-full overflow-x-hidden">
      <Nav />
      <main id="#main-content" className=" bg-[#0F110F]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
