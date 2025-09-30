import About from "../molecules/About";
import AboutSection1 from "../molecules/AboutSection1";
import AboutSection2 from "../molecules/AboutSection2";
import Hero from "../molecules/Hero";
import Metric from "../molecules/Metric";
import Options from "../molecules/OptionSection";
import Services from "../molecules/Services";
import { TeamSection } from "../molecules/team-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Services />
      <AboutSection1 />
      <AboutSection2 />
      <Metric />
      <TeamSection />
      <Options />
    </>
  );
}
