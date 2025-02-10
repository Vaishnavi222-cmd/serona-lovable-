
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-20 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8">Terms & Conditions</h1>
        <div className="prose max-w-3xl">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">1. Agreement to Terms</h2>
            <p className="text-lg text-serona-dark/80 mb-6">
              By accessing Serona AI, you agree to use it for self-discovery and informational purposes only.
              Misuse of the platform, including inappropriate or harmful behavior, may result in account suspension or termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">2. Service Usage</h2>
            <p className="text-lg text-serona-dark/80 mb-4">
              Serona AI offers a free tier with limited daily messages and a premium plan with unlimited access.
            </p>
            <p className="text-lg text-serona-dark/80 mb-4">User Guidelines:</p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Users must be 18 years or older to access the platform.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>The AI should not be used for illegal activities, spreading misinformation, or harassment.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">3. Content & Conduct Guidelines</h2>
            <p className="text-lg text-serona-dark/80 mb-4">Users must not engage in the following:</p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Using the AI to generate harmful, illegal, or offensive content.</li>
              <li>Spreading misinformation or deceptive claims.</li>
              <li>Harassment, threats, or cyberbullying.</li>
              <li>Attempting to manipulate AI behavior for unethical purposes.</li>
            </ul>
            <p className="text-lg text-serona-dark/80 mb-6">
              Serona AI reserves the right to suspend or terminate accounts violating these terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">4. Support & Contact Information</h2>
            <p className="text-lg text-serona-dark/80">
              For any concerns, visit our Contact Us page or reach out to support@seronaai.tech.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
