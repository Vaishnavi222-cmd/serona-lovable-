
import { useState } from 'react';

const ChatInterface = () => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle message submission logic here
    console.log('Message submitted:', message);
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto w-full bg-white rounded-lg shadow-lg p-6">
      <div className="h-[60vh] overflow-y-auto mb-4 p-4 border rounded-lg">
        {/* Messages will be displayed here */}
        <div className="text-center text-gray-500">
          Start a conversation with Serona AI
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-serona-primary"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-serona-primary text-serona-dark rounded-lg hover:bg-serona-accent transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatInterface;
