
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Footer from "../components/Footer";

const Index = () => {
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
