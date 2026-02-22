package models

type ChatHistory struct {
	Base
	UserID string `json:"user_id"`
	Role   string `json:"role"` // "user" or "serqet"
	Text   string `json:"text"`
}
