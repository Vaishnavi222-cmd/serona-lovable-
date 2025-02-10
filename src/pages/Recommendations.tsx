
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const recommendations = [
  {
    id: 1,
    name: "Understanding Your Personality Type",
    description: "A comprehensive guide to personality analysis and self-discovery, helping you understand your core traits and behavioral patterns.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e"
  },
  {
    id: 2,
    name: "Career Development Masterclass",
    description: "Learn how to align your personality traits with career choices and develop a successful professional path.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
  },
  {
    id: 3,
    name: "Emotional Intelligence in Relationships",
    description: "Enhance your relationship skills through understanding emotional patterns and improving communication.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475"
  },
  {
    id: 4,
    name: "The Art of Self-Improvement",
    description: "A comprehensive guide to personal growth, habit formation, and achieving your life goals.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6"
  }
];

const Recommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDetailsPage = location.pathname.includes('/details');

  if (isDetailsPage) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-24 flex flex-col items-center justify-center">
          <h2 className="text-3xl font-bold text-serona-dark mb-8 text-center">Coming Soon!</h2>
          <p className="text-xl text-gray-700 mb-12 text-center">
            We are currently working on our eBooks and guides. Stay tuned!
          </p>
          <button
            onClick={() => navigate('/recommendations')}
            className="px-6 py-3 bg-serona-primary text-serona-dark rounded-full font-medium hover:bg-serona-accent transition-colors"
          >
            ← Go Back
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold text-serona-dark mb-12 text-center">Recommended Resources</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recommendations.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate('/recommendations/details')}
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-serona-dark mb-2">{item.name}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Recommendations;
