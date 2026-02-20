package models

import (
	"time"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type HistoryMessage struct {
	Role string `json:"role"`
	Text string `json:"text"`
}

type BrainRequest struct {
	UserID  string           `json:"user_id"`
	Query   string           `json:"query"`
	History []HistoryMessage `json:"history"`
}

type Module struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Endpoint    string `json:"endpoint"`
}

type IntentRequest struct {
	UserID string `json:"user_id"`
	Query  string `json:"query"`
}

type IntentResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
	Action  string `json:"action,omitempty"`
	Data    any    `json:"data,omitempty"`
}

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

type SocialPost struct {
	Base
	Content  string `json:"content"`
	Platform string `json:"platform"` // "x", "linkedin", "instagram"
	Status   string `json:"status"`   // "draft", "scheduled", "posted"
}