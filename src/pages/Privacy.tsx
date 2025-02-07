
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-20 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8">Privacy Policy</h1>
        <div className="prose max-w-3xl">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">Data Collection</h2>
            <p className="text-lg text-serona-dark/80">
              Serona AI collects and stores user interactions to enhance personalized experiences. We do not share, sell, or misuse personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">Data Usage</h2>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Conversations may be analyzed to improve AI accuracy</li>
              <li>No sensitive personal details are stored</li>
              <li>Data is not used for advertising purposes</li>
              <li>Users have the right to request data deletion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">Data Protection</h2>
            <p className="text-lg text-serona-dark/80">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Encryption of all data in transit and at rest</li>
              <li>Regular security audits and updates</li>
              <li>Strict access controls and monitoring</li>
              <li>Compliance with data protection regulations</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
