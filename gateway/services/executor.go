package services

import (
	"fmt"
	"gateway/db"
	"gateway/models"
)

// ExecuteToolCall handles the logic for various AI tools
func ExecuteToolCall(action string, data map[string]interface{}) (string, string) {
	switch action {
	case "execute_record_expense":
		expense := models.FinanceRecord{
			Amount:      data["amount"].(float64),
			Category:    data["category"].(string),
			Description: data["description"].(string),
		}
		db.Instance.Create(&expense)
		return fmt.Sprintf("Recorded $%.2f in %s.", expense.Amount, expense.Category), "view_finance"

	case "execute_create_social_draft":
		post := models.SocialPost{
			Content:  data["content"].(string),
			Platform: data["platform"].(string),
			Status:   "draft",
		}
		db.Instance.Create(&post)
		return "Draft saved to Social Hub.", "view_social"

	case "execute_create_task":
		task := models.TaskRecord{
			Title:  data["title"].(string),
			Status: "Pending",
		}
		db.Instance.Create(&task)
		return "Task created.", "view_tasks"

	case "execute_track_job_application":
		job := models.JobApplication{
			Company: data["company"].(string),
			Role:    data["role"].(string),
			Status:  "Applied",
		}
		db.Instance.Create(&job)
		return "Job application tracked.", "view_jobs"
	}

	return "", ""
}