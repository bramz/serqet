package api

import (
	"gateway/models"
	"github.com/gofiber/fiber/v3"
)

var activeModules = []models.Module{
	{ID: "social", Name: "Social Media", Description: "Manage social presence.", Icon: "social"},
	{ID: "finance", Name: "Finances", Description: "Track income and expenses.", Icon: "finance"},
	{ID: "task", Name: "Task", Description: "Organize to-dos.", Icon: "task"},
	{ID: "jobs", Name: "Jobs", Description: "Track job applications.", Icon: "jobs"},
}

func GetModules(c fiber.Ctx) error {
	return c.JSON(activeModules)
}