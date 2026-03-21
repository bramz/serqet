package models

import "gorm.io/gorm"
type FinanceRecord struct {
	Base
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
	Type        string  `json:"type"` // "Income" or "Expense"
}

type CryptoHoldings struct {
	gorm.Model
	Asset     string  `json:"asset"`      // e.g., "BTC", "ETH", "USD"
	Balance   float64 `json:"balance"`    // Amount held
	CostBasis float64 `json:"cost_basis"` // Optional: For profit/loss calculation
	USDValue  float64 `json:"usd_value"`  // Last synced USD value
}

type TradingSignal struct {
    gorm.Model
    Asset      string  `json:"asset"`
    Action     string  `json:"action"`
    Price      float64 `json:"price"`
    Reasoning  string  `json:"reasoning"`
    Confidence float64 `json:"confidence"`
    Status     string  `json:"status"`
}

type RevenueCampaign struct {
	gorm.Model
	Name        string  `json:"name"`        // e.g., "AI Tool Affiliate Bot"
	Status      string  `json:"status"`      // "Active", "Paused", "Researching"
	Platform    string  `json:"platform"`    // "X", "Substack", "Kraken"
	Strategy    string  `json:"strategy"`    // AI's internal logic
	Budget      float64 `json:"budget"`      // Initial capital
	TotalEarned float64 `json:"total_earned"` // Total ROI
}

type VentureCampaign struct {
	gorm.Model
	Name            string  `json:"name"`
	Status          string  `json:"status"`           // "Incubating", "Active", "Scaling"
	Category        string  `json:"category"`         // "Affiliate", "SaaS", "Content"
	StrategySummary string  `json:"strategy_summary"`
	ProjectedROI    string  `json:"projected_roi"`
	Platform        string  `json:"platform"`
	RevenueEarned   float64 `json:"revenue_earned"`
}