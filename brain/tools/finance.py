import requests
import pandas as pd
from typing import List, Dict, Any, Annotated, Optional
from langchain_core.tools import tool

GATEWAY_URL = "http://localhost:8001/api/v1"

@tool
def record_expense(
    amount: Annotated[float, "The numerical value of the expense"],
    category: Annotated[str, "The category of spending (e.g., food, rent, tech)"],
    description: Annotated[str, "A brief description of the purchase"]
) -> Dict[str, Any]:
    """
    Records a financial expense to the ledger. 
    Call this when the user mentions spending money or buying an item.
    """
    return {
        "action": "db_record_expense", 
        "amount": amount, 
        "category": category, 
        "description": description
    }

@tool
def record_savings(
    amount: Annotated[float, "The numerical value saved or earned"],
    source: Annotated[str, "The source of the funds (e.g., salary, gift, interest)"],
    description: Annotated[str, "Context regarding the income or saving"]
) -> Dict[str, Any]:
    """
    Records financial income or savings. 
    Call this when the user mentions earning money or receiving funds.
    """
    return {
        "action": "db_record_savings", 
        "amount": amount, 
        "source": source, 
        "description": description
    }

@tool
def get_market_analysis(
    asset: Annotated[str, "The ticker symbol of the asset, e.g., 'BTC' or 'ETH'"] = "BTC"
) -> Dict[str, Any]:
    """
    Fetches raw 24h OHLC (Open, High, Low, Close) market data for a crypto asset.
    This is a prerequisite for generating trading signals.
    """
    # map simple names to pairs
    pair_map = {"BTC": "XXBTZUSD", "ETH": "XETHZUSD", "SOL": "SOLUSD"}
    pair = pair_map.get(asset.upper(), "XXBTZUSD")
    
    try:
        response = requests.get(f"{GATEWAY_URL}/finance/ohlc?pair={pair}", timeout=10)
        if response.status_code == 200:
            return {"candles": response.json(), "asset": asset}
    except Exception as e:
        return {"status": "error", "message": f"Connection to Gateway failed: {str(e)}"}
    
    return {"status": "error", "message": "Could not retrieve market data."}

@tool
def sync_portfolio() -> Dict[str, Any]:
    """
    Syncs the latest holdings from the Kraken Exchange to the local OS database.
    Use this if the user asks to 'update' or 'refresh' their balances.
    """
    return {"action": "execute_sync_holdings"}

@tool
def get_portfolio_summary() -> Dict[str, Any]:
    """
    Retrieves the current crypto holdings from the local database.
    Use this to answer questions about what assets the user currently owns.
    """
    return {"action": "api_get_holdings"}

@tool
def analyze_net_worth() -> Dict[str, Any]:
    """
    Calculates total net worth by aggregating expenses, income, and crypto holdings.
    Use this for high-level financial health queries.
    """
    return {"action": "api_get_net_worth_analysis"}

@tool
def generate_trading_signal(
    asset: Annotated[str, "The name of the asset"],
    candles: Annotated[List[Dict[str, Any]], "A list of OHLC candle dictionaries"]
) -> Dict[str, Any]:
    """
    Analyzes price candles using technical indicators (RSI) to generate a BUY/SELL/HOLD signal.
    """
    if not candles or len(candles) < 14:
        return {"status": "error", "message": "Insufficient data for technical analysis."}

    try:
        df = pd.DataFrame(candles)
        df['close'] = df['close'].astype(float)
        
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        
        rs = gain / loss.replace(0, 0.001)
        rsi = 100 - (100 / (1 + rs)).iloc[-1]
        
        current_price = df['close'].iloc[-1]
        
        action = "HOLD"
        confidence = 0.5
        reasoning = f"RSI is currently neutral at {rsi:.2f}."

        if rsi < 35:
            action = "BUY"
            confidence = 0.85
            reasoning = f"Asset is oversold (RSI: {rsi:.2f}). High probability of upward correction."
        elif rsi > 65:
            action = "SELL"
            confidence = 0.80
            reasoning = f"Asset is overbought (RSI: {rsi:.2f}). Consider taking profits."

        return {
            "action": "execute_generate_trading_signal",
            "asset": asset,
            "signal_action": action,
            "price": float(current_price),
            "reasoning": reasoning,
            "confidence": float(confidence)
        }
    except Exception as e:
        return {"status": "error", "message": f"Analysis failed: {str(e)}"}

@tool
def analyze_technical_indicators(
    ohlc_data: Annotated[List[Dict[str, Any]], "The raw price candle data list"]
) -> Dict[str, Any]:
    """
    Advanced utility to calculate RSI, SMA, and Trend for raw market data.
    """
    try:
        df = pd.DataFrame(ohlc_data)
        df['close'] = df['close'].astype(float)
        
        # SMA 20
        sma_20 = df['close'].rolling(window=20).mean().iloc[-1]
        
        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss.replace(0, 0.001)
        rsi = 100 - (100 / (1 + rs)).iloc[-1]
        
        curr = df['close'].iloc[-1]
        
        return {
            "current_price": float(curr),
            "rsi": round(float(rsi), 2),
            "sma_20": round(float(sma_20), 2),
            "trend": "Bullish" if curr > sma_20 else "Bearish"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}