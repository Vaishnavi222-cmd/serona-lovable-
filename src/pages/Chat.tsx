import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ChatInterface from '../components/ChatInterface';
import { useEffect } from 'react';

const Chat = () => {
  useEffect(() => {
    // Update meta tags for Chat page
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
        <ChatInterface />
      </main>
      <Footer />
    </div>
  );
};

export default Chat;
