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
	Actions      []models.PendingAction   `json:"actions"` // NEW: For Action Center
	Events       []models.SystemEvent     `json:"events"`  // NEW: For Brain Logs
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
	var actions []models.PendingAction
	var events []models.SystemEvent

	db.Instance.Order("created_at desc").Limit(3).Find(&intel)
	db.Instance.Order("balance desc").Limit(4).Find(&holdings)
	db.Instance.Where("status = ?", "Pending").Order("created_at desc").Limit(3).Find(&tasks)
	db.Instance.Order("created_at desc").Limit(2).Find(&social)
	db.Instance.Order("created_at desc").Limit(2).Find(&jobs)
	
	db.Instance.Where("status = ?", "Pending").Order("created_at desc").Limit(5).Find(&actions)
	
	db.Instance.Order("created_at desc").Limit(10).Find(&events)

	var totalRev float64
	db.Instance.Model(&models.VentureCampaign{}).Select("COALESCE(sum(revenue_earned), 0)").Scan(&totalRev)

	cpuPercent, _ := cpu.Percent(time.Second, false)
	cpuString := "0%"
	if len(cpuPercent) > 0 {
		cpuString = fmt.Sprintf("%.1f%%", cpuPercent[0])
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	memUsageMB := float64(m.Alloc) / 1024 / 1024

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
		Actions:      actions,
		Events:       events,
		Health: map[string]interface{}{
			"today_calories": calories,
			"status":         "Target: 2200",
		},
		Revenue: totalRev,
		SystemStats: map[string]interface{}{
			"cpu":            cpuString,
			"uptime":         uptimeString,
			"neural_latency": "42ms",
			"vector_count":   vectorCount,
			"memory_usage":   fmt.Sprintf("%.1f MB", memUsageMB),
		},
	})
}