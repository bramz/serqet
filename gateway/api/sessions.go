package api

import (
	"gateway/db"
	"gateway/models"
	"github.com/google/uuid"
	"github.com/gofiber/fiber/v3"
)

func GetSessions(c fiber.Ctx) error {
	var sessions []models.ChatSession
	db.Instance.Order("updated_at desc").Find(&sessions)
	return c.JSON(sessions)
}

func CreateSession(c fiber.Ctx) error {
	session := models.ChatSession{
		SessionID: uuid.New().String(),
		Title:     "New Intelligence Session",
		UserID:    "wired",
	}
	db.Instance.Create(&session)
	return c.JSON(session)
}

func GetSessionHistory(c fiber.Ctx) error {
	sessionID := c.Params("session_id")
	var history []models.ChatHistory
	// Important: order by created_at ASC so chat reads top-to-bottom
	db.Instance.Where("session_id = ?", sessionID).Order("created_at asc").Find(&history)
	return c.JSON(history)
}

func DeleteSession(c fiber.Ctx) error {
	sessionID := c.Params("session_id")

	db.Instance.Where("session_id = ?", sessionID).Delete(&models.ChatHistory{})
	
	result := db.Instance.Where("session_id = ?", sessionID).Delete(&models.ChatSession{})
	
	if result.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Session not found"})
	}

	return c.JSON(fiber.Map{"status": "deleted"})
}

func UpdateSessionTitle(c fiber.Ctx) error {
	sessionID := c.Params("session_id")
	var body struct {
		Title string `json:"title"`
	}

	if err := c.Bind().JSON(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	result := db.Instance.Model(&models.ChatSession{}).
		Where("session_id = ?", sessionID).
		Update("title", body.Title)

	if result.RowsAffected == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Session not found"})
	}

	return c.JSON(fiber.Map{"status": "updated", "title": body.Title})
}