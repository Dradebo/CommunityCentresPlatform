package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"communitycentresplatform/go-backend/internal/ctxutil"
	"communitycentresplatform/go-backend/internal/db"
)

type createActivityRequest struct {
	HubID              string  `json:"hubId" binding:"required"`
	Type               string  `json:"type" binding:"required,oneof=ENROLLMENT SERVICE COLLABORATION ANNOUNCEMENT CONNECTION"`
	Title              string  `json:"title" binding:"required,min=5,max=255"`
	Description        string  `json:"description" binding:"required,min=10"`
	EntrepreneurID     *string `json:"entrepreneurId"`
	ServiceProvisionID *string `json:"serviceProvisionId"`
	ConnectionID       *string `json:"connectionId"`
	CollaboratingHubID *string `json:"collaboratingHubId"`
	Pinned             *bool   `json:"pinned"`
}

type updateActivityRequest struct {
	Title       *string `json:"title"`
	Description *string `json:"description"`
}

// POST /api/activities - Create new activity
func CreateActivity(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var req createActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input", "details": err.Error()})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)

	// Parse hub ID
	hubID, err := uuid.Parse(req.HubID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hub id"})
		return
	}

	// Verify user is CENTER_MANAGER of this hub
	if role == "CENTER_MANAGER" {
		uid, _ := uuid.Parse(userID)
		var hub db.CommunityCenter
		if err := gdb.Where("id = ? AND manager_id = ?", hubID, uid).First(&hub).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "you are not the manager of this hub"})
			return
		}
	}

	// Parse optional UUID fields
	var entrepreneurID, serviceProvisionID, connectionID, collaboratingHubID *uuid.UUID

	if req.EntrepreneurID != nil {
		parsed, err := uuid.Parse(*req.EntrepreneurID)
		if err == nil {
			entrepreneurID = &parsed
		}
	}

	if req.ServiceProvisionID != nil {
		parsed, err := uuid.Parse(*req.ServiceProvisionID)
		if err == nil {
			serviceProvisionID = &parsed
		}
	}

	if req.ConnectionID != nil {
		parsed, err := uuid.Parse(*req.ConnectionID)
		if err == nil {
			connectionID = &parsed
		}
	}

	if req.CollaboratingHubID != nil {
		parsed, err := uuid.Parse(*req.CollaboratingHubID)
		if err == nil {
			collaboratingHubID = &parsed
		}
	}

	pinned := false
	if req.Pinned != nil {
		pinned = *req.Pinned
	}

	creatorID, _ := uuid.Parse(userID)

	activity := db.HubActivity{
		HubID:              hubID,
		Type:               db.ActivityType(req.Type),
		Title:              req.Title,
		Description:        req.Description,
		EntrepreneurID:     entrepreneurID,
		ServiceProvisionID: serviceProvisionID,
		ConnectionID:       connectionID,
		CollaboratingHubID: collaboratingHubID,
		Pinned:             pinned,
		CreatedBy:          creatorID,
	}

	if err := gdb.Create(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create activity"})
		return
	}

	// Eager load relations
	gdb.Preload("Entrepreneur").Preload("ServiceProvision").Preload("Connection").
		Preload("CollaboratingHub").Preload("Creator").First(&activity, activity.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Activity created successfully",
		"activity": transformActivity(&activity),
	})
}

// GET /api/activities/hub/:id - Get activities for a hub
func GetHubActivities(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	hubID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid hub id"})
		return
	}

	// Parse pagination
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	offset := (page - 1) * limit

	var activities []db.HubActivity
	var total int64

	// Count total
	gdb.Model(&db.HubActivity{}).Where("hub_id = ?", hubID).Count(&total)

	// Fetch activities (pinned first, then by created_at desc)
	query := gdb.Where("hub_id = ?", hubID).
		Order("pinned DESC, created_at DESC").
		Limit(limit).
		Offset(offset).
		Preload("Entrepreneur").
		Preload("ServiceProvision").
		Preload("Connection").
		Preload("CollaboratingHub").
		Preload("Creator")

	if err := query.Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch activities"})
		return
	}

	transformed := make([]gin.H, len(activities))
	for i, activity := range activities {
		transformed[i] = transformActivity(&activity)
	}

	c.JSON(http.StatusOK, gin.H{
		"activities": transformed,
		"pagination": gin.H{
			"page":       page,
			"limit":      limit,
			"total":      total,
			"totalPages": (total + int64(limit) - 1) / int64(limit),
		},
	})
}

// PUT /api/activities/:id - Update activity
func UpdateActivity(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	activityID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid activity id"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	uid, _ := uuid.Parse(userID)

	// Fetch activity
	var activity db.HubActivity
	if err := gdb.First(&activity, activityID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "activity not found"})
		return
	}

	// Verify user is creator
	if activity.CreatedBy != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only update your own activities"})
		return
	}

	var req updateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	// Update fields
	if req.Title != nil {
		activity.Title = *req.Title
	}
	if req.Description != nil {
		activity.Description = *req.Description
	}

	if err := gdb.Save(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update activity"})
		return
	}

	// Reload with relations
	gdb.Preload("Entrepreneur").Preload("ServiceProvision").Preload("Connection").
		Preload("CollaboratingHub").Preload("Creator").First(&activity, activity.ID)

	c.JSON(http.StatusOK, gin.H{
		"message":  "Activity updated successfully",
		"activity": transformActivity(&activity),
	})
}

// DELETE /api/activities/:id - Delete activity
func DeleteActivity(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	activityID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid activity id"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	uid, _ := uuid.Parse(userID)

	// Fetch activity
	var activity db.HubActivity
	if err := gdb.First(&activity, activityID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "activity not found"})
		return
	}

	// Verify user is creator
	if activity.CreatedBy != uid {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own activities"})
		return
	}

	if err := gdb.Delete(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete activity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Activity deleted successfully"})
}

// PATCH /api/activities/:id/pin - Pin/unpin activity
func PinActivity(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	activityID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid activity id"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)
	uid, _ := uuid.Parse(userID)

	// Fetch activity
	var activity db.HubActivity
	if err := gdb.First(&activity, activityID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "activity not found"})
		return
	}

	// Verify user is CENTER_MANAGER of this hub
	if role == "CENTER_MANAGER" {
		var hub db.CommunityCenter
		if err := gdb.Where("id = ? AND manager_id = ?", activity.HubID, uid).First(&hub).Error; err != nil {
			c.JSON(http.StatusForbidden, gin.H{"error": "you are not the manager of this hub"})
			return
		}
	}

	var req struct {
		Pinned bool `json:"pinned"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	activity.Pinned = req.Pinned

	if err := gdb.Save(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update activity"})
		return
	}

	// Reload with relations
	gdb.Preload("Entrepreneur").Preload("ServiceProvision").Preload("Connection").
		Preload("CollaboratingHub").Preload("Creator").First(&activity, activity.ID)

	c.JSON(http.StatusOK, gin.H{
		"message":  "Activity pin status updated successfully",
		"activity": transformActivity(&activity),
	})
}

// Helper function to transform activity to JSON response
func transformActivity(activity *db.HubActivity) gin.H {
	result := gin.H{
		"id":          activity.ID,
		"hubId":       activity.HubID,
		"type":        activity.Type,
		"title":       activity.Title,
		"description": activity.Description,
		"pinned":      activity.Pinned,
		"createdBy":   activity.CreatedBy,
		"creatorName": activity.Creator.Name,
		"createdAt":   activity.CreatedAt,
		"updatedAt":   activity.UpdatedAt,
	}

	if activity.EntrepreneurID != nil {
		result["entrepreneurId"] = activity.EntrepreneurID
		if activity.Entrepreneur != nil {
			result["entrepreneurName"] = activity.Entrepreneur.BusinessName
		}
	}

	if activity.ServiceProvisionID != nil {
		result["serviceProvisionId"] = activity.ServiceProvisionID
		if activity.ServiceProvision != nil {
			result["serviceType"] = activity.ServiceProvision.ServiceType
		}
	}

	if activity.ConnectionID != nil {
		result["connectionId"] = activity.ConnectionID
	}

	if activity.CollaboratingHubID != nil {
		result["collaboratingHubId"] = activity.CollaboratingHubID
		if activity.CollaboratingHub != nil {
			result["collaboratingHubName"] = activity.CollaboratingHub.Name
		}
	}

	if activity.ImageURL != nil {
		result["imageUrl"] = activity.ImageURL
	}

	return result
}
