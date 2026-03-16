package services

import (
	"gateway/db"
	"gateway/models"
)

func EmitEvent(source, message, level string) {
	event := models.SystemEvent{
		Source:  source,
		Message: message,
		Level:   level,
	}
	db.Instance.Create(&event)
}