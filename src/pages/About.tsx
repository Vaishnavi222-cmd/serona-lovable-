const About = () => {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-sirona-dark mb-6">About Sirona AI</h1>
          <div className="prose prose-lg text-sirona-dark/70">
            <p className="mb-6">
              Sirona AI is at the forefront of artificial intelligence innovation, 
              dedicated to creating intelligent solutions that transform businesses 
              and enhance human capabilities.
            </p>
            <p className="mb-6">
              Our team of experts combines cutting-edge technology with deep industry 
              knowledge to deliver AI solutions that drive real business value.
            </p>
            <p>
              With a commitment to ethical AI development and a focus on practical 
              applications, we're helping organizations across the globe harness 
              the power of artificial intelligence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;