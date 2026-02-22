package api

import (
	"gateway/db"
	"gateway/models"
	"gateway/services"
	"github.com/gofiber/fiber/v3"
)

func HandleIntent(c fiber.Ctx) error {
	var body struct {
		UserID string `json:"user_id"`
		Query  string `json:"query"`
	}
	c.Bind().JSON(&body)

	var history []models.ChatHistory
	db.Instance.Where("user_id = ?", body.UserID).Order("created_at desc").Limit(5).Find(&history)

	brainRes, err := services.RequestIntent(body.UserID, body.Query, history)
	if err != nil {
		return c.Status(502).JSON(fiber.Map{"error": "Brain offline"})
	}

	db.Instance.Create(&models.ChatHistory{UserID: body.UserID, Role: "user", Text: body.Query})

	if brainRes.Action != "" {
		msg, action := services.ExecuteToolCall(brainRes.Action, brainRes.Data)
		if msg != "" {
			brainRes.Message = msg
			brainRes.Action = action
		}
	}

	db.Instance.Create(&models.ChatHistory{UserID: body.UserID, Role: "serqet", Text: brainRes.Message})

	return c.JSON(brainRes)
}