import { Zap, Shield, Cpu, Globe } from 'lucide-react';

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-sirona-purple/10 rounded-full text-sirona-purple text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="text-4xl font-bold text-sirona-dark mb-4">
            Why Choose Sirona AI
          </h2>
          <p className="text-sirona-dark/70 max-w-2xl mx-auto">
            Discover the powerful features that make our AI solution stand out from the rest
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Lightning Fast"
            description="Experience blazing fast processing speeds with our optimized AI algorithms"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Secure & Private"
            description="Your data is protected with enterprise-grade security measures"
          />
          <FeatureCard
            icon={<Cpu className="w-6 h-6" />}
            title="Advanced AI"
            description="Leverage cutting-edge artificial intelligence technology"
          />
          <FeatureCard
            icon={<Globe className="w-6 h-6" />}
            title="Global Scale"
            description="Deploy our solutions anywhere in the world with ease"
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="group p-8 rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 transition-all duration-300 hover:scale-105">
    <div className="w-12 h-12 rounded-xl bg-sirona-purple/10 flex items-center justify-center text-sirona-purple mb-6 group-hover:bg-sirona-purple group-hover:text-white transition-all duration-300">
      {icon}
    </div>
    <h3 className="text-xl font-semibold text-sirona-dark mb-3">{title}</h3>
    <p className="text-sirona-dark/70">{description}</p>
  </div>
);

export default Features;