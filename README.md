# Canopy — Branching Chat Explorer

Canopy is a locally-focused AI chat interface designed to turn conversations into dynamic, branching mind maps. 

Rather than sticking to linear chat threads, Canopy visualizes your chat history as an interactive tree structure, allowing you to branch off discussions at any message to explore different topics, ideas, or alternatives.

## Key Features

- **Branching Conversation Graphs**: Visualize your chat history as an interactive node graph. Revisit any previous message, spin off new branches, and map out your thoughts like a mind map.
- **Local-First Storage**: All chats, messages, and settings are saved locally on your machine to ensure complete privacy and data ownership.
- **Multi-Provider Support**: Switch seamlessly between leading LLM providers (Anthropic Claude, OpenAI, and Google Gemini) using your own API keys.
- **Local & Fast**: Built with Next.js and styled for a modern, responsive user experience.

## Getting Started

### Prerequisites

Create a `.env.local` file in the root directory if you want to configure default API keys:
```env
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```
*(Alternatively, you can configure these directly in the application's settings UI.)*

### Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
