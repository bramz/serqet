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
	}
	c.Bind().JSON(&body)

	if body.SessionID == "" { body.SessionID = "default" }

	var history []models.ChatHistory
	db.Instance.Where("session_id = ?", body.SessionID).Order("created_at desc").Limit(5).Find(&history)

	services.EmitEvent("BRAIN", "Processing intent for session: "+body.SessionID, "INFO")

	brainRes, err := services.RequestIntent(body.UserID, body.Query, body.FilePath, history)
	if err != nil {
		services.EmitEvent("BRAIN", "Neural Link timeout or failure", "ERROR")
		return c.Status(502).JSON(fiber.Map{"error": "Brain offline"})
	}

	log.Printf("BRAIN RESPONSE: Action=%s | Data=%+v", brainRes.Action, brainRes.Data)

	if brainRes.Action != "" {
		msg, action := services.ExecuteToolCall(brainRes.Action, brainRes.Data)
		if msg != "" {
			brainRes.Message = msg
			brainRes.Action = action
		} else {
			log.Println("WARNING: Executor returned empty message for action:", brainRes.Action)
		}
	}
	db.Instance.Create(&models.ChatHistory{
		UserID:    body.UserID, 
		SessionID: body.SessionID, 
		Role:      "user", 
		Text:      body.Query,
		FilePath:  body.FilePath,
	})

	if brainRes.Action != "" {
		services.EmitEvent("EXECUTOR", "Initializing tool: "+brainRes.Action, "INFO")
		
		msg, action := services.ExecuteToolCall(brainRes.Action, brainRes.Data)
		if msg != "" {
			brainRes.Message = msg
			brainRes.Action = action
			services.EmitEvent("EXECUTOR", "Tool execution successful: "+action, "SUCCESS")
		}
	}

	db.Instance.Create(&models.ChatHistory{
		UserID:    body.UserID, 
		SessionID: body.SessionID, 
		Role:      "serqet", 
		Text:      brainRes.Message,
		FilePath:  body.FilePath,
	})

	return c.JSON(brainRes)
}