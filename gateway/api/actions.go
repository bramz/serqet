package api

import (
	"gateway/db"
	"gateway/models"
	"gateway/services"
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

func DeployAction(c fiber.Ctx) error {
	id := c.Params("id")
	
	var action models.PendingAction
	if err := db.Instance.First(&action, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Action not found"})
	}

	// Eventually call a real API 
	// (e.g., SendGrid for Email, Twitter API for Social)
	// For now, update the status.
	db.Instance.Model(&action).Update("status", "Executed")

	services.EmitEvent("BRAIN", "Action Deployed: "+action.Title, "SUCCESS")

	return c.JSON(fiber.Map{
		"status": "Executed",
		"message": "Deployment successful.",
	})
}