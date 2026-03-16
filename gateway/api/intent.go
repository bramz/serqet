package api

import (
	"gateway/db"
	"gateway/models"
	"gateway/services"
	"github.com/gofiber/fiber/v3"
)

func HandleIntent(c fiber.Ctx) error {
	var body struct {
		UserID    string `json:"user_id"`
		SessionID string `json:"session_id"` // NEW: Track which session this belongs to
		Query     string `json:"query"`
	}
	c.Bind().JSON(&body)

	// Default session if none provided
	if body.SessionID == "" { body.SessionID = "default" }

	// 1. Fetch History filtered by Session
	var history []models.ChatHistory
	db.Instance.Where("session_id = ?", body.SessionID).Order("created_at desc").Limit(5).Find(&history)

	// 2. Log System Activity
	services.EmitEvent("KERNEL", "Processing intent for session: "+body.SessionID, "INFO")

	// 3. Request Brain Intent
	brainRes, err := services.RequestIntent(body.UserID, body.Query, history)
	if err != nil {
		services.EmitEvent("BRAIN", "Neural Link timeout or failure", "ERROR")
		return c.Status(502).JSON(fiber.Map{"error": "Brain offline"})
	}

	// 4. Save User Input to Persistent History
	db.Instance.Create(&models.ChatHistory{
		UserID:    body.UserID, 
		SessionID: body.SessionID, 
		Role:      "user", 
		Text:      body.Query,
	})

	// 5. Tool Execution Logic
	if brainRes.Action != "" {
		services.EmitEvent("EXECUTOR", "Initializing tool: "+brainRes.Action, "INFO")
		
		msg, action := services.ExecuteToolCall(brainRes.Action, brainRes.Data)
		if msg != "" {
			brainRes.Message = msg
			brainRes.Action = action
			services.EmitEvent("EXECUTOR", "Tool execution successful: "+action, "SUCCESS")
		}
	}

	// 6. Save AI Response to Persistent History
	db.Instance.Create(&models.ChatHistory{
		UserID:    body.UserID, 
		SessionID: body.SessionID, 
		Role:      "serqet", 
		Text:      brainRes.Message,
	})

	return c.JSON(brainRes)
}