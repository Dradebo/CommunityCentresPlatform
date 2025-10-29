package db

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CreateConnection creates a bidirectional connection between two centers
func CreateConnection(db *gorm.DB, centerAID, centerBID uuid.UUID) (*Connection, error) {
	// Check if connection already exists (in either direction)
	exists, err := CheckConnection(db, centerAID, centerBID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("connection already exists")
	}

	connection := &Connection{
		CenterAID: centerAID,
		CenterBID: centerBID,
	}

	err = db.Create(connection).Error
	if err != nil {
		return nil, err
	}

	return connection, nil
}

// CheckConnection checks if a connection exists between two centers (in either direction)
func CheckConnection(db *gorm.DB, centerAID, centerBID uuid.UUID) (bool, error) {
	var count int64
	err := db.Model(&Connection{}).Where(
		"(center_a_id = ? AND center_b_id = ?) OR (center_a_id = ? AND center_b_id = ?)",
		centerAID, centerBID, centerBID, centerAID,
	).Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

// DeleteConnection removes a connection between two centers
func DeleteConnection(db *gorm.DB, centerAID, centerBID uuid.UUID) error {
	return db.Where(
		"(center_a_id = ? AND center_b_id = ?) OR (center_a_id = ? AND center_b_id = ?)",
		centerAID, centerBID, centerBID, centerAID,
	).Delete(&Connection{}).Error
}

// ListConnectionsForCenter retrieves all connections for a specific center
func ListConnectionsForCenter(db *gorm.DB, centerID uuid.UUID) ([]Connection, error) {
	var connections []Connection
	err := db.Where("center_a_id = ? OR center_b_id = ?", centerID, centerID).
		Preload("CenterA").
		Preload("CenterB").
		Find(&connections).Error

	return connections, err
}

// GetConnectedCenters retrieves all centers connected to a specific center
func GetConnectedCenters(db *gorm.DB, centerID uuid.UUID) ([]CommunityCenter, error) {
	// Get all connections
	connections, err := ListConnectionsForCenter(db, centerID)
	if err != nil {
		return nil, err
	}

	// Extract connected center IDs
	connectedIDs := make([]uuid.UUID, 0, len(connections))
	for _, conn := range connections {
		if conn.CenterAID == centerID {
			connectedIDs = append(connectedIDs, conn.CenterBID)
		} else {
			connectedIDs = append(connectedIDs, conn.CenterAID)
		}
	}

	if len(connectedIDs) == 0 {
		return []CommunityCenter{}, nil
	}

	// Retrieve connected centers
	var centers []CommunityCenter
	err = db.Where("id IN ?", connectedIDs).Find(&centers).Error
	return centers, err
}
