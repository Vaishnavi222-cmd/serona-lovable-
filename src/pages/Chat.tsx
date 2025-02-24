
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Chat = () => {
  useEffect(() => {
    document.title = "Serona AI - AI Chatbot online for Self Development & Guidance";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Speak to an AI and explore self-improvement. Serona AI provides AI chatbot online for decision-making, personal growth, and relationship guidance.");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Chat with Serona AI</h1>
          {/* Chat interface will be implemented here */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <p className="text-center text-gray-500">Chat functionality coming soon...</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Chat;
