package db

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreateUser creates a new user in the database
func CreateUser(db *gorm.DB, user *User) error {
	return db.Create(user).Error
}

// FindUserByEmail finds a user by email address
func FindUserByEmail(db *gorm.DB, email string) (*User, error) {
	var user User
	err := db.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil for not found (not an error in business logic)
		}
		return nil, err
	}
	return &user, nil
}

// FindUserByID finds a user by ID
func FindUserByID(db *gorm.DB, id uuid.UUID) (*User, error) {
	var user User
	err := db.Where("id = ?", id).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}

// FindUserByIDString finds a user by ID string
func FindUserByIDString(db *gorm.DB, idStr string) (*User, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, err
	}
	return FindUserByID(db, id)
}

// UpdateUser updates an existing user
func UpdateUser(db *gorm.DB, user *User) error {
	return db.Save(user).Error
}

// UpdateUserVerification updates user verification status
func UpdateUserVerification(db *gorm.DB, userID uuid.UUID, verified bool) error {
	return db.Model(&User{}).Where("id = ?", userID).Update("verified", verified).Error
}
