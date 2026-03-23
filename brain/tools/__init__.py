from .social import create_social_draft
from .finance import (
    record_expense, 
    record_savings, 
    get_market_analysis, 
    sync_portfolio, 
    get_portfolio_summary, 
    analyze_net_worth, 
    analyze_technical_indicators, 
    generate_trading_signal,
)
from .tasks import create_task
from .jobs import track_job_application
from .health import record_meal, record_workout
from .research import web_research
from .arbiter import analyze_niche_profitability, scout_business_niche, launch_venture

ALL_TOOLS = [
    create_social_draft,
    record_expense,
    record_savings,
    get_market_analysis,
    sync_portfolio,
    get_portfolio_summary,
    analyze_net_worth,
    analyze_technical_indicators,
    generate_trading_signal,
    create_task,
    track_job_application,
    record_meal,
    record_workout,
    web_research,
    analyze_niche_profitability,
    scout_business_niche,
    launch_venture
]
