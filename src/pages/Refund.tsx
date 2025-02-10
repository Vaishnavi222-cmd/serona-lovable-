
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
            <p className="text-lg text-serona-dark/80 mb-4">
              Serona AI offers refunds only for yearly premium plans, and refund requests must be made within 20 days of purchase.
            </p>
            <p className="text-lg text-serona-dark/80 mb-4">No refunds are available for:</p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Hourly, daily, or monthly plans.</li>
              <li>Partially used subscriptions.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">Cancellation Policy</h2>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>You may cancel your subscription anytime via account settings.</li>
              <li>Once canceled, your subscription remains active until the end of the billing cycle. No refunds are provided for early cancellations or unused days.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">How to Request a Refund?</h2>
            <ol className="list-decimal pl-6 mb-6 text-serona-dark/80">
              <li>Email support@seronaai.tech within 20 days of purchase.</li>
              <li>Provide account details and a brief reason for the refund request.</li>
              <li>Allow 5-7 business days for processing.</li>
            </ol>
            <p className="text-lg text-serona-dark/80">
              For additional support, visit our Contact Us page or reach out via email.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Refund;
