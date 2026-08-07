import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Contact from "@/components/Contact";
import GoogleMap from "@/components/GoogleMap";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";

export const metadata = {
  title: "Contact Us - Tiletra",
  description: "Get in touch with Tiletra for premium tile installations and products in Bangalore.",
};

export default function ContactPage() {
  return (
    <QuoteModalProvider>
      <main className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Header />
        
        {/* Page Hero */}
        <div className="pt-48 pb-10 bg-[#052a51] relative overflow-hidden shrink-0">
          <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Get in <span className="text-[#F26522]">Touch</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
              We're here to help you build your dream space. Reach out to us today.
            </p>
          </div>
        </div>

        {/* Contact Section Component */}
        <div className="bg-[#02152b] pb-10">
          <Contact />
        </div>

        {/* Full width Map */}
        <div className="w-full shrink-0">
          <GoogleMap />
        </div>
        
        <Footer />
      </main>
    </QuoteModalProvider>
  );
}
