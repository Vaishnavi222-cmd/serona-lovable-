
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: "Message sent!",
      description: "We'll get back to you soon.",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-serona-dark mb-3 text-center">Contact Us – We're Here to Help!</h1>
          <p className="text-base md:text-lg text-serona-dark/80 mb-6 text-center">
            Have a question or need assistance? Reach out to us, and we'll get back to you as soon as possible.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-serona-dark mb-1">Name</label>
              <input
                type="text"
                id="name"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-serona-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-serona-dark mb-1">Email</label>
              <input
                type="email"
                id="email"
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-serona-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-serona-dark mb-1">Message</label>
              <textarea
                id="message"
                rows={4}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-serona-primary"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-serona-primary text-white rounded-lg hover:bg-serona-accent transition-colors"
            >
              Send Message
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center space-y-2">
              <p className="text-serona-dark/80 text-sm">
                📩 Email us at: <a href="mailto:support@seronaai.tech" className="text-serona-primary">support@seronaai.tech</a>
              </p>
              <p className="text-serona-dark/80 text-sm">
                ⏳ We aim to respond within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
