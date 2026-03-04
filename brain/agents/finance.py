from .base import SerqetAgent

class FinanceAgent(SerqetAgent):
    name = "finance"
    allowed_tools = ["record_expense", "sync_portfolio", "get_portfolio_summary", "generate_trading_signal"]
    
    def get_system_prompt(self) -> str:
        return "You are the Serqet Wealth Manager. Monitor markets and track expenses."