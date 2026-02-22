package api

import (
	"gateway/db"
	"gateway/models"
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