import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

const recommendations = [
  {
    id: 1,
    name: "Understanding Your Personality Type",
    description: "A comprehensive guide to personality analysis and self-discovery, helping you understand your core traits and behavioral patterns.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e",
    alt: "AI chat online for self improvement and life choices"
  },
  {
    id: 2,
    name: "Career Development Masterclass",
    description: "Learn how to align your personality traits with career choices and develop a successful professional path.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d",
    alt: "Speak to an AI for personal growth and career guidance"
  },
  {
    id: 3,
    name: "Emotional Intelligence in Relationships",
    description: "Enhance your relationship skills through understanding emotional patterns and improving communication.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475",
    alt: "AI chatbot online for relationship guidance and self development"
  },
  {
    id: 4,
    name: "The Art of Self-Improvement",
    description: "A comprehensive guide to personal growth, habit formation, and achieving your life goals.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6",
    alt: "Talk with AI to understand yourself and make life choices"
  }
];

const Recommendations = () => {
  useEffect(() => {
    // Update meta tags for Recommendations page
    document.title = "Serona AI - AI Chat bot for carrier guidance & decision making";
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Talk with AI for self-development and life choices. Serona AI offers AI conversation bot insights on career, relationships, and personality analysis.');
    
    // Add indexing meta tag
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'index, follow');
  }, []);

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
        {/* Ebook Section */}
        <div className="mb-16 bg-gradient-to-r from-serona-light to-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8 text-center">
            Download Our Comprehensive Guide
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/3">
              <img
                src="/lovable-uploads/5d7f5f88-15b9-40b3-a0d9-e00f63709081.png"
                alt="The Art of Smart Decisions Book Cover"
                className="rounded-lg shadow-md w-full h-[300px] object-cover"
                loading="lazy"
              />
            </div>
            <div className="w-full md:w-2/3 space-y-4">
              <h3 className="text-2xl font-semibold text-serona-dark">
                The Art of Smart Decisions: A Practical Guide to Confident Choices
              </h3>
              <p className="text-gray-600 text-lg">
                This eBook offers clear, practical strategies to improve decision-making in all aspects of life. With insightful content and actionable advice, it helps you make confident, well-informed choices.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-serona-dark">₹100</span>
                <Button
                  className="bg-serona-primary hover:bg-serona-accent text-serona-dark"
                  onClick={() => {
                    // Payment logic will be implemented later
                    console.log("Buy now clicked");
                  }}
                >
                  <BookOpen className="mr-2" />
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Recommendations Section */}
        <h2 className="text-4xl font-bold text-serona-dark mb-12 text-center">
          Recommended Resources
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recommendations.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform cursor-pointer"
              onClick={() => navigate('/recommendations/details')}
            >
              <img
                src={item.image}
                alt={item.alt}
                className="w-full h-48 object-cover"
                loading="lazy"
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
