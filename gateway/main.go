package main

import (
	"gateway/api"
	"gateway/db"
	"gateway/services"
	"log"
	"os"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/static"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("[CONFIG] No .env file found — using environment variables")
	}

	if err := db.Connect(); err != nil {
		log.Fatal("[DB] Fatal:", err)
	}

	go services.StartBrainHeartbeat()

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c fiber.Ctx, err error) error {
			log.Printf("[HTTP ERROR] %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "internal server error"})
		},
	})

	app.Use(cors.New())
	app.Get("/uploads/*", static.New("./uploads"))

	v1 := app.Group("/api/v1")

	// Sessions
	v1.Get("/sessions", api.GetSessions)
	v1.Post("/sessions", api.CreateSession)
	v1.Patch("/sessions/:session_id", api.UpdateSessionTitle)
	v1.Delete("/sessions/:session_id", api.DeleteSession)
	v1.Get("/history/:session_id", api.GetSessionHistory)

	// Agents
	v1.Get("/agents", api.GetAgents)
	v1.Patch("/agents/:slug", api.UpdateAgentPrompt)

	// Core
	v1.Get("/overview", api.GetOverviewSnapshot)
	v1.Post("/intent", api.HandleIntent)
	v1.Get("/modules", api.GetModules)
	v1.Get("/history", api.GetHistory)
	v1.Post("/upload", api.UploadHandler)

	// Modules
	v1.Get("/social/posts", api.GetSocialPosts)
	v1.Get("/tasks", api.GetTasks)
	v1.Get("/jobs", api.GetJobs)
	v1.Get("/research", api.GetResearch)
	v1.Get("/health/stats", api.GetHealthStats)
	v1.Get("/actions", api.GetAllActions)
	v1.Get("/actions/pending", api.GetPendingActions)

	// Finance
	v1.Get("/finance/summary", api.GetFinanceSummary)
	v1.Get("/finance/ventures", api.GetVentures)
	v1.Get("/finance/holdings", api.GetCryptoHoldings)
	v1.Get("/finance/sync", api.SyncHoldings)
	v1.Get("/finance/signals", api.GetSignals)
	v1.Patch("/finance/signals/:id", api.UpdateSignalStatus)
	v1.Get("/finance/ohlc", api.GetOHLCData)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8001"
	}
	log.Fatal(app.Listen(":" + port))
}
