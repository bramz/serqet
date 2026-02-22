package api

import (
	"gateway/db"
	"gateway/models"
	"github.com/gofiber/fiber/v3"
)

func GetHistory(c fiber.Ctx) error {
	var history []models.ChatHistory
	db.Instance.Order("created_at asc").Limit(20).Find(&history)
	return c.JSON(history)
}