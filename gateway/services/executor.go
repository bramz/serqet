package services

import (
	"fmt"
	"gateway/db"
	"gateway/models"
	"gateway/utils"
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


		case "execute_get_market_analysis":
			pair := utils.SafeString(data, "pair")
			if pair == "" { pair = "XXBTZUSD" }
			
			candles, err := FetchMarketCandles(pair)
			if err != nil {
				return "Error fetching market data from Kraken.", ""
			}

			fmt.Printf("candles: %+v\n", candles)
			return "", "" // Logic in intent.go should pass this data back to brain

		case "execute_generate_trading_signal":
			signal := models.TradingSignal{
				Asset:      utils.SafeString(data, "asset"),
				Action:     utils.SafeString(data, "signal_action"),
				Price:      utils.ParseNumeric(data["price"]),
				Reasoning:  utils.SafeString(data, "reasoning"),
				Confidence: utils.ParseNumeric(data["confidence"]),
				Status:     "Pending",
			}
			
			if err := db.Instance.Create(&signal).Error; err != nil {
				return "Error saving signal.", ""
			}
			
			return fmt.Sprintf("New %s signal generated for %s.", signal.Action, signal.Asset), "view_finance"
   
		case "execute_web_research":
			q := utils.SafeString(data, "query")
			f := utils.SafeString(data, "findings")

			log.Printf("[DEBUG] Research Data Recv -> Query: %s | Findings Len: %d", q, len(f))

			if f == "" {
				f = "Analysis completed, but no usable data was synthesized by the agent."
			}

			report := models.ResearchReports{
				Query:    q,
				Findings: f,
				Category: "System Research",
			}
			
			if err := db.Instance.Create(&report).Error; err != nil {
				log.Printf("[DATABASE ERROR]: %v", err)
				return "Internal DB Error", ""
			}

			return fmt.Sprintf("Intelligence Report for '%s' has been synthesized and archived.", q), "view_research"

		case "execute_launch_campaign":
			campaign := models.RevenueCampaign{
				Name: data["name"].(string),
				Strategy: data["strategy"].(string),
				Platform: data["platform"].(string),
				Budget: data["budget"].(float64),
				Status: "Active",
			}

			
			if err := db.Instance.Create(&campaign).Error; err != nil {
				return "Failed to initialize campaign registry.", ""
			}

			// Log the event for the Sidebar/Overview logs
			EmitEvent("REVENUE", "Launched campaign: " + campaign.Name, "SUCCESS")
			
			return fmt.Sprintf("Revenue agent successfully initialized the '%s' campaign. Scaling protocols active.", campaign.Name), "view_revenue"

		case "execute_db_launch_venture":
			venture := models.VentureCampaign{
				Name:            utils.SafeString(data, "name"),
				Category:        utils.SafeString(data, "category"),
				StrategySummary: utils.SafeString(data, "strategy"),
				ProjectedROI:    utils.SafeString(data, "projected_roi"),
				Platform:        utils.SafeString(data, "platform"),
				Status:          "Incubating",
			}
			db.Instance.Create(&venture)
			EmitEvent("REVENUE", "New Venture Incubated: "+venture.Name, "SUCCESS")
			// Note: We return view_finance now instead of view_revenue
			return fmt.Sprintf("Venture '%s' initialized in the Finance Hub.", venture.Name), "view_finance"

		case "execute_record_income":
			income := models.FinanceRecord{
				Amount:      utils.ParseNumeric(data["amount"]),
				Category:    utils.SafeString(data, "category"),
				Description: utils.SafeString(data, "description"),
				Type:        "income",
			}
			db.Instance.Create(&income)
			return fmt.Sprintf("Cash inflow of $%.2f recorded.", income.Amount), "view_finance"
		}

	return "", ""
}