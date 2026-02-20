package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	// "time"

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
		{ID: "tasks", Name: "Tasks", Description: "Organize your to-dos.", Icon: "tasks"},
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
	DB.AutoMigrate(&models.ChatHistory{}, &models.FinanceRecord{}, &models.TaskRecord{})
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
		resp, err := http.Post("http://localhost:8000/brain/v1/process_intent", "application/json", bytes.NewBuffer(jsonPayload))
		if err != nil {
			return c.Status(502).JSON(fiber.Map{"error": "Brain Offline"})
		}
		defer resp.Body.Close()

		var brainRes struct {
			Message string `json:"message"`
			Action  string `json:"action"`
		}
		json.NewDecoder(resp.Body).Decode(&brainRes)

		DB.Create(&models.ChatHistory{UserID: body.UserID, Role: "serqet", Text: brainRes.Message})

		return c.JSON(brainRes)
	})

	app.Get("/api/v1/history", func(c fiber.Ctx) error {
		var history []models.ChatHistory
		DB.Order("created_at asc").Limit(20).Find(&history)
		return c.JSON(history)
	})

	log.Fatal(app.Listen(":8001"))
}