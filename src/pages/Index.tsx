
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";

const Index = () => {
  useEffect(() => {
    // Update meta tags for Home page
    document.title = "Serona AI - Talk with AI for Personal Growth & Self Improvement";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Serona AI helps you understand yourself. Use AI chat online for self-improvement, personal growth, career guidance, and relationship advice.");
    }
  }, []);

  return (
    <main className="min-h-screen bg-white overflow-y-auto overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
};

export default Index;
