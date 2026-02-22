package models

type SocialPost struct {
	Base
	Content  string `json:"content"`
	Platform string `json:"platform"` // "x", "linkedin", "instagram"
	Status   string `json:"status"`   // "draft", "scheduled", "posted"
}
