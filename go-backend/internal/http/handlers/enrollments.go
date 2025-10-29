package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"communitycentresplatform/go-backend/internal/ctxutil"
	"communitycentresplatform/go-backend/internal/db"
)

type enrollmentRequest struct {
	HubID          string `json:"hubId" binding:"required"`
	EntrepreneurID string `json:"entrepreneurId" binding:"required"`
}

// POST /api/enrollments - Create enrollment (CENTER_MANAGER creates, ENTREPRENEUR requests)
func CreateEnrollment(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var req enrollmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	role := ctxutil.RoleFrom(c)
	userID := ctxutil.UserIDFrom(c)

	// Parse IDs
	hubID, err := uuid.Parse(req.HubID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hub id"})
		return
	}

	entrepreneurID, err := uuid.Parse(req.EntrepreneurID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entrepreneur id"})
		return
	}

	// Verify hub exists
	var hub db.CommunityCenter
	if err := gdb.First(&hub, hubID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "hub not found"})
		return
	}

	// Verify entrepreneur exists
	var entrepreneur db.Entrepreneur
	if err := gdb.First(&entrepreneur, entrepreneurID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "entrepreneur not found"})
		return
	}

	// Authorization check
	if role == string(db.RoleEntrepreneur) {
		// Entrepreneur can only enroll themselves
		uid, _ := uuid.Parse(userID)
		if entrepreneur.UserID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "you can only create enrollment requests for yourself"})
			return
		}
	} else if role != string(db.RoleCenterManager) && role != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	// Check for existing enrollment
	var existing db.HubEnrollment
	if err := gdb.Where("hub_id = ? AND entrepreneur_id = ?", hubID, entrepreneurID).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "enrollment already exists"})
		return
	}

	// Determine initial status based on role
	initialStatus := db.EnrollmentPending
	var enrollmentDate *time.Time
	if role == string(db.RoleCenterManager) || role == string(db.RoleAdmin) {
		// Manager/Admin creates active enrollment immediately
		initialStatus = db.EnrollmentActive
		now := time.Now()
		enrollmentDate = &now
	}

	enrollment := db.HubEnrollment{
		HubID:          hubID,
		EntrepreneurID: entrepreneurID,
		Status:         initialStatus,
		EnrollmentDate: enrollmentDate,
	}

	if err := gdb.Create(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create enrollment"})
		return
	}

	// Preload relations
	gdb.Preload("Hub").Preload("Entrepreneur.User").First(&enrollment, enrollment.ID)

	// Emit real-time event
	if br := ctxutil.BrokerFrom(c); br != nil {
		br.EmitCenterUpdate(hubID.String(), gin.H{
			"enrollmentId":    enrollment.ID,
			"hubId":           hubID,
			"entrepreneurId":  entrepreneurID,
			"status":          enrollment.Status,
			"action":          "enrollment_created",
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Enrollment created successfully",
		"enrollment": gin.H{
			"id":             enrollment.ID,
			"hubId":          enrollment.HubID,
			"entrepreneurId": enrollment.EntrepreneurID,
			"status":         enrollment.Status,
			"enrollmentDate": enrollment.EnrollmentDate,
			"createdAt":      enrollment.CreatedAt,
			"hub": gin.H{
				"id":       enrollment.Hub.ID,
				"name":     enrollment.Hub.Name,
				"location": enrollment.Hub.Location,
			},
			"entrepreneur": gin.H{
				"id":           enrollment.Entrepreneur.ID,
				"businessName": enrollment.Entrepreneur.BusinessName,
				"businessType": enrollment.Entrepreneur.BusinessType,
			},
		},
	})
}

// GET /api/enrollments/hub/:hubId - List enrollments for a hub (CENTER_MANAGER/ADMIN)
func GetHubEnrollments(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	role := ctxutil.RoleFrom(c)
	if role != string(db.RoleCenterManager) && role != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	hubID, err := uuid.Parse(c.Param("hubId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hub id"})
		return
	}

	// Optional status filter
	status := c.Query("status")

	query := gdb.Preload("Entrepreneur.User").Preload("Hub").Where("hub_id = ?", hubID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var enrollments []db.HubEnrollment
	if err := query.Order("created_at DESC").Find(&enrollments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch enrollments"})
		return
	}

	// Transform response
	transformedEnrollments := make([]gin.H, len(enrollments))
	for i, e := range enrollments {
		transformedEnrollments[i] = gin.H{
			"id":             e.ID,
			"hubId":          e.HubID,
			"entrepreneurId": e.EntrepreneurID,
			"status":         e.Status,
			"enrollmentDate": e.EnrollmentDate,
			"completionDate": e.CompletionDate,
			"createdAt":      e.CreatedAt,
			"updatedAt":      e.UpdatedAt,
			"entrepreneur": gin.H{
				"id":           e.Entrepreneur.ID,
				"businessName": e.Entrepreneur.BusinessName,
				"businessType": e.Entrepreneur.BusinessType,
				"verified":     e.Entrepreneur.Verified,
				"user": gin.H{
					"name":  e.Entrepreneur.User.Name,
					"email": e.Entrepreneur.User.Email,
				},
			},
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"enrollments": transformedEnrollments,
		"total":       len(transformedEnrollments),
	})
}

// GET /api/enrollments/entrepreneur/:entrepreneurId - List entrepreneur's enrollments
func GetEntrepreneurEnrollments(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	entrepreneurID, err := uuid.Parse(c.Param("entrepreneurId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entrepreneur id"})
		return
	}

	// Authorization: entrepreneur can view their own, admin can view all
	role := ctxutil.RoleFrom(c)
	userID := ctxutil.UserIDFrom(c)

	if role == string(db.RoleEntrepreneur) {
		// Verify this entrepreneur belongs to the user
		var entrepreneur db.Entrepreneur
		if err := gdb.First(&entrepreneur, entrepreneurID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "entrepreneur not found"})
			return
		}
		uid, _ := uuid.Parse(userID)
		if entrepreneur.UserID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized to view these enrollments"})
			return
		}
	} else if role != string(db.RoleAdmin) && role != string(db.RoleCenterManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	// Optional status filter
	status := c.Query("status")

	query := gdb.Preload("Hub").Where("entrepreneur_id = ?", entrepreneurID)
	if status != "" {
		query = query.Where("status = ?", status)
	}

	var enrollments []db.HubEnrollment
	if err := query.Order("created_at DESC").Find(&enrollments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch enrollments"})
		return
	}

	// Transform response
	transformedEnrollments := make([]gin.H, len(enrollments))
	for i, e := range enrollments {
		transformedEnrollments[i] = gin.H{
			"id":             e.ID,
			"hubId":          e.HubID,
			"entrepreneurId": e.EntrepreneurID,
			"status":         e.Status,
			"enrollmentDate": e.EnrollmentDate,
			"completionDate": e.CompletionDate,
			"createdAt":      e.CreatedAt,
			"updatedAt":      e.UpdatedAt,
			"hub": gin.H{
				"id":          e.Hub.ID,
				"name":        e.Hub.Name,
				"location":    e.Hub.Location,
				"verified":    e.Hub.Verified,
				"description": e.Hub.Description,
			},
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"enrollments": transformedEnrollments,
		"total":       len(transformedEnrollments),
	})
}

// PATCH /api/enrollments/:id/status - Update enrollment status (CENTER_MANAGER/ADMIN)
func UpdateEnrollmentStatus(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	role := ctxutil.RoleFrom(c)
	if role != string(db.RoleCenterManager) && role != string(db.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	enrollmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment id"})
		return
	}

	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	// Validate status
	newStatus := db.EnrollmentStatus(req.Status)
	if newStatus != db.EnrollmentPending && newStatus != db.EnrollmentActive &&
	   newStatus != db.EnrollmentCompleted && newStatus != db.EnrollmentSuspended {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status value"})
		return
	}

	var enrollment db.HubEnrollment
	if err := gdb.First(&enrollment, enrollmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "enrollment not found"})
		return
	}

	// Update status and related dates
	enrollment.Status = newStatus

	// Handle status-specific updates
	switch newStatus {
	case db.EnrollmentActive:
		if enrollment.EnrollmentDate == nil {
			now := time.Now()
			enrollment.EnrollmentDate = &now
		}
	case db.EnrollmentCompleted:
		if enrollment.CompletionDate == nil {
			now := time.Now()
			enrollment.CompletionDate = &now
		}
	}

	if err := gdb.Save(&enrollment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update enrollment status"})
		return
	}

	// Preload relations for response
	gdb.Preload("Hub").Preload("Entrepreneur.User").First(&enrollment, enrollment.ID)

	// Emit real-time event
	if br := ctxutil.BrokerFrom(c); br != nil {
		br.EmitCenterUpdate(enrollment.HubID.String(), gin.H{
			"enrollmentId":   enrollment.ID,
			"status":         enrollment.Status,
			"action":         "enrollment_status_updated",
			"entrepreneurId": enrollment.EntrepreneurID,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Enrollment status updated successfully",
		"enrollment": gin.H{
			"id":             enrollment.ID,
			"hubId":          enrollment.HubID,
			"entrepreneurId": enrollment.EntrepreneurID,
			"status":         enrollment.Status,
			"enrollmentDate": enrollment.EnrollmentDate,
			"completionDate": enrollment.CompletionDate,
			"updatedAt":      enrollment.UpdatedAt,
		},
	})
}

// GET /api/enrollments/:id - Get single enrollment details
func GetEnrollment(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	enrollmentID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid enrollment id"})
		return
	}

	var enrollment db.HubEnrollment
	if err := gdb.Preload("Hub").Preload("Entrepreneur.User").First(&enrollment, enrollmentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "enrollment not found"})
		return
	}

	// Authorization check
	role := ctxutil.RoleFrom(c)
	userID := ctxutil.UserIDFrom(c)

	if role == string(db.RoleEntrepreneur) {
		uid, _ := uuid.Parse(userID)
		if enrollment.Entrepreneur.UserID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized to view this enrollment"})
			return
		}
	} else if role != string(db.RoleAdmin) && role != string(db.RoleCenterManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"enrollment": gin.H{
			"id":             enrollment.ID,
			"hubId":          enrollment.HubID,
			"entrepreneurId": enrollment.EntrepreneurID,
			"status":         enrollment.Status,
			"enrollmentDate": enrollment.EnrollmentDate,
			"completionDate": enrollment.CompletionDate,
			"createdAt":      enrollment.CreatedAt,
			"updatedAt":      enrollment.UpdatedAt,
			"hub": gin.H{
				"id":          enrollment.Hub.ID,
				"name":        enrollment.Hub.Name,
				"location":    enrollment.Hub.Location,
				"description": enrollment.Hub.Description,
				"verified":    enrollment.Hub.Verified,
			},
			"entrepreneur": gin.H{
				"id":           enrollment.Entrepreneur.ID,
				"businessName": enrollment.Entrepreneur.BusinessName,
				"businessType": enrollment.Entrepreneur.BusinessType,
				"description":  enrollment.Entrepreneur.Description,
				"verified":     enrollment.Entrepreneur.Verified,
				"user": gin.H{
					"name":  enrollment.Entrepreneur.User.Name,
					"email": enrollment.Entrepreneur.User.Email,
				},
			},
		},
	})
}
