
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-20 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8">Disclaimer</h1>
        <div className="prose max-w-3xl">
          <p className="text-lg text-serona-dark/80 mb-6">
            Serona AI is an AI-driven self-discovery tool providing insights into personality, career, and behavior. It is not a substitute for professional mental health services or medical advice.
          </p>
          <p className="text-lg text-serona-dark/80 mb-6">
            If you are experiencing severe emotional distress, please seek help from a licensed professional.
          </p>
          <p className="text-lg text-serona-dark/80 mb-6">
            By using Serona AI, you agree that:
          </p>
          <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
            <li>All interactions are for informational and self-improvement purposes only</li>
            <li>Serona AI is not responsible for any decisions you make based on its responses</li>
            <li>The platform should not be used as a replacement for professional counseling or therapy</li>
            <li>Results and insights are AI-generated and should be considered as suggestions rather than definitive advice</li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Disclaimer;
