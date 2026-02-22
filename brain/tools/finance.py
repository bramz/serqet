from langchain_core.tools import tool

@tool
def record_expense(amount: float, category: str, description: str):
    """
    Records a financial expense. 
    Call this when the user mentions spending money, buying something, or paying a bill.
    """
    return {"action": "db_record_expense", "amount": amount, "category": category, "description": description}