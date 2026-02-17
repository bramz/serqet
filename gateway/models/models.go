package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Base struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;"`
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (base *Base) BeforeCreate(tx *gorm.DB) error {
	base.ID = uuid.New()
	return nil
}

type ChatHistory struct {
	Base
	UserID string `json:"user_id"`
	Role   string `json:"role"` // "user" or "serqet"
	Text   string `json:"text"`
}

type FinanceRecord struct {
	Base
	Amount      float64 `json:"amount"`
	Category    string  `json:"category"`
	Description string  `json:"description"`
}

type TaskRecord struct {
	Base
	Title     string    `json:"title"`
	Status    string    `json:"status"` // "pending", "done"
	DueDate   time.Time `json:"due_date"`
}