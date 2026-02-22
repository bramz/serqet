package models

import "time"
import "github.com/google/uuid"
import "gorm.io/gorm"


type Base struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

type HistoryMessage struct {
	Role string `json:"role"`
	Text string `json:"text"`
}

type BrainRequest struct {
	UserID  string           `json:"user_id"`
	Query   string           `json:"query"`
	History []HistoryMessage `json:"history"`
}

func (base *Base) BeforeCreate(tx *gorm.DB) error {
	base.ID = uuid.New()
	return nil
}
