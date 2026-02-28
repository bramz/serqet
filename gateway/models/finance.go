package models

import "gorm.io/gorm"
type FinanceRecord struct {
	Base
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
}

type CryptoHoldings struct {
	gorm.Model
	Asset     string  `json:"asset"`      // e.g., "BTC", "ETH", "USD"
	Balance   float64 `json:"balance"`    // Amount held
	CostBasis float64 `json:"cost_basis"` // Optional: For profit/loss calculation
	USDValue  float64 `json:"usd_value"`  // Last synced USD value
}

type TradingSignals struct {
	Base
	Asset     string  `json:"asset"`
	Action    string  `json:"action"`
	Price     float64 `json:"price"`
	Reasoning string  `json:"reasoning"`
	Confidence float64 `json:"confidence"` // 0.0 to 1.0
	Status    string  `json:"status"`     // "Pending", "Executed", "Dismissed"
}
