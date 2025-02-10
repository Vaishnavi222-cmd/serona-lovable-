
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="container mx-auto px-4 py-20 md:py-24">
        <h1 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8">Privacy Policy</h1>
        <div className="prose max-w-3xl">
          <p className="text-lg text-serona-dark/80 mb-6">
            At Serona AI, we prioritize user privacy and transparency. This Privacy Policy outlines how we collect, store, protect, and use your data when you interact with our platform.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">1. Data Collection</h2>
            <p className="text-lg text-serona-dark/80 mb-4">
              When using Serona AI, certain data may be collected to enhance your experience and improve AI-generated insights. The data we collect includes:
            </p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>User Conversations: Stored to improve AI responses and provide personalized guidance.</li>
              <li>Basic User Information: When signing up, we may collect your name, email address, and account details.</li>
              <li>Usage Data: Information related to platform interactions, such as session duration, message count, and user feedback.</li>
              <li>Technical Data: Device information, IP address, and browser type for security and optimization purposes.</li>
            </ul>
            <p className="text-lg text-serona-dark/80 mb-4">We Do Not Collect:</p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Financial information</li>
              <li>Personal medical history</li>
              <li>Government-issued identification data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">2. Data Usage</h2>
            <p className="text-lg text-serona-dark/80 mb-4">
              We ensure that your data is never sold, shared, or misused. Your interactions with Serona AI are used solely for:
            </p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Enhancing AI accuracy and improving recommendations</li>
              <li>Personalizing your user experience based on past interactions</li>
              <li>Identifying and preventing fraudulent or abusive activities</li>
              <li>Conducting research and analytics to refine our AI capabilities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-serona-dark mb-4">3. Data Protection</h2>
            <p className="text-lg text-serona-dark/80 mb-4">
              We follow industry-leading security practices to ensure your data remains safe:
            </p>
            <ul className="list-disc pl-6 mb-6 text-serona-dark/80">
              <li>Encryption: All stored and transmitted data is encrypted using secure protocols.</li>
              <li>Access Control: Only authorized personnel can access system data.</li>
              <li>Regular Security Audits: Our security measures are tested and updated regularly.</li>
              <li>Legal Compliance: Serona AI adheres to GDPR, CCPA, and other global data protection laws.</li>
            </ul>
          </section>

          <p className="text-lg text-serona-dark/80">
            If you have any questions about our privacy practices, you can contact us via the Contact Us page or email us at support@seronaai.tech.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
