package services

import (
	"fmt"
	"gateway/db"
	"gateway/models"
	"log"
)


func ExecuteToolCall(action string, data map[string]interface{}) (string, string) {
	log.Printf("Executing action: %s with data: %+v\n", action, data)
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

		case "execute_record_meal":
			meal := models.DietRecord{
				FoodItem: data["food_item"].(string),
				Calories: int(data["calories"].(float64)),
				Protein:  int(data["protein"].(float64)),
				Carbs:    int(data["carbs"].(float64)),
				Fats:     int(data["fats"].(float64)),
			}
			
			db.Instance.Create(&meal)
			return fmt.Sprintf("Logged %s (%d kcal).", meal.FoodItem, meal.Calories), "view_health"

		case "execute_record_workout":
			workout := models.WorkoutRecord{
				Exercise:     data["exercise"].(string),
				Sets:         int(data["sets"].(float64)),
				Reps:         int(data["reps"].(float64)),
				Weight:       int(data["weight"].(float64)),
				DurationMins: int(data["duration"].(float64)),
			}
			db.Instance.Create(&workout)
			return fmt.Sprintf("Workout recorded: %s.", workout.Exercise), "view_health"
	}

	return "", ""
}