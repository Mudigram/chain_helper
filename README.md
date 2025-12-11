# 🚀 ChainHelper AI

An AI-powered Solana transaction assistant that combines natural language processing with blockchain technology. Users can check balances, simulate transactions, and execute real Solana transfers using simple English commands.

![ChainHelper AI](https://img.shields.io/badge/Solana-Blockchain-blueviolet) ![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green) ![Next.js](https://img.shields.io/badge/Next.js-Frontend-black) ![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-blue)

## ✨ Features

- **🔐 Phantom Wallet Integration**: Seamless connection with Phantom wallet for Solana transactions
- **💰 Balance Checker**: Real-time SOL balance queries for any Solana address
- **🤖 AI Assistant**: Ask questions about Solana transactions and get intelligent responses
- **⚡ Transaction Simulation**: Create and preview unsigned transactions before sending
- **🚀 AI Transaction Agent**: Execute transactions using natural language commands
  - Example: "Send 0.01 SOL to Hxro8U5W3..."
  - AI parses intent → Creates transaction → Phantom signs → Broadcasts to network

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React framework with server-side rendering
- **TypeScript** - Type-safe development
- **TailwindCSS 4** - Modern styling with gradients and animations
- **@solana/web3.js** - Solana JavaScript SDK
- **Phantom Wallet** - Browser wallet integration

### Backend
- **FastAPI** - Modern Python web framework
- **OpenAI GPT-4o-mini** - Natural language processing
- **Solana Python SDK** - Blockchain interaction
- **Uvicorn** - ASGI server

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Phantom Wallet** browser extension
- **OpenAI API Key**

## 🚀 Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone <your-repo-url>
cd chain_helper
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\\Scripts\\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env

# Run the server
uvicorn app:app --reload --port 8001
\`\`\`

The backend will be running at `http://localhost:8001`

### 3. Frontend Setup

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

The frontend will be running at `http://localhost:3000`

### 4. Install Phantom Wallet

1. Visit [https://phantom.app/download](https://phantom.app/download)
2. Install the browser extension
3. Create or import a Solana wallet
4. Ensure you have some SOL for testing (use devnet or small amounts on mainnet)

## 📖 API Documentation

### Endpoints

#### **GET** `/`
Health check endpoint
```json
{
  "status": "healthy",
  "service": "ChainHelper AI - Solana Assistant",
  "version": "1.0.0"
}
```

#### **GET** `/balance/{address}`
Get SOL balance for an address
```json
{
  "address": "Hxro8U5W3...",
  "lamports": 1000000000,
  "sol": 1.0
}
```

#### **POST** `/ai`
Ask AI questions about Solana
```json
{
  "prompt": "What is a lamport?"
}
```

#### **GET** `/simulate_tx`
Create an unsigned transaction
```
?from_pubkey=...&to_pubkey=...&amount_sol=0.01
```

#### **POST** `/broadcast_tx`
Broadcast a signed transaction
```json
{
  "signed_transaction": "hex_string"
}
```

#### **POST** `/parse_transaction_intent`
Parse natural language into transaction intent
```json
{
  "user_message": "Send 0.01 SOL to Hxro8U...",
  "wallet_address": "your_wallet_address"
}
```

## 🌐 Deployment

### Frontend Deployment (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set root directory to `frontend`
   - Click "Deploy"

3. **Update API URL**
   - After backend deployment, update `API_BASE` in `frontend/app/page.tsx`

### Backend Deployment (Railway)

1. **Create account** at [railway.app](https://railway.app)

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect the Python app

3. **Configure Settings**
   - Set root directory: `backend`
   - Add start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`

4. **Set Environment Variables**
   ```
   OPENAI_API_KEY=your_openai_api_key
   PORT=8000
   ```

5. **Generate Domain**
   - Railway will provide a public URL
   - Update frontend's `API_BASE` with this URL

### Alternative: Backend on Render

1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variable: `OPENAI_API_KEY`

## 🎯 Usage Examples

### Checking Balance
1. Click "Connect Phantom Wallet"
2. Approve connection in Phantom popup
3. Click "Check Balance" to see your SOL balance

### AI Assistant
1. Type a question: "What is the current SOL price?"
2. Click "Ask AI" or press Enter
3. Get an intelligent response

### AI Transaction Agent
1. Connect your wallet
2. Type: "Send 0.01 SOL to [recipient address]"
3. Click "Execute Transaction"
4. Approve in Phantom wallet
5. View transaction on Solana Explorer

## 🔒 Security Notes

- **Never commit `.env` files** - API keys should stay private
- **Use devnet for testing** - Change RPC endpoint to devnet for safe testing
- **Small amounts only** - Test with minimal SOL amounts first
- **Verify addresses** - Always double-check recipient addresses

## 🐛 Troubleshooting

**Phantom Not Detected**
- Ensure Phantom extension is installed
- Refresh the page
- Check browser console for errors

**Transaction Fails**
- Verify sufficient SOL balance for transaction + fees
- Check network status at [status.solana.com](https://status.solana.com)
- Ensure correct network (mainnet vs devnet)

**API Errors**
- Verify OpenAI API key is valid
- Check backend is running on correct port
- Ensure CORS is properly configured

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🙏 Acknowledgments

- Solana Foundation for excellent documentation
- Phantom team for the wallet SDK
- OpenAI for GPT-4o-mini API
- FastAPI and Next.js communities

---

**Built with ❤️ for the Solana ecosystem**
