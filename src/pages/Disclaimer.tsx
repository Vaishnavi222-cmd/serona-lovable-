
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-20 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8">Disclaimer</h1>
        <div className="prose max-w-3xl">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">AI-Powered Self-Discovery – Not Professional Advice</h2>
            <p className="text-lg text-serona-dark/80 mb-6">
              Serona AI is an AI-driven self-discovery tool designed to provide deep insights into personality traits, career paths, relationships, and life choices. However, it is important to understand the following:
            </p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Serona AI is not a licensed therapist, medical professional, or certified counselor.</li>
              <li>The insights provided are AI-generated recommendations, not professional diagnoses or definitive advice.</li>
              <li>This platform is for informational and self-improvement purposes only.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">When to Seek Professional Help?</h2>
            <p className="text-lg text-serona-dark/80 mb-4">If you are experiencing:</p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Severe emotional distress</li>
              <li>Anxiety, depression, or suicidal thoughts</li>
              <li>Mental health conditions requiring professional treatment</li>
            </ul>
            <p className="text-lg text-serona-dark/80 mb-6">
              Please consult a qualified mental health professional or crisis support service in your region. Serona AI does not replace therapy, professional counseling, or medical guidance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">User Agreement</h2>
            <p className="text-lg text-serona-dark/80 mb-4">By using Serona AI, you acknowledge and agree that:</p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Insights provided are suggestions and should be interpreted at your discretion.</li>
              <li>You are solely responsible for your personal choices and actions based on AI-generated insights.</li>
              <li>Serona AI does not take liability for any decisions made using its responses.</li>
              <li>The platform must not be used for diagnosing or treating any psychological conditions.</li>
            </ul>
          </section>

          <p className="text-lg text-serona-dark/80">
            If you have any concerns about your mental well-being, please seek guidance from a certified professional. For support, reach out via our Contact Us page or email support@seronaai.tech.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Disclaimer;
