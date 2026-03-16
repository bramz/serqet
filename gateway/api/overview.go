package api

import (
	"encoding/json"
	"fmt"
	"gateway/db"
	"gateway/models"
	"net/http"
	"runtime"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/shirou/gopsutil/v3/cpu"
)

var StartTime = time.Now()

type OverviewSnapshot struct {
	Intelligence []models.ResearchReports `json:"intelligence"`
	Holdings     []models.CryptoHoldings  `json:"holdings"`
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

	db.Instance.Order("created_at desc").Limit(3).Find(&intel)
	db.Instance.Order("balance desc").Limit(4).Find(&holdings)
	db.Instance.Where("status = ?", "Pending").Order("created_at desc").Limit(3).Find(&tasks)
	db.Instance.Order("created_at desc").Limit(2).Find(&social)
	db.Instance.Order("created_at desc").Limit(2).Find(&jobs)

	// cpu
	cpuPercent, _ := cpu.Percent(time.Second, false)
	cpuString := "0%"
	if len(cpuPercent) > 0 {
		cpuString = fmt.Sprintf("%.1f%%", cpuPercent[0])
	}

	// memory
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	memUsageMB := float64(m.Alloc) / 1024 / 1024

	// uptime
	uptimeDuration := time.Since(StartTime)
	days := int(uptimeDuration.Hours() / 24)
	hours := int(uptimeDuration.Hours()) % 24
	mins := int(uptimeDuration.Minutes()) % 60
	uptimeString := fmt.Sprintf("%dd %dh %dm", days, hours, mins)

	vectorCount := 0
	resp, err := http.Get("http://localhost:8000/brain/v1/memory/stats")
	if err == nil {
		defer resp.Body.Close()
		var stats struct {
			VectorCount int `json:"vector_count"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&stats); err == nil {
			vectorCount = stats.VectorCount
		}
	}

	// health, calculate the beginning of day (midnight)
	now := time.Now()
	beginningOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var calories int
	db.Instance.Model(&models.DietRecord{}).
		Where("created_at > ?", beginningOfDay).
		Select("COALESCE(sum(calories), 0)").
		Scan(&calories)

	return c.JSON(OverviewSnapshot{
		Intelligence: intel,
		Holdings:     holdings,
		Tasks:        tasks,
		Social:       social,
		Jobs:         jobs,
		Health: map[string]interface{}{
			"today_calories": calories,
			"status":         "Target: 2200",
		},
		Revenue: 0.00,
		SystemStats: map[string]interface{}{
			"cpu":            cpuString,
			"uptime":         uptimeString,
			"neural_latency": "42ms", // heartbeat simulation
			"vector_count":  vectorCount,
			"memory_usage":   fmt.Sprintf("%.1f MB", memUsageMB),
		},
	})
}