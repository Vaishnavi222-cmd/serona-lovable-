const products = [
  {
    id: 1,
    name: "AI Development Kit",
    description: "Complete toolkit for AI development",
    price: "$299",
    image: "/placeholder.svg"
  },
  {
    id: 2,
    name: "Neural Network Package",
    description: "Advanced neural network solutions",
    price: "$199",
    image: "/placeholder.svg"
  },
  {
    id: 3,
    name: "Machine Learning Bundle",
    description: "Comprehensive ML resources",
    price: "$249",
    image: "/placeholder.svg"
  }
];

const Recommendations = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-serona-dark mb-8">Our Recommendations</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-serona-dark mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-serona-primary">{product.price}</span>
                  <a
                    href="#"
                    className="px-4 py-2 bg-serona-primary text-white rounded-lg hover:bg-serona-accent transition-colors"
                  >
                    Buy Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Recommendations;