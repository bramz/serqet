package models

type FinanceRecord struct {
	Base
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
}
