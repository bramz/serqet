package models

type JobApplication struct {
	Base
	Company      string `json:"company"`
	Role         string `json:"role"`
	Status       string `json:"status"` // "applied", "interviewing", "offer", "rejected", "noresp"
	Link         string `json:"link"`
	SalaryRange  string `json:"salary_range"`
}
