import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
# AI
from openai import OpenAI

# Solana
from solana.rpc.async_api import AsyncClient
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.system_program import TransferParams, transfer

load_dotenv()


app = FastAPI()
client = AsyncClient("https://api.mainnet-beta.solana.com")
ai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --------------------------
# 1. CHECK WALLET BALANCE
# --------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",  # Allow all Vercel preview deployments
        # Add your production frontend URL here after deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------
# HEALTH CHECK
# --------------------------

@app.get("/")
async def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "service": "ChainHelper AI - Solana Assistant",
        "version": "1.0.0"
    }


@app.get("/balance/{address}")
async def get_balance(address: str):
    """Get SOL balance for a given Solana address"""
    if not address or len(address) < 32:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid Solana address"}
        )
    
    try:
        pubkey = Pubkey.from_string(address)
        res = await client.get_balance(pubkey)
        lamports = res.value
        return {"address": address, "lamports": lamports, "sol": lamports / 1e9}
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": f"Failed to fetch balance: {str(e)}"}
        )


# --------------------------
# 2. AI ASSISTANT
# --------------------------

from pydantic import BaseModel

class AIRequest(BaseModel):
    prompt: str

class BroadcastRequest(BaseModel):
    signed_transaction: str

class TransactionIntentRequest(BaseModel):
    user_message: str
    wallet_address: str

@app.post("/ai")
async def ask_ai(data: AIRequest):
    """AI assistant for Solana transaction queries"""
    if not data.prompt or not data.prompt.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "Prompt cannot be empty"}
        )
    
    try:
        response = ai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful Solana blockchain assistant. Provide clear, concise answers about Solana transactions, wallets, and blockchain concepts."},
                {"role": "user", "content": data.prompt}
            ],
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"AI request failed: {str(e)}"}
        )


# --------------------------
# 3. SIMULATE TRANSACTION (unsigned)
# --------------------------

@app.get("/simulate_tx")
async def simulate_tx(from_pubkey: str, to_pubkey: str, amount_sol: float):
    """Simulate an unsigned Solana transaction"""
    if not from_pubkey or not to_pubkey:
        return JSONResponse(
            status_code=400,
            content={"error": "Missing from_pubkey or to_pubkey"}
        )
    
    if amount_sol <= 0:
        return JSONResponse(
            status_code=400,
            content={"error": "Amount must be greater than 0"}
        )
    
    try:
        from_key = Pubkey.from_string(from_pubkey)
        to_key = Pubkey.from_string(to_pubkey)

        tx = Transaction().add(
            transfer(
                TransferParams(
                    from_pubkey=from_key,
                    to_pubkey=to_key,
                    lamports=int(amount_sol * 1e9)
                )
            )
        )

        return {
            "unsigned_tx": tx.serialize().hex(),
            "from": from_pubkey,
            "to": to_pubkey,
            "amount_sol": amount_sol,
            "message": "Unsigned transaction created successfully"
        }

    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": f"Transaction simulation failed: {str(e)}"}
        )


# --------------------------
# 4. BROADCAST SIGNED TRANSACTION
# --------------------------

@app.post("/broadcast_tx")
async def broadcast_transaction(data: BroadcastRequest):
    """Broadcast a signed transaction to Solana network"""
    if not data.signed_transaction:
        return JSONResponse(
            status_code=400,
            content={"error": "Signed transaction is required"}
        )
    
    try:
        # Convert hex string back to bytes
        tx_bytes = bytes.fromhex(data.signed_transaction)
        
        # Send transaction
        result = await client.send_raw_transaction(tx_bytes)
        
        return {
            "signature": str(result.value),
            "message": "Transaction broadcasted successfully",
            "explorer_url": f"https://explorer.solana.com/tx/{result.value}?cluster=mainnet-beta"
        }
    except Exception as e:
        return JSONResponse(
            status_code=400,
            content={"error": f"Failed to broadcast transaction: {str(e)}"}
        )


# --------------------------
# 5. AI TRANSACTION INTENT PARSER
# --------------------------

@app.post("/parse_transaction_intent")
async def parse_transaction_intent(data: TransactionIntentRequest):
    """Parse natural language into transaction parameters using AI"""
    if not data.user_message or not data.user_message.strip():
        return JSONResponse(
            status_code=400,
            content={"error": "User message cannot be empty"}
        )
    
    if not data.wallet_address:
        return JSONResponse(
            status_code=400,
            content={"error": "Wallet address is required"}
        )
    
    try:
        # Use AI to extract transaction intent
        response = ai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a Solana transaction parser. Extract transaction details from user messages.
                    
Return ONLY a JSON object with these fields:
- action: "transfer" or "unknown"
- to_address: The recipient Solana address (if found)
- amount: The amount in SOL as a number (if found)
- confidence: "high", "medium", or "low"

If you cannot parse the intent, set action to "unknown".

Examples:
"Send 0.5 SOL to ABC123..." -> {"action": "transfer", "to_address": "ABC123...", "amount": 0.5, "confidence": "high"}
"Transfer 1 SOL to my friend at XYZ789..." -> {"action": "transfer", "to_address": "XYZ789...", "amount": 1, "confidence": "high"}"""
                },
                {"role": "user", "content": data.user_message}
            ],
            response_format={"type": "json_object"}
        )
        
        import json
        parsed = json.loads(response.choices[0].message.content)
        
        if parsed.get("action") == "unknown":
            return JSONResponse(
                status_code=400,
                content={"error": "Could not understand transaction intent. Please specify: 'Send X SOL to <address>'"}
            )
        
        # Validate the parsed data
        if not parsed.get("to_address"):
            return JSONResponse(
                status_code=400,
                content={"error": "No recipient address found in your message"}
            )
        
        if not parsed.get("amount") or parsed.get("amount") <= 0:
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid or missing amount"}
            )
        
        return {
            "intent": parsed,
            "from_address": data.wallet_address,
            "message": f"Ready to send {parsed['amount']} SOL to {parsed['to_address'][:8]}..."
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Failed to parse intent: {str(e)}"}
        )
