package models

import "time"

type TaskRecord struct {
	Base
	Title     string    `json:"title"`
	Status    string    `json:"status"` // "pending", "done"
	DueDate   time.Time `json:"due_date"`
}
