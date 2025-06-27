import { useEffect } from "react";
import { DividerComponent } from "../../shared";
import VerticalTimeline from "../../components/story/VerticalTimeline";
import ServicesGrid from "../../components/story/ServicesGrid";
import TestimonialsSpotlight from "../../components/story/TestimonialsSpotlight";
import CommitmentParallax from "../../components/story/CommitmentParallax";
import HeroSection from "../../components/story/HeroSection";


const responsive = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 2 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* New Hero */}
      <HeroSection />

      {/* New Storytelling Sections */}
      <VerticalTimeline />
      <DividerComponent topColor="#2A7F9E" bottomColor="#0C3C54" height={120} />
      <ServicesGrid />
      <TestimonialsSpotlight />
      <DividerComponent topColor="#0C3C54" bottomColor="#2A7F9E" height={120} />
      <CommitmentParallax />

      {/* <div className="w-screen" style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}>
        <DividerComponent topColor="#2A7F9E" bottomColor="#0C3C54" height={120} />
      </div> */}
    </div>
  );
};

export default Home;