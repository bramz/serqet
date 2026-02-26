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