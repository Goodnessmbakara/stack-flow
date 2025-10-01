import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';

const WhitepaperPage = () => {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Fetching whitepaper...');
    fetch('/WHITEPAPER.md')
      .then((response) => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        console.log('Whitepaper loaded, length:', text.length);
        console.log('First 100 chars:', text.substring(0, 100));
        setMarkdown(text);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading whitepaper:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d120c] flex items-center justify-center">
        <div className="text-white text-xl">Loading whitepaper...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0d120c] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error loading whitepaper</div>
          <div className="text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!markdown) {
    return (
      <div className="min-h-screen bg-[#0d120c] flex items-center justify-center">
        <div className="text-white text-xl">No whitepaper content found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d120c] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0d120c] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6 gradient-text">
            StackFlow Whitepaper
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
            Ride the flow of capital and sentiment on Stacks
          </p>
        </div>
      </div>

      {/* Whitepaper Content */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-12">
        <div className="whitepaper-content prose prose-invert prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeRaw,
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: 'wrap' }],
            ]}
            components={{
              h1: (props) => (
                <h1
                  className="text-4xl md:text-5xl font-black mb-8 mt-16 gradient-text text-center relative"
                  {...props}
                />
              ),
              h2: (props) => (
                <div className="mt-20 mb-10">
                  <h2
                    className="text-3xl md:text-4xl font-bold mb-2 text-[#bbf737] inline-block"
                    {...props}
                  />
                  <div className="h-1 w-24 bg-gradient-to-r from-[#bbf737] to-transparent mt-2"></div>
                </div>
              ),
              h3: (props) => (
                <div className="bg-gradient-to-r from-[#bbf737]/5 to-transparent p-6 rounded-lg mb-6 mt-10 border-l-4 border-[#bbf737]">
                  <h3
                    className="text-2xl md:text-3xl font-bold text-[#d4ff5a]"
                    {...props}
                  />
                </div>
              ),
              h4: (props) => (
                <div className="bg-gray-800/50 p-4 rounded-md mb-6 mt-8 border border-gray-700/50">
                  <h4
                    className="text-xl md:text-2xl font-semibold text-gray-100"
                    {...props}
                  />
                </div>
              ),
              p: (props) => (
                <p className="mb-6 text-base md:text-lg text-gray-300 leading-relaxed" {...props} />
              ),
              ul: (props) => (
                <ul className="space-y-3 mb-8" {...props} />
              ),
              ol: (props) => (
                <ol className="space-y-3 mb-8 list-decimal list-inside" {...props} />
              ),
              li: (props) => (
                <li className="text-base md:text-lg leading-relaxed text-gray-300 flex items-start gap-3 bg-gray-800/30 p-4 rounded-lg border border-gray-700/30 hover:border-[#bbf737]/30 transition-colors" {...props} />
              ),
              strong: (props) => (
                <strong className="font-bold text-[#bbf737]" {...props} />
              ),
              em: (props) => (
                <em className="italic text-[#d4ff5a]" {...props} />
              ),
              a: (props) => (
                <a
                  className="text-[#bbf737] hover:text-[#d4ff5a] underline decoration-[#bbf737]/50 hover:decoration-[#d4ff5a] transition-all font-medium"
                  target={props.href?.startsWith('http') ? '_blank' : undefined}
                  rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                  {...props}
                />
              ),
              blockquote: (props) => (
                <blockquote
                  className="border-l-4 border-[#bbf737] bg-[#bbf737]/5 pl-6 pr-6 py-4 italic text-gray-300 my-8 rounded-r-lg"
                  {...props}
                />
              ),
              code: ({ className, children, ...props }: any) => {
                // Inline code vs code block
                const isInline = !className;
                return isInline ? (
                  <code
                    className="bg-[#bbf737]/10 border border-[#bbf737]/20 px-2 py-1 rounded text-sm text-[#bbf737] font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              pre: (props) => (
                <pre
                  className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl overflow-x-auto mb-8 border border-[#bbf737]/20 shadow-lg shadow-[#bbf737]/5"
                  {...props}
                />
              ),
              hr: (props) => (
                <div className="my-16 relative">
                  <hr className="border-gray-700/50" {...props} />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#bbf737] rounded-full"></div>
                </div>
              ),
              table: (props) => (
                <div className="overflow-x-auto mb-8 rounded-xl border border-gray-700/50 shadow-lg">
                  <table className="min-w-full" {...props} />
                </div>
              ),
              thead: (props) => (
                <thead className="bg-gradient-to-r from-[#bbf737]/10 to-[#bbf737]/5 backdrop-blur-sm" {...props} />
              ),
              th: (props) => (
                <th className="border-b border-gray-700/50 px-6 py-4 text-left text-[#bbf737] font-bold text-sm uppercase tracking-wider" {...props} />
              ),
              td: (props) => (
                <td className="border-b border-gray-700/30 px-6 py-4 text-gray-300 hover:bg-gray-800/20 transition-colors" {...props} />
              ),
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>

        {/* Footer CTA */}
        <div className="mt-20 p-10 md:p-12 bg-gradient-to-r from-[#bbf737]/10 to-[#d4ff5a]/10 rounded-2xl border border-[#bbf737]/20 text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Start Trading?
          </h3>
          <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join the StackFlow community and start riding the flow of capital and sentiment on Stacks.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/app/trade/new"
              className="px-8 py-4 bg-[#bbf737] text-black font-bold rounded-lg hover:bg-[#d4ff5a] transition-all transform hover:scale-105 text-lg"
            >
              Launch StackFlow
            </a>
            <a
              href="https://t.me/stackflow_io"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-all transform hover:scale-105 text-lg border border-gray-700"
            >
              Join Community
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhitepaperPage;

