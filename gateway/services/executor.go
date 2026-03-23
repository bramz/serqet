package services

import (
	"fmt"
	"gateway/db"
	"gateway/models"
	"gateway/utils"
	"log"
	"strconv"
	// "time"
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

		// case "execute_get_market_analysis":
		// 	pair := utils.SafeString(data, "pair")
		// 	if pair == "" { pair = "XXBTZUSD" }

		// 	candles, err := FetchMarketCandles(pair)
		// 	if err != nil {
		// 		return "Error fetching market data", "", nil
		// 	}

		// 	return "Market data retrieved", "view_finance", candles
			
		case "execute_generate_trading_signal":
			log.Printf("[TRADER] AI generated signal: %v for %v", data["signal_action"], data["asset"])
			
			signal := models.TradingSignal{
				Asset:      utils.SafeString(data, "asset"),
				Action:     utils.SafeString(data, "signal_action"), // BUY/SELL/HOLD
				Price:      utils.ParseNumeric(data["price"]),
				Reasoning:  utils.SafeString(data, "reasoning"),
				Confidence: utils.ParseNumeric(data["confidence"]),
				Status:     "Pending",
			}
			
			if err := db.Instance.Create(&signal).Error; err != nil {
				log.Printf("[DB ERROR] %v", err)
				return "Internal DB Error", ""
			}
			
			return fmt.Sprintf("Signal Archived: %s %s", signal.Action, signal.Asset), "view_finance"
	
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

		case "execute_record_income":
			income := models.FinanceRecord{
				Amount:      utils.ParseNumeric(data["amount"]),
				Category:    utils.SafeString(data, "category"),
				Description: utils.SafeString(data, "description"),
				Type:        "income",
			}
			db.Instance.Create(&income)
			return fmt.Sprintf("Cash inflow of $%.2f recorded.", income.Amount), "view_finance"

		case "execute_launch_venture", "execute_db_launch_venture":
			log.Println("--- DEBUG: VENTURE EXECUTION STARTED ---")
			
			// Log the raw data map to see what Python sent
			log.Printf("RAW DATA FROM PYTHON: %+v", data)

			venture := models.VentureCampaign{
				Name:            utils.SafeString(data, "name"),
				Category:        utils.SafeString(data, "category"),
				StrategySummary: utils.SafeString(data, "strategy"), // Check if Python sends 'strategy' or 'strategy_summary'
				ProjectedROI:    utils.SafeString(data, "projected_roi"),
				Platform:        utils.SafeString(data, "platform"),
				Status:          "Active",
				RevenueEarned:   0.0,
			}

			log.Printf("MAPPED STRUCT: %+v", venture)

			// Check for DB errors explicitly
			result := db.Instance.Create(&venture)
			if result.Error != nil {
				log.Printf("!!! DATABASE ERROR: %v", result.Error)
				return "Internal DB Error", ""
			}

			log.Printf("SUCCESS: Venture saved with ID: %d", venture.ID)
			return fmt.Sprintf("Venture '%s' initialized.", venture.Name), "view_finance"

		case "execute_record_savings":
			// This is used for recording profit from a venture
			amount := utils.ParseNumeric(data["amount"])
			description := utils.SafeString(data, "description")
			
			// 1. Log to generic finance ledger
			income := models.FinanceRecord{
				Amount:      amount,
				Category:    "Venture Profit",
				Description: description,
				Type:        "income",
			}
			db.Instance.Create(&income)

			// 2. Logic to attribute to a specific venture (if found in description)
			// In a lifetime OS, we search for the venture name in the description
			var v models.VentureCampaign
			db.Instance.Where("name ILIKE ?", "%"+description+"%").First(&v)
			if v.ID != 0 {
				db.Instance.Model(&v).Update("revenue_earned", v.RevenueEarned + amount)
			}

			return fmt.Sprintf("Profit of $%.2f realized and indexed.", amount), "view_finance"
		}

	return "", ""
}
