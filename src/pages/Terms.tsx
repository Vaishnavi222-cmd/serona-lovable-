
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
            <p className="text-lg text-serona-dark/80">
              By using Serona AI, you agree to engage with the platform for self-improvement purposes only. Any misuse of the AI, including inappropriate behavior, may result in immediate service termination.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">2. Service Usage</h2>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Free-tier users have limited daily messages</li>
              <li>Premium subscribers receive unlimited access</li>
              <li>Users must be 18 years or older to use the service</li>
              <li>Users are responsible for maintaining account security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">3. Content Guidelines</h2>
            <p className="text-lg text-serona-dark/80">
              Users must not use Serona AI for:
            </p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Generating harmful or malicious content</li>
              <li>Spreading misinformation</li>
              <li>Harassing or threatening others</li>
              <li>Any illegal activities</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
