package services

import (
	"fmt"
	"gateway/db"
	"gateway/models"
	"log"
	"strconv"
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

		case "execute_sync_portfolio":
			balances, err := FetchKrakenBalances()
			if err != nil {
				log.Printf("Kraken Sync Failed: %v", err)
				return fmt.Sprintf("Failed to sync with Kraken. Error: %v", err), ""
			}

			count := 0
			for asset, val := range balances {
				amount, err := strconv.ParseFloat(val, 64)
				if err != nil {
					continue
				}
				if amount > 0 {
					// Update local DB
					db.Instance.Where(models.CryptoHoldings{Asset: asset}).
						Assign(models.CryptoHoldings{Balance: amount}).
						FirstOrCreate(&models.CryptoHoldings{})
					count++
				}
			}

			return fmt.Sprintf("Successfully synchronized %d assets from Kraken.", count), "view_finance"


		case "execute_save_trading_signal":
			signal := models.TradingSignals{
				Asset:     data["asset"].(string),
				Action:    data["action"].(string),
				Price:     data["price"].(float64),
				Reasoning: data["reasoning"].(string),
				Confidence: data["confidence"].(float64),
				Status:    "Pending",
			}
			db.Instance.Create(&signal)
			return fmt.Sprintf("Serqet AI has generated a %s signal for %s.", signal.Action, signal.Asset), "view_finance"

		case "execute_web_research":
			log.Printf("Saving research for query: %s", data["query"])
			
			report := models.ResearchReports{
				Query: data["query"].(string),
				Findings: data["findings"].(string),
				Category: "Web Intelligence",
			}
			
			result := db.Instance.Create(&report)
			if result.Error != nil {
				log.Printf("Research save failed: %v", result.Error)
				return "Search completed, but I couldn't save the report to the database.", ""
			}

			return fmt.Sprintf("I've finished researching '%s'. The report is ready in your Research Hub.", report.Query), "view_research"
						
			
		// case "execute_crypto_trade":
		// 	pair := getString(data, "pair")
		// 	side := getString(data, "side")
		// 	volume := getFloat(data, "volume")

		// 	log.Printf("[TRADER] AI requesting %s of %v on %s", side, volume, pair)

		// 	// 1. Logic to call Kraken's /0/private/AddOrder
		// 	// 2. Log the trade to our DB
		// 	trade := models.TradeLog{
		// 		Pair:   pair,
		// 		Side:   side,
		// 		Amount: volume,
		// 		Status: "Executed",
		// 	}
		// 	db.Instance.Create(&trade)

		// 	return fmt.Sprintf("AI successfully executed a %s order for %v %s.", side, volume, pair), "view_finance"
	}

	return "", ""
}