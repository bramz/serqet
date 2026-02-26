package services

import (
	"gateway/db"
	"gateway/models"
	"log"
	"strconv"
	"time"
)

// StartBackgroundWorker runs tasks periodically
func StartBackgroundWorker() {
	// Update Kraken every 60 minutes
	ticker := time.NewTicker(60 * time.Minute)

	go func() {
		for range ticker.C {
			log.Println("[WORKER] Starting automated Kraken sync...")
			balances, err := FetchKrakenBalances()
			if err != nil {
				log.Printf("[WORKER ERROR] Kraken sync failed: %v", err)
				continue
			}

			for asset, val := range balances {
				amountFloat, err := strconv.ParseFloat(val, 64)
				if err == nil && amountFloat > 0 {
					db.Instance.Where(models.CryptoHoldings{Asset: asset}).
						Assign(models.CryptoHoldings{Balance: amountFloat}).
						FirstOrCreate(&models.CryptoHoldings{})
				}
			}
			log.Println("[WORKER] Automated Kraken sync complete.")
		}
	}()
}
