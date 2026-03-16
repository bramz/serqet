package api

import (
	"gateway/db"
	"gateway/models"
	"time"
	"github.com/gofiber/fiber/v3"
)

type OverviewSnapshot struct {
	Intelligence []models.ResearchReports  `json:"intelligence"`
	Holdings     []models.CryptoHoldings   `json:"holdings"`
	Tasks        []models.TaskRecord      `json:"tasks"`
	Social       []models.SocialPost      `json:"social"`
	Jobs         []models.JobApplication  `json:"jobs"`
	Health       map[string]interface{}   `json:"health"`
	Revenue      float64                  `json:"total_revenue"`
	SystemStats  map[string]interface{}   `json:"system_stats"`
}

func GetOverviewSnapshot(c fiber.Ctx) error {
	var intel []models.ResearchReports
	var holdings []models.CryptoHoldings
	var tasks []models.TaskRecord
	var social []models.SocialPost
	var jobs []models.JobApplication

	// Parallel-ish fetching for high density
	db.Instance.Order("created_at desc").Limit(3).Find(&intel)
	db.Instance.Order("balance desc").Limit(4).Find(&holdings)
	db.Instance.Where("status = ?", "Pending").Order("created_at desc").Limit(3).Find(&tasks)
	db.Instance.Order("created_at desc").Limit(2).Find(&social)
	db.Instance.Order("created_at desc").Limit(2).Find(&jobs)
	
	// Health Summary (Today's totals)
	var calories int
	db.Instance.Model(&models.DietRecord{}).Where("created_at > ?", time.Now()).Select("COALESCE(sum(calories), 0)").Scan(&calories)

	// var totalRev float64
	// db.Instance.Model(&models.RevenueCampaign{}).Select("sum(total_earned)").Scan(&totalRev)

	return c.JSON(OverviewSnapshot{
		Intelligence: intel,
		Holdings:     holdings,
		Tasks:        tasks,
		Social:       social,
		Jobs:         jobs,
		Health: map[string]interface{}{
			"today_calories": calories,
			"status": "Target: 2200",
		},
		Revenue: 0.00,
		SystemStats: map[string]interface{}{
			"cpu":    "14%",
			"uptime": "12d 4h",
			"neural_latency": "42ms",
			"memory_usage": "1.2GB",
		},
	})
}