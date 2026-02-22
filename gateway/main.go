package main

import (
	"gateway/api"
	"gateway/db"
	"log"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

func main() {
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

	log.Fatal(app.Listen(":8001"))
}