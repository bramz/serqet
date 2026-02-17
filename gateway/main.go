package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
)

type Module struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Endpoint    string `json:"endpoint"`
}

type IntentRequest struct {
	UserID string `json:"user_id"`
	Query  string `json:"query"`
}

type IntentResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Action  string `json:"action,omitempty"`
	Data    any    `json:"data,omitempty"`
}

var (
	activeModules = []Module{
		{ID: "social", Name: "Social Media", Description: "Manage your social presence.", Icon: "social"},
		{ID: "finance", Name: "Finances", Description: "Track income and expenses.", Icon: "finance"},
	}
	brainServiceURL = "http://localhost:8000/brain/v1/process_intent"
)

func main() {
	app := fiber.New(fiber.Config{
		AppName: "Serqet OS Gateway (Go 1.26)",
	})

	app.Use(cors.New())

	app.Get("/api/v1/modules", func(c fiber.Ctx) error {
		return c.JSON(activeModules)
	})

	app.Post("/api/v1/intent", func(c fiber.Ctx) error {
		var req IntentRequest
		
		if err := c.Bind().JSON(&req); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid JSON"})
		}

		log.Printf("Forwarding to Brain: %s", req.Query)

		brainReqBody, _ := json.Marshal(req)
		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Post(brainServiceURL, "application/json", bytes.NewBuffer(brainReqBody))
		
		if err != nil {
			return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{"error": "Brain unreachable"})
		}
		defer resp.Body.Close()

		var brainResponse IntentResponse
		json.NewDecoder(resp.Body).Decode(&brainResponse)

		return c.JSON(brainResponse)
	})

	log.Fatal(app.Listen(":8001"))
}