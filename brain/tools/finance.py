import requests
import pandas as pd
from typing import List, Dict, Any, Annotated, Optional
from langchain_core.tools import tool
import os

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost:8001")
 

def _calc_indicators(df: pd.DataFrame) -> dict:
    """Compute RSI-14 and SMA-20 from a DataFrame with a 'close' column."""
    df = df.copy()
    df["close"] = df["close"].astype(float)
    sma_20 = df["close"].rolling(window=20).mean().iloc[-1]
    delta = df["close"].diff()
    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss.replace(0, 1e-9)
    rsi = float((100 - (100 / (1 + rs))).iloc[-1])
    current = float(df["close"].iloc[-1])
    return {
        "current_price": round(current, 4),
        "rsi": round(rsi, 2),
        "sma_20": round(float(sma_20), 2),
        "trend": "BULLISH" if current > sma_20 else "BEARISH",
    }
 

PAIR_MAP = {"BTC": "XXBTZUSD", "ETH": "XETHZUSD", "SOL": "SOLUSD"}
 
@tool
def record_expense(
    amount: Annotated[float, "The numerical value of the expense"],
    category: Annotated[str, "Spending category (e.g. food, rent, tech)"],
    description: Annotated[str, "Brief description of the purchase"],
) -> Dict[str, Any]:
    """Records a financial expense. Call when the user mentions spending money."""
    return {"action": "db_record_expense", "amount": amount, "category": category, "description": description}
 
@tool
def record_savings(
    amount: Annotated[float, "The numerical value saved or earned"],
    source: Annotated[str, "Source of funds (e.g. salary, gift, interest)"],
    description: Annotated[str, "Context regarding the income or saving"],
) -> Dict[str, Any]:
    """Records financial income or savings."""
    return {"action": "db_record_savings", "amount": amount, "source": source, "description": description}
 
@tool
def sync_portfolio() -> Dict[str, Any]:
    """Syncs the latest holdings from Kraken. Use when user asks to refresh balances."""
    return {"action": "execute_sync_holdings"}
 
@tool
def get_portfolio_summary() -> Dict[str, Any]:
    """Retrieves current crypto holdings from the local database."""
    return {"action": "api_get_holdings"}
 
@tool
def analyze_net_worth() -> Dict[str, Any]:
    """Calculates total net worth by aggregating expenses, income, and crypto."""
    return {"action": "api_get_net_worth_analysis"}
 
@tool
def get_market_analysis(
    asset: Annotated[str, "Ticker symbol, e.g. BTC"] = "BTC",
) -> Dict[str, Any]:
    """Fetches market data and calculates RSI/SMA indicators for a given asset."""
    pair = PAIR_MAP.get(asset.upper(), "XXBTZUSD")
    try:
        resp = requests.get(f"{GATEWAY_URL}/api/v1/finance/ohlc?pair={pair}", timeout=10)
        resp.raise_for_status()
        candles = resp.json()
        if not candles or len(candles) < 20:
            return {"status": "error", "message": "Insufficient price history"}
        df = pd.DataFrame(candles)
        indicators = _calc_indicators(df)
        return {"asset": asset, **indicators, "decision_needed": True}
    except Exception as e:
        return {"status": "error", "message": str(e)}
 
@tool
def analyze_technical_indicators(
    ohlc_data: Annotated[List[Dict[str, Any]], "Raw price candle data list"],
) -> Dict[str, Any]:
    """Advanced utility to calculate RSI, SMA, and Trend from raw OHLC data."""
    try:
        return _calc_indicators(pd.DataFrame(ohlc_data))
    except Exception as e:
        return {"status": "error", "message": str(e)}
 
@tool
def generate_trading_signal(
    asset: str,
    action: Annotated[str, "BUY, SELL, or HOLD"],
    reasoning: str,
    confidence: float,
) -> Dict[str, Any]:
    """Saves the final AI trade signal to the database."""
    return {
        "action": "execute_generate_trading_signal",
        "asset": asset, "signal_action": action,
        "reasoning": reasoning, "confidence": confidence,
    }
