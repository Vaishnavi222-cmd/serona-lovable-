
import ReactMarkdown from 'react-markdown';

interface MessageContentProps {
  content: string;
}

const MessageContent = ({ content }: MessageContentProps) => {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown 
        components={{
          // Maintain existing styling while adding markdown
          p: ({children}) => <p className="text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap break-words m-0">{children}</p>,
          // Style headings appropriately
          h1: ({children}) => <h1 className="text-xl font-semibold mb-2 mt-0">{children}</h1>,
          h2: ({children}) => <h2 className="text-lg font-semibold mb-2 mt-0">{children}</h2>,
          h3: ({children}) => <h3 className="text-base font-semibold mb-2 mt-0">{children}</h3>,
          // Style lists
          ul: ({children}) => <ul className="list-disc pl-4 mb-2 mt-0">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-4 mb-2 mt-0">{children}</ol>,
          // Style code blocks
          code: ({children}) => <code className="bg-gray-100 rounded px-1 py-0.5">{children}</code>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;
