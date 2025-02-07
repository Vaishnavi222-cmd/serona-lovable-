
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Refund = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-20 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8">Refund & Cancellation Policy</h1>
        <div className="prose max-w-3xl">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">Refund Policy</h2>
            <p className="text-lg text-serona-dark/80">
              Serona AI offers refunds for yearly premium plans only, within 3–6 days of purchase. Monthly subscriptions are non-refundable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">Cancellation Terms</h2>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Users can cancel their subscription at any time</li>
              <li>Access continues until the end of the billing period</li>
              <li>No refunds for partial usage periods</li>
              <li>Cancellation takes effect at the end of the current billing cycle</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">How to Request a Refund</h2>
            <p className="text-lg text-serona-dark/80">
              To request a refund:
            </p>
            <ol className="list-decimal pl-6 mb-6 text-serona-dark/80">
              <li>Contact support within the eligible period (3-6 days of purchase)</li>
              <li>Provide your account details and reason for refund</li>
              <li>Allow 5-7 business days for processing</li>
            </ol>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Refund;
