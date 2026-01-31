import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/twitter': {
        target: 'https://api.twitter.com/2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/twitter/, ''),
        headers: {
          'Authorization': `Bearer ${process.env.VITE_TWITTER_BEARER_TOKEN}`
        }
      }
      ,
      // Proxy to RapidAPI Twttr provider so we don't expose the RapidAPI key to the browser
      // and to avoid CORS issues when calling RapidAPI from the client.
      '/api/rapid/twitter': {
        target: `https://${process.env.VITE_RAPIDAPI_HOST || 'twitter241.p.rapidapi.com'}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/rapid\/twitter/, ''),
        headers: {
          'x-rapidapi-key': process.env.VITE_RAPIDAPI_KEY || '',
          'x-rapidapi-host': process.env.VITE_RAPIDAPI_HOST || 'twitter241.p.rapidapi.com'
        }
      }
      ,
      // Gemini generative API proxy (dev-only). Produces synthetic tweets for fallback.
      '/api/gemini/generate': {
        // During development we proxy to a small local server that injects the
        // GEMINI_API_KEY and forwards the request to Google's Generative Language API.
        target: `http://localhost:${process.env.GEMINI_PROXY_PORT || 5178}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini\/generate/, '/generate'),
        // No upstream headers here — the local proxy will attach the API key.
      },
      '/api/prices': {
        target: `http://localhost:${process.env.PRICE_PROXY_PORT || 5177}`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/prices/, '/api/prices'),
      },
      '/api/stacks': {
        target: 'https://api.mainnet.hiro.so',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/stacks/, ''),
      }
    }
  }
})
