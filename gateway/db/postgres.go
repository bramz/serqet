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
		&models.FinanceRecord{},
		&models.SocialPost{},
		&models.JobApplication{},
		&models.TaskRecord{},
	)
	Instance = db
	return nil
}