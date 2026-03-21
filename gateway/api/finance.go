package api

import (
	"gateway/db"
	"gateway/models"
	"gateway/services"
	"gateway/utils"
	"log"

	"github.com/gofiber/fiber/v3"
	// "gorm.io/gorm"
)

func GetVentures(c fiber.Ctx) error {
	var ventures []models.VentureCampaign
	if err := db.Instance.Order("created_at desc").Find(&ventures).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch ventures"})
	}
	return c.JSON(ventures)
}

func GetFinanceSummary(c fiber.Ctx) error {
	var recent []models.FinanceRecord
	db.Instance.Order("created_at desc").Limit(10).Find(&recent)

	var totalExpenses float64
	db.Instance.Model(&models.FinanceRecord{}).
		Where("type = ?", "expense").
		Select("COALESCE(sum(amount), 0)").
		Scan(&totalExpenses)

	var manualIncome float64
	db.Instance.Model(&models.FinanceRecord{}).
		Where("type = ?", "income").
		Select("COALESCE(sum(amount), 0)").
		Scan(&manualIncome)

	var ventureRevenue float64
	db.Instance.Model(&models.VentureCampaign{}).
		Select("COALESCE(sum(revenue_earned), 0)").
		Scan(&ventureRevenue)

	return c.JSON(fiber.Map{
		"total_expenses": totalExpenses,
		"total_income":   manualIncome + ventureRevenue,
		"recent_records": recent,
	})
}

func SyncHoldings(c fiber.Ctx) error {
	balances, err := services.FetchKrakenBalances()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	for asset, amountStr := range balances {
		amount := utils.ParseNumeric(amountStr)
		log.Printf("%f", amount)
		if amount > 0 {
			db.Instance.Where(models.CryptoHoldings{Asset: asset}).
				Assign(models.CryptoHoldings{Balance: amount}).
				FirstOrCreate(&models.CryptoHoldings{})
		}
	}

	return c.JSON(fiber.Map{"status": "success", "synced": len(balances)})
}


func GetCryptoHoldings(c fiber.Ctx) error {
	var holdings []models.CryptoHoldings
	db.Instance.Find(&holdings)
	return c.JSON(holdings)
}

func GetSignals(c fiber.Ctx) error {
	var signals []models.TradingSignal
	
	result := db.Instance.Order("status desc, created_at desc").Limit(10).Find(&signals)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch trading signals"})
	}

	return c.JSON(signals)
}

func UpdateSignalStatus(c fiber.Ctx) error {
	id := c.Params("id")
	var body struct {
		Status string `json:"status"`
	}
	c.Bind().JSON(&body)

	db.Instance.Model(&models.TradingSignal{}).Where("id = ?", id).Update("status", body.Status)
	return c.JSON(fiber.Map{"status": "updated"})
}

func GetNetWorthAnalysis(c fiber.Ctx) error {
	var holdings []models.CryptoHoldings
	var expenses []models.FinanceRecord
	
	// Use global Instance for consistency
	db.Instance.Find(&holdings)
	db.Instance.Find(&expenses)

	totalExpenses := 0.0
	for _, e := range expenses {
		totalExpenses += e.Amount
	}

	return c.JSON(fiber.Map{
		"crypto_holdings": holdings,
		"total_spent":     totalExpenses,
		"status":          "Neural analysis complete.",
	})
}

func GetOHLCData(c fiber.Ctx) error {
	pair := c.Query("pair", "XXBTZUSD")
	candles, err := services.FetchMarketCandles(pair)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Error fetching market data"})
	}

	return c.JSON(candles)
}