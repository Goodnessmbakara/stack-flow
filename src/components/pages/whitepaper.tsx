import { useEffect, useState } from 'react';
import { Remark } from 'react-remark';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

const WhitepaperPage = () => {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/WHITEPAPER.md')
      .then((response) => response.text())
      .then((text) => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading whitepaper:', error);
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

  return (
    <div className="min-h-screen bg-[#0d120c] text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0d120c] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-black mb-4 gradient-text">
            StackFlow Whitepaper
          </h1>
          <p className="text-xl text-gray-300">
            Ride the flow of capital and sentiment on Stacks
          </p>
        </div>
      </div>

      {/* Whitepaper Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="whitepaper-content prose prose-invert prose-lg max-w-none">
          <Remark
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              rehypeSlug,
              [rehypeAutolinkHeadings, { behavior: 'wrap' }],
            ]}
            rehypeReactOptions={{
              components: {
                h1: (props) => (
                  <h1
                    className="text-4xl font-black mb-6 mt-12 gradient-text"
                    {...props}
                  />
                ),
                h2: (props) => (
                  <h2
                    className="text-3xl font-bold mb-4 mt-10 text-[#bbf737]"
                    {...props}
                  />
                ),
                h3: (props) => (
                  <h3
                    className="text-2xl font-bold mb-3 mt-8 text-[#d4ff5a]"
                    {...props}
                  />
                ),
                h4: (props) => (
                  <h4
                    className="text-xl font-semibold mb-2 mt-6 text-gray-200"
                    {...props}
                  />
                ),
                p: (props) => (
                  <p className="mb-4 text-gray-300 leading-relaxed" {...props} />
                ),
                ul: (props) => (
                  <ul className="list-disc list-inside mb-4 space-y-2 text-gray-300" {...props} />
                ),
                ol: (props) => (
                  <ol className="list-decimal list-inside mb-4 space-y-2 text-gray-300" {...props} />
                ),
                li: (props) => (
                  <li className="ml-4" {...props} />
                ),
                strong: (props) => (
                  <strong className="font-bold text-white" {...props} />
                ),
                em: (props) => (
                  <em className="italic text-gray-200" {...props} />
                ),
                a: (props) => (
                  <a
                    className="text-[#bbf737] hover:text-[#d4ff5a] underline transition-colors"
                    {...props}
                  />
                ),
                blockquote: (props) => (
                  <blockquote
                    className="border-l-4 border-[#bbf737] pl-4 italic text-gray-400 my-4"
                    {...props}
                  />
                ),
                code: (props) => (
                  <code
                    className="bg-gray-800 px-2 py-1 rounded text-sm text-[#bbf737] font-mono"
                    {...props}
                  />
                ),
                pre: (props) => (
                  <pre
                    className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4 border border-gray-800"
                    {...props}
                  />
                ),
                hr: (props) => (
                  <hr className="border-gray-700 my-8" {...props} />
                ),
                table: (props) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full border border-gray-700" {...props} />
                  </div>
                ),
                thead: (props) => (
                  <thead className="bg-gray-800" {...props} />
                ),
                th: (props) => (
                  <th className="border border-gray-700 px-4 py-2 text-left text-[#bbf737]" {...props} />
                ),
                td: (props) => (
                  <td className="border border-gray-700 px-4 py-2 text-gray-300" {...props} />
                ),
              },
            }}
          >
            {markdown}
          </Remark>
        </div>

        {/* Footer CTA */}
        <div className="mt-16 p-8 bg-gradient-to-r from-[#bbf737]/10 to-[#d4ff5a]/10 rounded-lg border border-[#bbf737]/20">
          <h3 className="text-2xl font-bold mb-4 text-white">
            Ready to Start Trading?
          </h3>
          <p className="text-gray-300 mb-6">
            Join the StackFlow community and start riding the flow of capital and sentiment on Stacks.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="/app/trade/new"
              className="px-6 py-3 bg-[#bbf737] text-black font-bold rounded hover:bg-[#d4ff5a] transition-colors"
            >
              Launch StackFlow
            </a>
            <a
              href="https://t.me/stackflow_io"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gray-800 text-white font-bold rounded hover:bg-gray-700 transition-colors"
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

