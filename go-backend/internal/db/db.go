package db

import (
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Database struct {
	DB *gorm.DB
}

func Connect(databaseURL string) (*Database, error) {
	dial := postgres.Open(databaseURL)
	gdb, err := gorm.Open(dial, &gorm.Config{})
	if err != nil {
		return nil, err
	}
	log.Println("database connected")
	return &Database{DB: gdb}, nil
}


