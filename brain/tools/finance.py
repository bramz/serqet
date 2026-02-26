from langchain_core.tools import tool
import requests

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