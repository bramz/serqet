package api

import (
	"gateway/db"
	"gateway/models"
	"github.com/gofiber/fiber/v3"
)

func GetPendingActions(c fiber.Ctx) error {
	var actions []models.PendingAction
	db.Instance.Where("status = ?", "Pending").Order("created_at desc").Find(&actions)
	return c.JSON(actions)
}

func GetAllActions(c fiber.Ctx) error {
	var actions []models.PendingAction
	db.Instance.Order("created_at desc").Find(&actions)
	return c.JSON(actions)
}