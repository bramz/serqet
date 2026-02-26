package main

import (
	"gateway/api"
	"gateway/db"
	"log"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Could not load .env file:", err)
	}

	if err := db.Connect(); err != nil {
		log.Fatal(err)
	}

	app := fiber.New()
	app.Use(cors.New())

	v1 := app.Group("/api/v1")
	v1.Post("/intent", api.HandleIntent)
	v1.Get("/modules", api.GetModules) 
	v1.Get("/history", api.GetHistory)
	v1.Get("/social/posts", api.GetSocialPosts)
	v1.Get("/tasks", api.GetTasks)
    v1.Get("/jobs", api.GetJobs)
    v1.Get("/finance/summary", api.GetFinanceSummary)
	v1.Get("/finance/holdings", api.GetCryptoHoldings)
	v1.Get("/finance/sync", api.SyncHoldings)
	v1.Get("/health/stats", api.GetHealthStats)

	log.Fatal(app.Listen(":8001"))
}