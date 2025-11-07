package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"communitycentresplatform/go-backend/internal/db"
)

// CreateRoleUpgradeRequest handles POST /api/role-upgrades
func CreateRoleUpgradeRequest(c *gin.Context) {
	gdb := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("userID").(string)
	userRole := c.MustGet("userRole").(string)

	var req struct {
		RequestedRole db.Role    `json:"requestedRole" binding:"required"`
		CenterID      *uuid.UUID `json:"centerId"`
		Justification string     `json:"justification" binding:"required,min=20"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate upgrade path: Only ENTREPRENEUR -> CENTER_MANAGER requires approval
	if userRole != string(db.RoleEntrepreneur) || req.RequestedRole != db.RoleCenterManager {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role upgrade request"})
		return
	}

	// CENTER_MANAGER requests must include center assignment
	if req.RequestedRole == db.RoleCenterManager && req.CenterID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "center assignment required for CENTER_MANAGER role"})
		return
	}

	// Verify center exists
	if req.CenterID != nil {
		var center db.CommunityCenter
		if err := gdb.First(&center, "id = ?", req.CenterID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "center not found"})
			return
		}
	}

	// Check for existing pending request
	var existing db.RoleUpgradeRequest
	if err := gdb.Where("user_id = ? AND status = ?", userID, db.UpgradeRequestPending).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "you already have a pending upgrade request"})
		return
	}

	// Create request
	userUUID, _ := uuid.Parse(userID)
	upgradeReq := db.RoleUpgradeRequest{
		UserID:        userUUID,
		CurrentRole:   db.Role(userRole),
		RequestedRole: req.RequestedRole,
		CenterID:      req.CenterID,
		Justification: req.Justification,
		Status:        db.UpgradeRequestPending,
	}

	if err := gdb.Create(&upgradeReq).Error; err != nil {
		log.Printf("Failed to create role upgrade request: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create request"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "upgrade request submitted",
		"request": upgradeReq,
	})
}

// GetMyUpgradeRequest handles GET /api/role-upgrades/me
func GetMyUpgradeRequest(c *gin.Context) {
	gdb := c.MustGet("db").(*gorm.DB)
	userID := c.MustGet("userID").(string)

	var request db.RoleUpgradeRequest
	if err := gdb.Preload("Center").Where("user_id = ?", userID).Order("created_at DESC").First(&request).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "no upgrade request found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, request)
}

// ListUpgradeRequests handles GET /api/role-upgrades (admin only)
func ListUpgradeRequests(c *gin.Context) {
	gdb := c.MustGet("db").(*gorm.DB)

	// Admin only
	userRole := c.MustGet("userRole").(string)
	if userRole != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
		return
	}

	status := c.Query("status") // "PENDING", "APPROVED", "REJECTED", or all

	query := gdb.Preload("User").Preload("Center")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var requests []db.RoleUpgradeRequest
	if err := query.Order("created_at DESC").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		return
	}

	c.JSON(http.StatusOK, requests)
}

// ReviewUpgradeRequest handles PUT /api/role-upgrades/:id/review (admin only)
func ReviewUpgradeRequest(c *gin.Context) {
	gdb := c.MustGet("db").(*gorm.DB)
	requestID := c.Param("id")
	adminID := c.MustGet("userID").(string)
	userRole := c.MustGet("userRole").(string)

	// Admin only
	if userRole != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "admin access required"})
		return
	}

	var req struct {
		Action string  `json:"action" binding:"required,oneof=approve reject"`
		Notes  *string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get request
	var upgradeReq db.RoleUpgradeRequest
	if err := gdb.Preload("User").First(&upgradeReq, "id = ?", requestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request not found"})
		return
	}

	if upgradeReq.Status != db.UpgradeRequestPending {
		c.JSON(http.StatusBadRequest, gin.H{"error": "request already reviewed"})
		return
	}

	// Start transaction
	tx := gdb.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	adminUUID, _ := uuid.Parse(adminID)
	upgradeReq.ReviewedBy = &adminUUID
	upgradeReq.ReviewNotes = req.Notes

	if req.Action == "approve" {
		upgradeReq.Status = db.UpgradeRequestApproved

		// Update user role
		if err := tx.Model(&db.User{}).Where("id = ?", upgradeReq.UserID).Updates(map[string]interface{}{
			"role":       upgradeReq.RequestedRole,
			"updated_at": time.Now(),
		}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user role"})
			return
		}

		// If CENTER_MANAGER, assign to center
		if upgradeReq.RequestedRole == db.RoleCenterManager && upgradeReq.CenterID != nil {
			if err := tx.Model(&db.CommunityCenter{}).Where("id = ?", upgradeReq.CenterID).Update("manager_id", upgradeReq.UserID).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to assign center"})
				return
			}
		}
	} else {
		upgradeReq.Status = db.UpgradeRequestRejected
	}

	if err := tx.Save(&upgradeReq).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update request"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message": "request reviewed",
		"request": upgradeReq,
	})
}
