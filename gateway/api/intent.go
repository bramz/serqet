package api

import (
	"gateway/db"
	"gateway/models"
	"gateway/services"
	"log"

	"github.com/gofiber/fiber/v3"
)

func HandleIntent(c fiber.Ctx) error {
	var body struct {
		UserID    string `json:"user_id"`
		SessionID string `json:"session_id"`
		Query     string `json:"query"`
		FilePath  string `json:"file_path,omitempty"`
		WebURL    string `json:"web_url"`
	}
	if err := c.Bind().JSON(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
	}
	if body.Query == "" {
		return c.Status(400).JSON(fiber.Map{"error": "query is required"})
	}
	if body.SessionID == "" {
		body.SessionID = "default"
	}
	if body.UserID == "" {
		body.UserID = "user"
	}

	var history []models.ChatHistory
	db.Instance.Where("session_id = ?", body.SessionID).
		Order("created_at desc").Limit(5).Find(&history)

	services.EmitEvent("BRAIN", "Processing: "+body.SessionID, "INFO")

	brainRes, err := services.RequestIntent(
		body.UserID, body.SessionID, body.Query, body.FilePath, history,
	)
	if err != nil {
		services.EmitEvent("BRAIN", "Neural Link failure", "ERROR")
		return c.Status(502).JSON(fiber.Map{"error": "Brain offline"})
	}

	// Persist user message
	db.Instance.Create(&models.ChatHistory{
		UserID:    body.UserID,
		SessionID: body.SessionID,
		Role:      "user",
		Text:      body.Query,
		FilePath:  body.WebURL,
	})

	if brainRes.Action != "" {
		log.Printf("[EXECUTOR] Action=%s", brainRes.Action)
		services.EmitEvent("EXECUTOR", "Tool: "+brainRes.Action, "INFO")
		msg, nav := services.ExecuteToolCall(brainRes.Action, brainRes.Data)

		if msg != "" {
			brainRes.Message = msg
			brainRes.Action = nav
			services.EmitEvent("EXECUTOR", "Success: "+nav, "SUCCESS")
		} else {
			log.Printf("[EXECUTOR] Empty result for action: %s", brainRes.Action)
		}
	}

	// Persist agent response
	db.Instance.Create(&models.ChatHistory{
		UserID:    body.UserID,
		SessionID: body.SessionID,
		Role:      "serqet",
		Text:      brainRes.Message,
		FilePath:  body.WebURL,
		AudioURL:  brainRes.AudioURL,
	})

	return c.JSON(brainRes)
}
