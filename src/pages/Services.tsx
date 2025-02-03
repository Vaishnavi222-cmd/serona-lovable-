const Services = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-sirona-dark mb-12 text-center">Our Services</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div id="ai-solutions" className="p-6 rounded-lg glass-card">
            <h2 className="text-2xl font-semibold text-sirona-dark mb-4">AI Solutions</h2>
            <p className="text-sirona-dark/70">
              Custom AI solutions designed to meet your specific business needs,
              from machine learning models to natural language processing systems.
            </p>
          </div>
          
          <div id="consulting" className="p-6 rounded-lg glass-card">
            <h2 className="text-2xl font-semibold text-sirona-dark mb-4">Consulting</h2>
            <p className="text-sirona-dark/70">
              Expert guidance on AI strategy, implementation, and optimization
              to help you make informed decisions about AI adoption.
            </p>
          </div>
          
          <div id="integration" className="p-6 rounded-lg glass-card">
            <h2 className="text-2xl font-semibold text-sirona-dark mb-4">Integration</h2>
            <p className="text-sirona-dark/70">
              Seamless integration of AI solutions with your existing systems
              and workflows to maximize efficiency and ROI.
            </p>
          </div>
          
          <div id="support" className="p-6 rounded-lg glass-card">
            <h2 className="text-2xl font-semibold text-sirona-dark mb-4">Support</h2>
            <p className="text-sirona-dark/70">
              Comprehensive support and maintenance services to ensure your
              AI solutions continue to perform at their best.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;