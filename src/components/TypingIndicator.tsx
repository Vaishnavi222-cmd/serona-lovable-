
import { CircleDashed } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="flex items-start my-4 max-w-[800px] mx-auto">
      <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center">
        <CircleDashed className="w-4 h-4 text-[#1EAEDB] animate-[spin_2s_linear_infinite]" />
      </div>
    </div>
  );
};

export default TypingIndicator;
