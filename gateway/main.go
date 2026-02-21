package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"gateway/models"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	activeModules = []models.Module{
		{ID: "social", Name: "Social Media", Description: "Manage your social presence.", Icon: "social"},
		{ID: "finance", Name: "Finances", Description: "Track income and expenses.", Icon: "finance"},
		{ID: "task", Name: "Task", Description: "Organize your to-dos.", Icon: "tasks"},
		{ID: "jobs", Name: "Jobs", Description: "Track your job applications.", Icon: "jobs"},
	}
	brainServiceURL = "http://localhost:8000/brain/v1/process_intent"
)

var DB *gorm.DB

func initDB() {
	dsn := "host=localhost user=serqet password=password dbname=serqet port=5432 sslmode=disable"
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	DB.AutoMigrate(
		&models.ChatHistory{},
		&models.FinanceRecord{},
		&models.TaskRecord{},
		&models.SocialPost{},
		&models.JobApplication{},
	)
}

func main() {
	initDB()
	app := fiber.New()
	app.Use(cors.New())

	app.Get("/api/v1/modules", func(c fiber.Ctx) error {
		return c.JSON(activeModules)
	})

	app.Post("/api/v1/intent", func(c fiber.Ctx) error {
		var body struct {
			UserID string `json:"user_id"`
			Query  string `json:"query"`
		}
		c.Bind().JSON(&body)

		var dbHistory []models.ChatHistory
		DB.Where("user_id = ?", body.UserID).Order("created_at desc").Limit(6).Find(&dbHistory)

		var brainHistory []models.HistoryMessage
		for i := len(dbHistory) - 1; i >= 0; i-- {
			brainHistory = append(brainHistory, models.HistoryMessage{
				Role: dbHistory[i].Role,
				Text: dbHistory[i].Text,
			})
		}

		brainPayload := models.BrainRequest{
			UserID:  body.UserID,
			Query:   body.Query,
			History: brainHistory,
		}

		DB.Create(&models.ChatHistory{UserID: body.UserID, Role: "user", Text: body.Query})

		jsonPayload, _ := json.Marshal(brainPayload)
		resp, err := http.Post(brainServiceURL, "application/json", bytes.NewBuffer(jsonPayload))
		if err != nil {
			return c.Status(502).JSON(fiber.Map{"error": "Brain Offline"})
		}
		defer resp.Body.Close()

		var brainRes struct {
			Message string                 `json:"message"`
			Action  string                 `json:"action"`
			Data    map[string]interface{} `json:"data"`
		}
		json.NewDecoder(resp.Body).Decode(&brainRes)

		if brainRes.Action == "execute_create_social_draft" {
			draft := models.SocialPost{
				Content:  brainRes.Data["content"].(string),
				Platform: brainRes.Data["platform"].(string),
				Status:   "draft",
			}
			DB.Create(&draft)
			brainRes.Message = fmt.Sprintf("I've saved your %s draft: \"%s\"", draft.Platform, draft.Content)
			brainRes.Action = "view_social"
		}

		if brainRes.Action == "execute_record_expense" {
			amount := brainRes.Data["amount"].(float64)
			expense := models.FinanceRecord{
				Amount:      amount,
				Category:    brainRes.Data["category"].(string),
				Description: brainRes.Data["description"].(string),
			}
			DB.Create(&expense)
			brainRes.Message = fmt.Sprintf("Recorded expense of $%.2f for %s.", amount, expense.Category)
			brainRes.Action = "view_finance"
		}

		if brainRes.Action == "execute_create_task" {
			task := models.TaskRecord{
				Title:  brainRes.Data["title"].(string),
				Status: "Pending",
			}
			DB.Create(&task)
			brainRes.Message = "Task added: " + task.Title
			brainRes.Action = "view_task"
		}

		if brainRes.Action == "execute_track_job_application" {
			job := models.JobApplication{
				Company:     brainRes.Data["company"].(string),
				Role:        brainRes.Data["role"].(string),
				Status:      brainRes.Data["status"].(string),
				Link:        brainRes.Data["link"].(string),
				SalaryRange: brainRes.Data["salary_range"].(string),
			}
			if job.SalaryRange == "" { job.SalaryRange = "Not specified" }
			
			DB.Create(&job)
			brainRes.Message = fmt.Sprintf("Logged your application for %s at %s.", job.Role, job.Company)
			brainRes.Action = "view_jobs"
		}

		DB.Create(&models.ChatHistory{UserID: body.UserID, Role: "serqet", Text: brainRes.Message})

		return c.JSON(brainRes)
	})

	app.Get("/api/v1/history", func(c fiber.Ctx) error {
		var history []models.ChatHistory
		DB.Order("created_at asc").Limit(20).Find(&history)
		return c.JSON(history)
	})

	app.Get("/api/v1/social/posts", func(c fiber.Ctx) error {
		var drafts []models.SocialPost
		DB.Order("created_at desc").Find(&drafts)
		return c.JSON(drafts)
	})

	app.Get("/api/v1/finance/summary", func(c fiber.Ctx) error {
		var records []models.FinanceRecord
		DB.Find(&records)

		var total float64
		for _, r := range records {
			total += r.Amount
		}

		return c.JSON(fiber.Map{
			"total_expenses": total,
			"recent_records": records,
		})
	})

	app.Get("/api/v1/tasks", func(c fiber.Ctx) error {
		var tasks []models.TaskRecord
		if err := DB.Order("status desc, created_at desc").Find(&tasks).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Could not fetch tasks"})
		}
		return c.JSON(tasks)
	})

	app.Get("/api/v1/jobs", func(c fiber.Ctx) error {
		var jobs []models.JobApplication
		DB.Order("created_at desc").Find(&jobs)
		return c.JSON(jobs)
	})

	log.Fatal(app.Listen(":8001"))
}
