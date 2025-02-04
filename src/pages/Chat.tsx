import { useState } from 'react';
import { Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [chats] = useState([
    { id: 1, title: "Previous Chat 1" },
    { id: 2, title: "Previous Chat 2" },
  ]);

  return (
    <div className="min-h-screen bg-serona-light flex flex-col">
      <Navbar />
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
          <div className="p-4">
            <button className="w-full py-2 px-4 bg-serona-primary text-white rounded-lg hover:bg-serona-accent transition-colors">
              New Chat
            </button>
            <div className="mt-4 space-y-2">
              {chats.map((chat) => (
                <div key={chat.id} className="p-2 hover:bg-serona-light rounded cursor-pointer">
                  {chat.title}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Chat messages would go here */}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <div className="max-w-4xl mx-auto flex gap-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-serona-primary"
              />
              <button className="p-3 bg-serona-primary text-white rounded-lg hover:bg-serona-accent transition-colors">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Chat;