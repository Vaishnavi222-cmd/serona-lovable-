
import { Brain, Briefcase, Heart, Bot } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Features = () => {
  return (
    <section id="features" className="py-24 relative bg-serona-light px-4 md:px-6">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-serona-primary/10 rounded-full text-serona-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-serona-dark mb-4">
            What Serona AI Offers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <FeatureCard
            icon={<Brain className="w-6 h-6" />}
            title="Understand Your Personality"
            description="AI-generated behavior analysis for deeper self-awareness"
            image="/photo-1488590528505-98d2b5aba04b"
          />
          <FeatureCard
            icon={<Briefcase className="w-6 h-6" />}
            title="Get Career & Life Guidance"
            description="Smart career & decision-making advice tailored to you"
            image="/photo-1649972904349-6e44c42644a7"
          />
          <FeatureCard
            icon={<Heart className="w-6 h-6" />}
            title="Improve Relationships"
            description="Enhance emotional intelligence & communication skills"
            image="/photo-1518770660439-4636190af475"
          />
          <FeatureCard
            icon={<Bot className="w-6 h-6" />}
            title="AI-Powered Deep Analysis"
            description="Context-aware conversations for personal growth"
            image="/photo-1461749280684-dccba630e2f6"
          />
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-serona-dark mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What does Serona AI offer?</AccordionTrigger>
              <AccordionContent>
                Serona AI provides in-depth personality analysis, career recommendations, life choice guidance, and relationship insights based on advanced AI-driven behavioral understanding.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is Serona AI free to use?</AccordionTrigger>
              <AccordionContent>
                Yes! You get free daily interactions. For unlimited access, you can upgrade to a premium plan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What makes Serona AI different?</AccordionTrigger>
              <AccordionContent>
                Unlike basic chatbots, Serona AI specializes in deep behavioral analysis, helping users understand their true nature, strengths, and best life paths.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>How does the subscription work?</AccordionTrigger>
              <AccordionContent>
                Unlike traditional AI tools, Serona AI offers flexible subscription options – choose from hourly, daily, or monthly plans based on your needs.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <a
            href="#get-started"
            className="inline-block px-8 py-4 bg-serona-primary text-serona-dark rounded-full
                      font-medium transition-all duration-300 hover:bg-serona-accent hover:scale-105"
          >
            Start Now!
          </a>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description, image }: { icon: React.ReactNode; title: string; description: string; image: string }) => (
  <div className="group p-6 rounded-2xl bg-serona-secondary/80 backdrop-blur-lg border border-serona-primary/20 transition-all duration-300 hover:scale-105">
    <div className="w-12 h-12 rounded-xl bg-serona-primary/10 flex items-center justify-center text-serona-primary mb-6 group-hover:bg-serona-primary group-hover:text-serona-secondary transition-all duration-300">
      {icon}
    </div>
    <img src={image} alt={title} className="w-full h-40 object-cover rounded-lg mb-6" />
    <h3 className="text-xl font-semibold text-serona-dark mb-3">{title}</h3>
    <p className="text-serona-dark/70">{description}</p>
  </div>
);

export default Features;
