import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { X } from "lucide-react";

const featureContent = [
  {
    title: "Understand Your Personality",
    description: `Your personality shapes your decisions, interactions, and future. Serona AI provides detailed behavioral analysis, helping you:
    ✔ Identify your strengths & weaknesses
    ✔ Understand thought patterns & emotional responses
    ✔ Discover areas for personal growth
    
    🔍 Gain deeper self-awareness with AI-driven insights!`,
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158"
  },
  {
    title: "Get Career & Life Guidance",
    description: `Not sure about your next move? Serona AI analyzes your skills, interests, and personality to offer smart career recommendations & decision-making advice.
    ✔ Get clarity on your ideal career path
    ✔ Find solutions to major life choices
    ✔ Make informed decisions with AI-backed guidance
    
    🚀 Shape your future with intelligent career insights!`,
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d"
  },
  {
    title: "Improve Relationships",
    description: `Struggling with communication? Serona AI helps you understand emotions, navigate conflicts, and strengthen your connections.
    ✔ Learn to express yourself better
    ✔ Improve emotional intelligence & empathy
    ✔ Build healthier personal & professional relationships
    
    💬 Enhance your connections through AI-powered relationship insights!`,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475"
  },
  {
    title: "AI-Powered Deep Analysis",
    description: `Unlike basic chatbots, Serona AI remembers context, adapts to your conversations, and provides meaningful insights.
    ✔ Personalized responses based on previous chats
    ✔ Adaptive learning for better self-improvement guidance
    ✔ Real-time feedback for a continuous growth journey
    
    🌟 Experience the power of AI-driven self-discovery!`,
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6"
  }
];

const faqItems = [
  {
    question: "How is Serona AI different from other AI chatbots?",
    answer: "Serona AI analyzes your behavior and thinking patterns based on the responses and answers you provide. It then helps you make better life choices, such as career decisions, relationships, and major life choices."
  },
  {
    question: "Is it free to use?",
    answer: "Yes! You can use Serona AI for free with daily interaction limits. We also offer hourly or per-day plans for extended access."
  },
  {
    question: "Does Serona AI have automatic subscriptions?",
    answer: "No. Serona AI does not auto-renew subscriptions, even for monthly plans. You must manually subscribe each time you wish to continue using premium features."
  },
  {
    question: "What kind of insights does Serona AI provide?",
    answer: "Serona AI offers deep personality analysis, career guidance, relationship insights, and self-improvement suggestions based on your interactions."
  },
  {
    question: "How can I contact support?",
    answer: "For any assistance, visit our Contact Us page or email us at support@seronaai.tech."
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative bg-serona-light px-4 md:px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-serona-dark mb-4">
            What Serona AI Offers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {featureContent.map((feature, index) => (
            <FeatureCard
              key={index}
              title={feature.title}
              description={feature.description}
              image={feature.image}
            />
          ))}
        </div>

        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index + 1}`}>
                <AccordionTrigger>
                  <span className="text-left flex items-center gap-2">
                    <span className="text-serona-primary">📌</span> {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex gap-2">
                    <span className="text-serona-primary">➡️</span>
                    <span>{item.answer}</span>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center">
          <Link
            to="/chat"
            className="inline-block px-6 md:px-32 py-3 md:py-4 bg-serona-primary text-serona-dark rounded-full
                      font-medium transition-all duration-300 hover:bg-serona-accent hover:scale-105 
                      w-full md:w-auto text-base md:text-lg min-w-0 md:min-w-[400px] mx-auto"
          >
            ➡️ Start Your Journey Today!
          </Link>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ title, description, image }: { title: string; description: string; image: string }) => (
  <div className="group p-6 rounded-2xl bg-serona-secondary/80 backdrop-blur-lg border border-serona-primary/20 transition-all duration-300 hover:scale-105">
    <img src={image} alt={title} className="w-full h-48 object-cover rounded-lg mb-6" loading="lazy" />
    <h3 className="text-xl font-semibold text-serona-dark mb-3">{title}</h3>
    <p className="text-serona-dark/70 whitespace-pre-line">{description}</p>
  </div>
);

export default Features;
