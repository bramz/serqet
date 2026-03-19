import requests
import pandas as pd
from langchain_core.tools import tool


@tool
def record_expense(amount: float, category: str, description: str):
    """
    Records a financial expense. 
    Call this when the user mentions spending money, buying something, or paying a bill.
    """
    return {"action": "db_record_expense", "amount": amount, "category": category, "description": description}

@tool
def record_savings(amount: float, source: str, description: str):
    """
    Records a financial saving. 
    Call this when the user mentions saving money, earning interest, or receiving income.
    """
    return {"action": "db_record_savings", "amount": amount, "source": source, "description": description}

@tool
def get_market_analysis(asset: str = "BTC"):
    """
    Fetches the current price and 24h trend for a crypto asset.
    Use this to help decide if it's a good time to buy or sell.
    """
    # This tool will call our Go Gateway's market endpoint
    return {"action": "api_get_market_data", "asset": asset}

@tool
def sync_portfolio():
    """
    Syncs the latest holdings from Kraken to the local database.
    Use this if the user asks 'Update my portfolio' or 'What are my current balances?'.
    """
    return {"action": "execute_sync_holdings"}

@tool
def get_portfolio_summary():
    """
    Retrieves the locally stored crypto holdings.
    Use this to answer questions about what assets the user owns.
    """
    return {"action": "api_get_holdings"}

@tool
def analyze_net_worth():
    """
    Calculates the user's total net worth by combining local expenses, 
    income records, and Kraken crypto holdings.
    Use this when the user asks 'How am I doing financially?' or 'What is my net worth?'.
    """
    return {"action": "api_get_net_worth_analysis"}

@tool
def analyze_technical_indicators(ohlc_data: list):
    """
    Calculates RSI and Moving Averages from OHLC data.
    Input should be a list of price candles.
    """
    df = pd.DataFrame(ohlc_data, columns=['time', 'open', 'high', 'low', 'close', 'vwap', 'volume', 'count'])
    df['close'] = df['close'].astype(float)
    
    sma_20 = df['close'].rolling(window=20).mean().iloc[-1]
    
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs)).iloc[-1]
    
    return {
        "current_price": df['close'].iloc[-1],
        "rsi": round(rsi, 2),
        "sma_20": round(sma_20, 2),
        "trend": "Bullish" if df['close'].iloc[-1] > sma_20 else "Bearish"
    }

@tool
def generate_trading_signal(asset: str, candles: list):
    """
    Analyzes price candles (OHLC) to generate a BUY/SELL/HOLD signal.
    Input: asset name (e.g. 'BTC') and a list of candle data.
    """
    if not candles or len(candles) < 14:
        return {"status": "error", "message": "Insufficient market data."}

    # Convert to DataFrame for RSI calculation
    df = pd.DataFrame(candles)
    df['close'] = df['close'].astype(float)
    
    # Simple RSI Logic
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs)).iloc[-1]
    
    current_price = df['close'].iloc[-1]
    
    action = "HOLD"
    confidence = 0.5
    reasoning = f"Market is neutral. RSI at {rsi:.2f}."

    if rsi < 35:
        action = "BUY"
        confidence = 0.85
        reasoning = f"Asset is oversold (RSI: {rsi:.2f}). Strong entry signal detected."
    elif rsi > 65:
        action = "SELL"
        confidence = 0.80
        reasoning = f"Asset is overbought (RSI: {rsi:.2f}). Profit-taking recommended."

    # CRITICAL: This is the data Go will use to populate the DB
    return {
        "action": "execute_save_trading_signal",
        "asset": asset,
        "signal_action": action,
        "price": current_price,
        "reasoning": reasoning,
        "confidence": confidence
    }

# @tool
# def execute_kraken_trade(pair: str, action: str, volume: float, order_type: str = "market"):
#     """
#     Executes a real trade on Kraken. 
#     'action' must be 'buy' or 'sell'.
#     'pair' should be like 'XXBTZUSD'.
#     'volume' is the amount of the asset.
#     """
#     return {
#         "action": "execute_crypto_trade",
#         "pair": pair,
#         "side": action,
#         "volume": volume,
#         "order_type": order_type
#     }