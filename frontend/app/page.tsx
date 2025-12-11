"use client";

import { useState } from "react";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState("");
  const [prompt, setPrompt] = useState("");
  const [balance, setBalance] = useState<any>(null);
  const [simulateData, setSimulateData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiCommand, setAiCommand] = useState("");
  const [txResult, setTxResult] = useState<any>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  // -----------------------------
  // CONNECT PHANTOM WALLET
  // -----------------------------
  // @ts-ignore
  const provider = typeof window !== "undefined" ? window.solana : null;

  const connectWallet = async () => {
    try {
      // Check if window is defined (client-side)
      if (typeof window === "undefined") {
        alert("Please wait for the page to load");
        return;
      }

      // @ts-ignore
      const provider = window?.solana;

      if (!provider) {
        const shouldInstall = confirm(
          "Phantom Wallet is not installed!\n\nWould you like to install it now?"
        );
        if (shouldInstall) {
          window.open("https://phantom.app/download", "_blank");
        }
        return;
      }

      if (!provider.isPhantom) {
        alert("Please install Phantom Wallet to continue");
        return;
      }

      const resp = await provider.connect(); // opens Phantom popup
      setWalletAddress(resp.publicKey.toString());
      console.log("Wallet connected:", resp.publicKey.toString());
    } catch (err) {
      console.error("Wallet connection error:", err);
      alert(`Failed to connect wallet: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };


  // -----------------------------
  // ASK AI ENDPOINT
  // -----------------------------
  const askAI = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI request failed");
      }
      setAiResponse(data.response);
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "AI request failed");
    } finally {
      setIsLoading(false);
    }
  };


  // -----------------------------
  // CHECK SOL BALANCE
  // -----------------------------
  const checkBalance = async () => {
    if (!walletAddress) {
      setError("Connect wallet first!");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/balance/${walletAddress}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch balance");
      }
      setBalance(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to fetch balance");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // SIMULATE TRANSACTION
  // -----------------------------
  const simulateTransaction = async () => {
    if (!walletAddress) {
      setError("Connect wallet first!");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/simulate_tx?from_pubkey=${walletAddress}&to_pubkey=${walletAddress}&amount_sol=0.001`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to simulate transaction");
      }
      setSimulateData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to simulate transaction");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // AI TRANSACTION AGENT
  // -----------------------------
  const executeAITransaction = async () => {
    if (!aiCommand.trim()) {
      setError("Please enter a command");
      return;
    }

    if (!walletAddress) {
      setError("Connect wallet first!");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxResult(null);

    try {
      // Step 1: Parse natural language intent
      const parseRes = await fetch(`${API_BASE}/parse_transaction_intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: aiCommand,
          wallet_address: walletAddress,
        }),
      });

      const parseData = await parseRes.json();
      if (!parseRes.ok) {
        throw new Error(parseData.error || "Failed to parse command");
      }

      const { intent } = parseData;

      // Step 2: Create unsigned transaction
      const simRes = await fetch(
        `${API_BASE}/simulate_tx?from_pubkey=${walletAddress}&to_pubkey=${intent.to_address}&amount_sol=${intent.amount}`
      );
      const simData = await simRes.json();
      if (!simRes.ok) {
        throw new Error(simData.error || "Failed to create transaction");
      }

      // Step 3: Sign transaction with Phantom
      // @ts-ignore
      const provider = window?.solana;
      if (!provider) {
        throw new Error("Phantom wallet not available");
      }

      // Recreate the transaction from the unsigned hex
      const { Transaction: SolanaTransaction } = await import("@solana/web3.js");
      const tx = SolanaTransaction.from(Buffer.from(simData.unsigned_tx, "hex"));

      // Get recent blockhash
      const connection = new (await import("@solana/web3.js")).Connection(
        "https://api.mainnet-beta.solana.com"
      );
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = provider.publicKey;

      // Sign with Phantom
      const signed = await provider.signTransaction(tx);

      // Step 4: Broadcast transaction
      const broadcastRes = await fetch(`${API_BASE}/broadcast_tx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signed_transaction: Buffer.from(signed.serialize()).toString("hex"),
        }),
      });

      const broadcastData = await broadcastRes.json();
      if (!broadcastRes.ok) {
        throw new Error(broadcastData.error || "Failed to broadcast transaction");
      }

      setTxResult(broadcastData);
      setAiCommand("");
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // RENDER UI
  // -----------------------------
  return (
    <div className="min-h-screen p-10 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          ChainHelper AI
        </h1>
        <p className="text-gray-400 mb-8">AI-powered Solana transaction assistant</p>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* WALLET */}
        <button
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-50"
          onClick={connectWallet}
          disabled={isLoading}
        >
          {walletAddress ? "✓ Wallet Connected" : "Connect Phantom Wallet"}
        </button>

        {walletAddress && (
          <p className="mt-2 text-green-400 font-mono text-sm">
            Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </p>
        )}

        {/* SECTIONS */}
        <div className="mt-8 space-y-6">
          {/* CHECK BALANCE */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">💰 Check Balance</h2>
            <button
              onClick={checkBalance}
              disabled={isLoading || !walletAddress}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Check Balance"}
            </button>

            {balance && (
              <pre className="mt-4 bg-gray-900 p-4 rounded-lg overflow-auto text-sm border border-gray-700">
                {JSON.stringify(balance, null, 2)}
              </pre>
            )}
          </div>

          {/* AI PROMPT */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">🤖 AI Assistant</h2>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && askAI()}
              placeholder="Ask AI about a transaction... (Press Enter)"
              className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-purple-500 focus:outline-none transition-colors"
              disabled={isLoading}
            />
            <button
              className="mt-3 px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={askAI}
              disabled={isLoading}
            >
              {isLoading ? "Thinking..." : "Ask AI"}
            </button>

            {aiResponse && (
              <div className="mt-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
                <p className="whitespace-pre-wrap">{aiResponse}</p>
              </div>
            )}
          </div>

          {/* SIMULATE TX */}
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">⚡ Simulate Transaction</h2>
            <button
              onClick={simulateTransaction}
              disabled={isLoading || !walletAddress}
              className="px-6 py-2 bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Simulating..." : "Simulate Transfer (0.001 SOL)"}
            </button>

            {simulateData && (
              <pre className="mt-4 bg-gray-900 p-4 rounded-lg overflow-auto text-sm border border-gray-700">
                {JSON.stringify(simulateData, null, 2)}
              </pre>
            )}\n          </div>

          {/* AI TRANSACTION AGENT */}
          <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 p-6 rounded-lg border-2 border-purple-500">
            <h2 className="text-2xl font-semibold mb-2">🚀 AI Transaction Agent</h2>
            <p className="text-gray-300 text-sm mb-4">
              Natural language transactions powered by AI
            </p>

            <div className="mb-4 p-3 bg-gray-900/50 rounded-lg text-sm">
              <p className="text-gray-400 mb-2">💡 Try commands like:</p>
              <ul className="list-disc list-inside text-gray-300 space-y-1">
                <li>"Send 0.01 SOL to [paste address]"</li>
                <li>"Transfer 0.5 SOL to [address]"</li>
              </ul>
            </div>

            <input
              value={aiCommand}
              onChange={(e) => setAiCommand(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isLoading && executeAITransaction()}
              placeholder="Example: Send 0.01 SOL to Hxro8U..."
              className="w-full p-3 rounded-lg bg-gray-900 border border-purple-500 focus:border-pink-500 focus:outline-none transition-colors"
              disabled={isLoading || !walletAddress}
            />
            <button
              className="mt-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={executeAITransaction}
              disabled={isLoading || !walletAddress}
            >
              {isLoading ? "Processing..." : "✨ Execute Transaction"}
            </button>

            {txResult && (
              <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
                <p className="text-green-300 font-semibold mb-2">✅ Transaction Successful!</p>
                <p className="text-sm font-mono text-gray-300 mb-2">
                  Signature: {txResult.signature?.slice(0, 20)}...
                </p>
                <a
                  href={txResult.explorer_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline text-sm"
                >
                  View on Solana Explorer →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
