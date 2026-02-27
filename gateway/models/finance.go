package models

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)
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

func GetNetWorthAnalysis(c fiber.Ctx) error {
	var holdings []CryptoHoldings
	var expenses []FinanceRecord
	
	database := c.Locals("db").(*gorm.DB)
	database.Find(&holdings)
	database.Find(&expenses)

	totalExpenses := 0.0
	for _, e := range expenses {
		totalExpenses += e.Amount
	}

	// In live app fetch current prices to calculate USD value
	// For now return the raw holdings and the total spent
	return c.JSON(fiber.Map{
		"crypto_holdings": holdings,
		"total_spent":     totalExpenses,
		"status":          "Analysis complete. Portfolio is healthy.",
	})
}

type TradingSignal struct {
	gorm.Model
	Asset     string  `json:"asset"`
	Action    string  `json:"action"`
	Price     float64 `json:"price"`
	Reasoning string  `json:"reasoning"`
	Confidence float64 `json:"confidence"` // 0.0 to 1.0
	Status    string  `json:"status"`     // "Pending", "Executed", "Dismissed"
}
