package db

import (
	"gateway/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var Instance *gorm.DB

func Connect() error {
	dsn := "host=localhost user=serqet password=password dbname=serqet port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	db.AutoMigrate(
		&models.ChatHistory{},
		&models.ChatSession{},
		&models.FinanceRecord{},
		&models.CryptoHoldings{},
		&models.SocialPost{},
		&models.JobApplication{},
		&models.TaskRecord{},
		&models.DietRecord{},
		&models.WorkoutRecord{},
		&models.TradingSignal{},
		&models.ResearchReports{},
		&models.SystemEvent{},
		&models.RevenueCampaign{},
		&models.VentureCampaign{},
		&models.AgentConfig{},
	)

	Instance = db
	return nil
}