package main

import (
	"gateway/api"
	"gateway/db"
	"gateway/services"
	"log"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/static"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Could not load .env file:", err)
	}

	if err := db.Connect(); err != nil {
		log.Fatal(err)
	}

	go services.StartAutonomousAnalyst() 

	app := fiber.New()
	app.Use(cors.New())
	app.Get("/uploads/*", static.New("./uploads"))


	v1 := app.Group("/api/v1")
		
	// sessions
	v1.Get("/sessions", api.GetSessions)
	v1.Post("/sessions", api.CreateSession)
	v1.Patch("/sessions/:session_id", api.UpdateSessionTitle)
	v1.Delete("/sessions/:session_id", api.DeleteSession)
	v1.Get("/history/:session_id", api.GetSessionHistory)

	
	v1.Get("/overview", api.GetOverviewSnapshot)
	v1.Post("/intent", api.HandleIntent)
	v1.Get("/modules", api.GetModules) 
	v1.Get("/history", api.GetHistory)
	v1.Get("/social/posts", api.GetSocialPosts)
	v1.Get("/tasks", api.GetTasks)
    v1.Get("/jobs", api.GetJobs)

	// Finance
	
    v1.Get("/finance/summary", api.GetFinanceSummary)
	v1.Get("/finance/ventures", api.GetVentures)
	v1.Get("/finance/holdings", api.GetCryptoHoldings)
	v1.Get("/finance/sync", api.SyncHoldings)
	v1.Get("/finance/signals", api.GetSignals)
	v1.Patch("/finance/signals/:id", api.UpdateSignalStatus)
	v1.Get("/finance/ohlc", api.GetOHLCData)

	// health
	v1.Get("/health/stats", api.GetHealthStats)

	// research
	v1.Get("/research", api.GetResearch)

	// uploads
	v1.Post("/upload", api.UploadHandler)


	log.Fatal(app.Listen(":8001"))
}