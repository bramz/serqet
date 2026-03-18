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

func GetResearch(c fiber.Ctx) error {
	var reports []models.ResearchReports
	db.Instance.Order("created_at desc").Limit(10).Find(&reports)
	return c.JSON(reports)
}