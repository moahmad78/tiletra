import Header from "@/components/Header";
import Hero from "@/components/Hero";

import Services from "@/components/Services";
import WhyChooseUs from "@/components/WhyChooseUs";
import ProjectGallery from "@/components/ProjectGallery";
import WorkProcess from "@/components/WorkProcess";
import CTA from "@/components/CTA";
import FAQ from "@/components/FAQ";
import ServiceAreas from "@/components/ServiceAreas";
import Contact from "@/components/Contact";
import GoogleMap from "@/components/GoogleMap";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />

      <Services />
      <WhyChooseUs />
      <ProjectGallery />
      <WorkProcess />

      <FAQ />
      <ServiceAreas />


      <Footer />
    </main>
  );
}
