package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"communitycentresplatform/go-backend/internal/ctxutil"
	"communitycentresplatform/go-backend/internal/db"
)

type entrepreneurRequest struct {
	BusinessName string  `json:"businessName" binding:"required,min=2"`
	BusinessType string  `json:"businessType" binding:"required,min=2"`
	Description  string  `json:"description" binding:"required,min=10"`
	Phone        *string `json:"phone"`
	Email        *string `json:"email"`
	Website      *string `json:"website"`
}

// POST /api/entrepreneurs - Create entrepreneur profile (ENTREPRENEUR role required)
func CreateEntrepreneur(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var req entrepreneurRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)

	// Only ENTREPRENEUR role can create entrepreneur profiles
	if role != string(db.RoleEntrepreneur) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only users with ENTREPRENEUR role can create entrepreneur profiles"})
		return
	}

	// Check if entrepreneur profile already exists for this user
	var existing db.Entrepreneur
	uid, _ := uuid.Parse(userID)
	if err := gdb.Where("user_id = ?", uid).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "entrepreneur profile already exists for this user"})
		return
	}

	entrepreneur := db.Entrepreneur{
		UserID:       uid,
		BusinessName: req.BusinessName,
		BusinessType: req.BusinessType,
		Description:  req.Description,
		Phone:        req.Phone,
		Email:        req.Email,
		Website:      req.Website,
		Verified:     false,
	}

	if err := gdb.Create(&entrepreneur).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create entrepreneur profile"})
		return
	}

	// Preload user relation
	gdb.Preload("User").First(&entrepreneur, entrepreneur.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Entrepreneur profile created successfully",
		"entrepreneur": gin.H{
			"id":           entrepreneur.ID,
			"userId":       entrepreneur.UserID,
			"businessName": entrepreneur.BusinessName,
			"businessType": entrepreneur.BusinessType,
			"description":  entrepreneur.Description,
			"phone":        entrepreneur.Phone,
			"email":        entrepreneur.Email,
			"website":      entrepreneur.Website,
			"verified":     entrepreneur.Verified,
			"createdAt":    entrepreneur.CreatedAt,
		},
	})
}

// GET /api/entrepreneurs/:id - Get entrepreneur details (authenticated users)
func GetEntrepreneur(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	id := c.Param("id")
	entrepreneurID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entrepreneur id"})
		return
	}

	var entrepreneur db.Entrepreneur
	if err := gdb.Preload("User").Preload("Enrollments").Preload("ServicesReceived").First(&entrepreneur, entrepreneurID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "entrepreneur not found"})
		return
	}

	// Get enrollment count
	var enrollmentCount int64
	gdb.Model(&db.HubEnrollment{}).Where("entrepreneur_id = ?", entrepreneurID).Count(&enrollmentCount)

	// Get services received count
	var servicesCount int64
	gdb.Model(&db.ServiceProvision{}).Where("entrepreneur_id = ?", entrepreneurID).Count(&servicesCount)

	c.JSON(http.StatusOK, gin.H{
		"entrepreneur": gin.H{
			"id":              entrepreneur.ID,
			"userId":          entrepreneur.UserID,
			"businessName":    entrepreneur.BusinessName,
			"businessType":    entrepreneur.BusinessType,
			"description":     entrepreneur.Description,
			"phone":           entrepreneur.Phone,
			"email":           entrepreneur.Email,
			"website":         entrepreneur.Website,
			"verified":        entrepreneur.Verified,
			"enrollmentCount": enrollmentCount,
			"servicesCount":   servicesCount,
			"createdAt":       entrepreneur.CreatedAt,
			"user": gin.H{
				"id":    entrepreneur.User.ID,
				"name":  entrepreneur.User.Name,
				"email": entrepreneur.User.Email,
			},
		},
	})
}

// PUT /api/entrepreneurs/:id - Update entrepreneur profile (owner or ADMIN)
func UpdateEntrepreneur(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	id := c.Param("id")
	entrepreneurID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entrepreneur id"})
		return
	}

	var entrepreneur db.Entrepreneur
	if err := gdb.First(&entrepreneur, entrepreneurID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "entrepreneur not found"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)
	uid, _ := uuid.Parse(userID)

	// Check authorization: only owner or admin can update
	if entrepreneur.UserID != uid && role != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized to update this profile"})
		return
	}

	var req entrepreneurRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	// Update fields
	entrepreneur.BusinessName = req.BusinessName
	entrepreneur.BusinessType = req.BusinessType
	entrepreneur.Description = req.Description
	entrepreneur.Phone = req.Phone
	entrepreneur.Email = req.Email
	entrepreneur.Website = req.Website

	if err := gdb.Save(&entrepreneur).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update entrepreneur profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Entrepreneur profile updated successfully",
		"entrepreneur": gin.H{
			"id":           entrepreneur.ID,
			"userId":       entrepreneur.UserID,
			"businessName": entrepreneur.BusinessName,
			"businessType": entrepreneur.BusinessType,
			"description":  entrepreneur.Description,
			"phone":        entrepreneur.Phone,
			"email":        entrepreneur.Email,
			"website":      entrepreneur.Website,
			"verified":     entrepreneur.Verified,
			"updatedAt":    entrepreneur.UpdatedAt,
		},
	})
}

// DELETE /api/entrepreneurs/:id - Delete entrepreneur profile (owner or ADMIN)
func DeleteEntrepreneur(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	id := c.Param("id")
	entrepreneurID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entrepreneur id"})
		return
	}

	var entrepreneur db.Entrepreneur
	if err := gdb.First(&entrepreneur, entrepreneurID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "entrepreneur not found"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)
	uid, _ := uuid.Parse(userID)

	// Check authorization: only owner or admin can delete
	if entrepreneur.UserID != uid && role != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not authorized to delete this profile"})
		return
	}

	if err := gdb.Delete(&entrepreneur).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete entrepreneur profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Entrepreneur profile deleted successfully",
	})
}

// GET /api/entrepreneurs - List all entrepreneurs (ADMIN only)
func ListEntrepreneurs(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	role := ctxutil.RoleFrom(c)
	if role != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only admins can list all entrepreneurs"})
		return
	}

	// Parse query parameters for filtering
	businessType := c.Query("businessType")
	verified := c.Query("verified")

	query := gdb.Preload("User")

	// Apply filters
	if businessType != "" {
		query = query.Where("business_type = ?", businessType)
	}
	if verified == "true" {
		query = query.Where("verified = ?", true)
	} else if verified == "false" {
		query = query.Where("verified = ?", false)
	}

	var entrepreneurs []db.Entrepreneur
	if err := query.Find(&entrepreneurs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch entrepreneurs"})
		return
	}

	// Transform response
	transformedEntrepreneurs := make([]gin.H, len(entrepreneurs))
	for i, e := range entrepreneurs {
		// Get enrollment and services counts
		var enrollmentCount, servicesCount int64
		gdb.Model(&db.HubEnrollment{}).Where("entrepreneur_id = ?", e.ID).Count(&enrollmentCount)
		gdb.Model(&db.ServiceProvision{}).Where("entrepreneur_id = ?", e.ID).Count(&servicesCount)

		transformedEntrepreneurs[i] = gin.H{
			"id":              e.ID,
			"userId":          e.UserID,
			"businessName":    e.BusinessName,
			"businessType":    e.BusinessType,
			"description":     e.Description,
			"phone":           e.Phone,
			"email":           e.Email,
			"website":         e.Website,
			"verified":        e.Verified,
			"enrollmentCount": enrollmentCount,
			"servicesCount":   servicesCount,
			"createdAt":       e.CreatedAt,
			"user": gin.H{
				"name":  e.User.Name,
				"email": e.User.Email,
			},
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"entrepreneurs": transformedEntrepreneurs,
		"total":         len(transformedEntrepreneurs),
	})
}

// PATCH /api/entrepreneurs/:id/verify - Verify entrepreneur (ADMIN only)
func VerifyEntrepreneur(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	role := ctxutil.RoleFrom(c)
	if role != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "only admins can verify entrepreneurs"})
		return
	}

	id := c.Param("id")
	entrepreneurID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entrepreneur id"})
		return
	}

	var entrepreneur db.Entrepreneur
	if err := gdb.First(&entrepreneur, entrepreneurID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "entrepreneur not found"})
		return
	}

	entrepreneur.Verified = true
	if err := gdb.Save(&entrepreneur).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to verify entrepreneur"})
		return
	}

	// Emit real-time event for verification
	if br := ctxutil.BrokerFrom(c); br != nil {
		br.EmitCenterUpdate(entrepreneur.UserID.String(), gin.H{
			"entrepreneurId": entrepreneur.ID,
			"verified":       entrepreneur.Verified,
			"action":         "entrepreneur_verified",
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "Entrepreneur verified successfully",
		"entrepreneur": entrepreneur,
	})
}
