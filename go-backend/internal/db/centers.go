package db

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// CenterFilters defines filtering options for listing centers
type CenterFilters struct {
	SearchQuery        string   // Search in name, location, description
	Services           []string // Filter by services (has-some logic)
	Locations          []string // Filter by locations
	VerificationStatus string   // "verified", "unverified", or "all"
	AddedByUserID      string   // Filter by who added the center
	Limit              int      // Pagination limit
	Offset             int      // Pagination offset
}

// ListCenters retrieves centers with optional filters
func ListCenters(db *gorm.DB, filters CenterFilters) ([]CommunityCenter, error) {
	query := db.Model(&CommunityCenter{})

	// Search query (case-insensitive in name, location, description)
	if filters.SearchQuery != "" {
		search := "%" + strings.ToLower(filters.SearchQuery) + "%"
		query = query.Where(
			"LOWER(name) LIKE ? OR LOWER(location) LIKE ? OR LOWER(description) LIKE ?",
			search, search, search,
		)
	}

	// Services filter (PostgreSQL array contains operator @>)
	if len(filters.Services) > 0 {
		query = query.Where("services @> ?", pq.Array(filters.Services))
	}

	// Locations filter
	if len(filters.Locations) > 0 {
		query = query.Where("location IN ?", filters.Locations)
	}

	// Verification status filter
	switch strings.ToLower(filters.VerificationStatus) {
	case "verified":
		query = query.Where("verified = ?", true)
	case "unverified":
		query = query.Where("verified = ?", false)
	// "all" or empty means no filter
	}

	// Filter by who added the center
	if filters.AddedByUserID != "" {
		query = query.Where("added_by = ?", filters.AddedByUserID)
	}

	// Pagination
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	// Order by creation date (newest first)
	query = query.Order("created_at DESC")

	var centers []CommunityCenter
	err := query.Find(&centers).Error
	return centers, err
}

// CreateCenter creates a new community center
func CreateCenter(db *gorm.DB, center *CommunityCenter) error {
	return db.Create(center).Error
}

// FindCenterByID retrieves a center by ID
func FindCenterByID(db *gorm.DB, id uuid.UUID) (*CommunityCenter, error) {
	var center CommunityCenter
	err := db.Where("id = ?", id).First(&center).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &center, nil
}

// FindCenterByIDString retrieves a center by ID string
func FindCenterByIDString(db *gorm.DB, idStr string) (*CommunityCenter, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, err
	}
	return FindCenterByID(db, id)
}

// UpdateCenter updates an existing center
func UpdateCenter(db *gorm.DB, center *CommunityCenter) error {
	return db.Save(center).Error
}

// VerifyCenter marks a center as verified (admin only)
func VerifyCenter(db *gorm.DB, centerID uuid.UUID, verified bool) error {
	return db.Model(&CommunityCenter{}).Where("id = ?", centerID).Update("verified", verified).Error
}

// CountCenters returns total count with filters (for pagination metadata)
func CountCenters(db *gorm.DB, filters CenterFilters) (int64, error) {
	query := db.Model(&CommunityCenter{})

	// Apply same filters as ListCenters (without limit/offset)
	if filters.SearchQuery != "" {
		search := "%" + strings.ToLower(filters.SearchQuery) + "%"
		query = query.Where(
			"LOWER(name) LIKE ? OR LOWER(location) LIKE ? OR LOWER(description) LIKE ?",
			search, search, search,
		)
	}

	if len(filters.Services) > 0 {
		query = query.Where("services @> ?", pq.Array(filters.Services))
	}

	if len(filters.Locations) > 0 {
		query = query.Where("location IN ?", filters.Locations)
	}

	switch strings.ToLower(filters.VerificationStatus) {
	case "verified":
		query = query.Where("verified = ?", true)
	case "unverified":
		query = query.Where("verified = ?", false)
	}

	if filters.AddedByUserID != "" {
		query = query.Where("added_by = ?", filters.AddedByUserID)
	}

	var count int64
	err := query.Count(&count).Error
	return count, err
}
