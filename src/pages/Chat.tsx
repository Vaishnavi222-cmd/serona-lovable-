import { useEffect } from 'react';

const Chat = () => {
  useEffect(() => {
    document.title = "Serona AI - AI Chatbot online for Self Development & Guidance";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Speak to an AI and explore self-improvement. Serona AI provides AI chatbot online for decision-making, personal growth, and relationship guidance.");
    }
  }, []);

};

export default Chat;
