package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"communitycentresplatform/go-backend/internal/ctxutil"
	"communitycentresplatform/go-backend/internal/db"
)

// GET /api/centers - List all centers with filtering
func ListCenters(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	// Parse query parameters
	searchQuery := c.Query("searchQuery")
	servicesStr := c.Query("services")
	locationsStr := c.Query("locations")
	verificationStatus := c.Query("verificationStatus")
	connectionStatus := c.Query("connectionStatus")

	// Build filters
	filters := db.CenterFilters{
		SearchQuery:        searchQuery,
		VerificationStatus: verificationStatus,
	}

	// Parse services (comma-separated)
	if servicesStr != "" {
		filters.Services = strings.Split(servicesStr, ",")
	}

	// Parse locations (comma-separated)
	if locationsStr != "" {
		filters.Locations = strings.Split(locationsStr, ",")
	}

	// Fetch centers
	centers, err := db.ListCenters(gdb, filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch centers"})
		return
	}

	// Transform to match Node.js response format
	transformedCenters := make([]gin.H, len(centers))
	for i, center := range centers {
		// Get connections for this center
		connections, _ := db.ListConnectionsForCenter(gdb, center.ID)
		connectionIDs := make([]uuid.UUID, 0, len(connections))
		for _, conn := range connections {
			if conn.CenterAID == center.ID {
				connectionIDs = append(connectionIDs, conn.CenterBID)
			} else {
				connectionIDs = append(connectionIDs, conn.CenterAID)
			}
		}

		// Determine addedBy
		addedBy := "visitor"
		if center.ManagerID != nil {
			addedBy = "admin"
		}

		transformedCenters[i] = gin.H{
			"id":          center.ID,
			"name":        center.Name,
			"location":    center.Location,
			"coordinates": gin.H{"lat": center.Latitude, "lng": center.Longitude},
			"services":    center.Services,
			"description": center.Description,
			"verified":    center.Verified,
			"connections": connectionIDs,
			"addedBy":     addedBy,
			"contactInfo": gin.H{
				"phone":   center.Phone,
				"email":   center.Email,
				"website": center.Website,
			},
		}
	}

	// Apply connection status filter (post-transformation)
	filteredCenters := transformedCenters
	if connectionStatus != "" && connectionStatus != "all" {
		filtered := []gin.H{}
		for _, center := range transformedCenters {
			connections := center["connections"].([]uuid.UUID)
			if connectionStatus == "connected" && len(connections) > 0 {
				filtered = append(filtered, center)
			} else if connectionStatus == "standalone" && len(connections) == 0 {
				filtered = append(filtered, center)
			}
		}
		filteredCenters = filtered
	}

	c.JSON(http.StatusOK, gin.H{"centers": filteredCenters})
}

// GET /api/centers/:id - Get single center by ID
func GetCenter(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	id := c.Param("id")
	centerID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid center id"})
		return
	}

	center, err := db.FindCenterByID(gdb, centerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch center"})
		return
	}
	if center == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "center not found"})
		return
	}

	// Get connections and connected centers
	connections, _ := db.ListConnectionsForCenter(gdb, center.ID)
	connectionIDs := make([]uuid.UUID, 0, len(connections))
	connectedCenters := make([]gin.H, 0, len(connections))

	for _, conn := range connections {
		var otherCenterID uuid.UUID
		var otherCenter *db.CommunityCenter

		if conn.CenterAID == center.ID {
			otherCenterID = conn.CenterBID
			otherCenter, _ = db.FindCenterByID(gdb, otherCenterID)
		} else {
			otherCenterID = conn.CenterAID
			otherCenter, _ = db.FindCenterByID(gdb, otherCenterID)
		}

		connectionIDs = append(connectionIDs, otherCenterID)

		if otherCenter != nil {
			connectedCenters = append(connectedCenters, gin.H{
				"id":       otherCenter.ID,
				"name":     otherCenter.Name,
				"location": otherCenter.Location,
				"verified": otherCenter.Verified,
			})
		}
	}

	addedBy := "visitor"
	if center.ManagerID != nil {
		addedBy = "admin"
	}

	transformedCenter := gin.H{
		"id":               center.ID,
		"name":             center.Name,
		"location":         center.Location,
		"coordinates":      gin.H{"lat": center.Latitude, "lng": center.Longitude},
		"services":         center.Services,
		"description":      center.Description,
		"verified":         center.Verified,
		"connections":      connectionIDs,
		"connectedCenters": connectedCenters,
		"addedBy":          addedBy,
		"contactInfo": gin.H{
			"phone":   center.Phone,
			"email":   center.Email,
			"website": center.Website,
		},
	}

	c.JSON(http.StatusOK, gin.H{"center": transformedCenter})
}

type centerRequest struct {
	Name        string   `json:"name" binding:"required,min=2"`
	Location    string   `json:"location" binding:"required,min=5"`
	Latitude    float64  `json:"latitude" binding:"required,min=-90,max=90"`
	Longitude   float64  `json:"longitude" binding:"required,min=-180,max=180"`
	Services    []string `json:"services" binding:"required,min=1"`
	Description string   `json:"description" binding:"required,min=10"`
	Phone       string   `json:"phone"`
	Email       string   `json:"email"`
	Website     string   `json:"website"`
}

// POST /api/centers - Create new center
func CreateCenter(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var req centerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)

	// Handle optional contact fields
	var phone, email, website *string
	if req.Phone != "" {
		phone = &req.Phone
	}
	if req.Email != "" {
		email = &req.Email
	}
	if req.Website != "" {
		website = &req.Website
	}

	// Parse manager ID if admin
	var managerID *uuid.UUID
	if role == "ADMIN" {
		uid, _ := uuid.Parse(userID)
		managerID = &uid
	}

	center := db.CommunityCenter{
		Name:        req.Name,
		Location:    req.Location,
		Latitude:    req.Latitude,
		Longitude:   req.Longitude,
		Description: req.Description,
		Services:    db.StringArray(req.Services),
		AddedBy:     userID,
		Verified:    role == "ADMIN",
		ManagerID:   managerID,
		Phone:       phone,
		Email:       email,
		Website:     website,
	}

	if err := gdb.Create(&center).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create center"})
		return
	}

	addedBy := "visitor"
	if role == "ADMIN" {
		addedBy = "admin"
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Center created successfully",
		"center": gin.H{
			"id":          center.ID,
			"name":        center.Name,
			"location":    center.Location,
			"coordinates": gin.H{"lat": center.Latitude, "lng": center.Longitude},
			"services":    center.Services,
			"description": center.Description,
			"verified":    center.Verified,
			"connections": []uuid.UUID{},
			"addedBy":     addedBy,
			"contactInfo": gin.H{
				"phone":   center.Phone,
				"email":   center.Email,
				"website": center.Website,
			},
		},
	})
}

// PATCH /api/centers/:id/verify - Verify center (Admin only)
func VerifyCenter(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	id := c.Param("id")
	centerID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid center id"})
		return
	}

	err = db.VerifyCenter(gdb, centerID, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify center"})
		return
	}

	// Get updated center
	center, _ := db.FindCenterByID(gdb, centerID)

	// Emit real-time event
	if br := ctxutil.BrokerFrom(c); br != nil && center != nil {
		br.EmitCenterUpdate(centerID.String(), gin.H{
			"id":       center.ID,
			"name":     center.Name,
			"verified": center.Verified,
			"action":   "verified",
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Center verified successfully",
		"center":  center,
	})
}

// POST /api/centers/connect - Connect two centers (Admin only)
func ConnectCenters(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var req struct {
		Center1ID string `json:"center1Id" binding:"required"`
		Center2ID string `json:"center2Id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	if req.Center1ID == req.Center2ID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cannot connect center to itself"})
		return
	}

	// Parse UUIDs
	center1ID, err := uuid.Parse(req.Center1ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid center1Id"})
		return
	}

	center2ID, err := uuid.Parse(req.Center2ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid center2Id"})
		return
	}

	// Create connection (handles duplicate check)
	connection, err := db.CreateConnection(gdb, center1ID, center2ID)
	if err != nil {
		if err.Error() == "connection already exists" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "centers are already connected"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create connection"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "Centers connected successfully",
		"connection": connection,
	})
}

// PUT /api/centers - Update center (placeholder for future implementation)
func UpdateCenter(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented yet"})
}
