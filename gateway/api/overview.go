package api

import (
	"gateway/db"
	"gateway/models"
	"github.com/gofiber/fiber/v3"
)

type OverviewSnapshot struct {
	Intelligence []models.ResearchReports  `json:"intelligence"`
	Holdings     []models.CryptoHoldings   `json:"holdings"`
	Tasks        []models.TaskRecord      `json:"tasks"`
	Revenue      float64                  `json:"total_revenue"`
	SystemStats  map[string]interface{}   `json:"system_stats"`
}

func GetOverviewSnapshot(c fiber.Ctx) error {
	var intelligence []models.ResearchReports
	var holdings []models.CryptoHoldings
	var tasks []models.TaskRecord
	// var revenueCampaigns []models.RevenueCampaign

	// Fetch Top 3 of each for the Glance view
	db.Instance.Order("created_at desc").Limit(3).Find(&intelligence)
	db.Instance.Order("balance desc").Limit(3).Find(&holdings)
	db.Instance.Where("status = ?", "Pending").Order("created_at desc").Limit(3).Find(&tasks)
	
	// Sum Revenue
	// var totalRev float64
	// db.Instance.Model(&models.RevenueCampaign{}).Select("sum(total_earned)").Scan(&totalRev)

	snapshot := OverviewSnapshot{
		Intelligence: intelligence,
		Holdings:     holdings,
		Tasks:        tasks,
		Revenue:      0.00,
		SystemStats: map[string]interface{}{
			"cpu":    "12%", // In a later phase, use 'shirou/gopsutil' for real host stats
			"memory": "1.4GB",
			"uptime": "99.9%",
		},
	}

	return c.JSON(snapshot)
}