import { Cpu, Bot, Circuit, Globe } from 'lucide-react';

const Features = () => {
  return (
    <section id="features" className="py-24 relative bg-serona-light">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-serona-primary/10 rounded-full text-serona-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-4xl font-bold text-serona-dark mb-4">
            AI-Powered Solutions
          </h2>
          <p className="text-serona-dark/70 max-w-2xl mx-auto">
            Discover how our advanced AI technology can transform your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Bot className="w-6 h-6" />}
            title="AI Automation"
            description="Streamline your workflows with intelligent automation"
          />
          <FeatureCard
            icon={<Cpu className="w-6 h-6" />}
            title="Machine Learning"
            description="Advanced algorithms that learn and adapt"
          />
          <FeatureCard
            icon={<Circuit className="w-6 h-6" />}
            title="Neural Networks"
            description="Deep learning solutions for complex problems"
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6" />}
            title="Global Scale"
            description="AI solutions that scale globally"
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="group p-8 rounded-2xl bg-serona-secondary/80 backdrop-blur-lg border border-serona-primary/20 transition-all duration-300 hover:scale-105">
    <div className="w-12 h-12 rounded-xl bg-serona-primary/10 flex items-center justify-center text-serona-primary mb-6 group-hover:bg-serona-primary group-hover:text-serona-secondary transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-serona-dark mb-3">{title}</h3>
    <p className="text-serona-dark/70">{description}</p>
  </div>
);

export default Features;