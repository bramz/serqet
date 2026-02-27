package api

import (
	"gateway/db"
	"gateway/models"
	"gateway/services"
	"log"
	"strconv"

	"github.com/gofiber/fiber/v3"
)

func GetSocialPosts(c fiber.Ctx) error {
	var posts []models.SocialPost
	result := db.Instance.Order("created_at desc").Find(&posts)
	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Could not fetch social posts"})
	}
	return c.JSON(posts)
}

func GetFinanceSummary(c fiber.Ctx) error {
	var records []models.FinanceRecord
	db.Instance.Find(&records)

	var total float64
	for _, r := range records {
		total += r.Amount
	}

	return c.JSON(fiber.Map{
		"total_expenses": total,
		"recent_records": records,
	})
}

func GetTasks(c fiber.Ctx) error {
	var tasks []models.TaskRecord
	db.Instance.Order("created_at desc").Find(&tasks)
	return c.JSON(tasks)
}

func GetJobs(c fiber.Ctx) error {
	var jobs []models.JobApplication
	db.Instance.Order("created_at desc").Find(&jobs)
	return c.JSON(jobs)
}

func GetHealthStats(c fiber.Ctx) error {
	var meals []models.DietRecord
	var workouts []models.WorkoutRecord
	
	db.Instance.Order("created_at desc").Limit(10).Find(&meals)
	db.Instance.Order("created_at desc").Limit(10).Find(&workouts)

	return c.JSON(fiber.Map{
		"diet": meals,
		"fitness": workouts,
	})
}

func SyncHoldings(c fiber.Ctx) error {
	balances, err := services.FetchKrakenBalances()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	for asset, amountStr := range balances {
		amount := parseNumeric(amountStr)
		log.Printf("%f", amount)
		if amount > 0 {
			db.Instance.Where(models.CryptoHoldings{Asset: asset}).
				Assign(models.CryptoHoldings{Balance: amount}).
				FirstOrCreate(&models.CryptoHoldings{})
		}
	}

	return c.JSON(fiber.Map{"status": "success", "synced": len(balances)})
}

func parseNumeric(amountStr string) float64 {
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return 0.0
	}
	return amount
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