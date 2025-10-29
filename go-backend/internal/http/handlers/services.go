package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"communitycentresplatform/go-backend/internal/ctxutil"
	"communitycentresplatform/go-backend/internal/db"
)

type serviceProvisionRequest struct {
	HubID               string  `json:"hubId" binding:"required"`
	EntrepreneurID      string  `json:"entrepreneurId" binding:"required"`
	ServiceType         string  `json:"serviceType" binding:"required,min=2"`
	Description         string  `json:"description" binding:"required,min=10"`
	CollaboratingHubID  *string `json:"collaboratingHubId"`
	InvestorName        *string `json:"investorName"`
	InvestorDetails     *string `json:"investorDetails"`
	StartDate           *string `json:"startDate"` // ISO8601 format
}

// POST /api/services - Log service provision (CENTER_MANAGER/ADMIN)
func CreateServiceProvision(c *gin.Context) {
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

	var req serviceProvisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	// Parse required IDs
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

	// Parse optional collaborating hub ID
	var collaboratingHubID *uuid.UUID
	if req.CollaboratingHubID != nil && *req.CollaboratingHubID != "" {
		collabID, err := uuid.Parse(*req.CollaboratingHubID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid collaborating hub id"})
			return
		}
		// Verify collaborating hub exists
		var collabHub db.CommunityCenter
		if err := gdb.First(&collabHub, collabID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "collaborating hub not found"})
			return
		}
		collaboratingHubID = &collabID
	}

	// Parse optional start date
	var startDate *time.Time
	if req.StartDate != nil && *req.StartDate != "" {
		parsedDate, err := time.Parse(time.RFC3339, *req.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start date format, use ISO8601"})
			return
		}
		startDate = &parsedDate
	}

	serviceProvision := db.ServiceProvision{
		HubID:               hubID,
		EntrepreneurID:      entrepreneurID,
		ServiceType:         req.ServiceType,
		Description:         req.Description,
		CollaboratingHubID:  collaboratingHubID,
		InvestorName:        req.InvestorName,
		InvestorDetails:     req.InvestorDetails,
		StartDate:           startDate,
		Status:              db.ServicePending,
	}

	if err := gdb.Create(&serviceProvision).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create service provision"})
		return
	}

	// Preload relations
	gdb.Preload("Hub").Preload("Entrepreneur.User").Preload("CollaboratingHub").First(&serviceProvision, serviceProvision.ID)

	// Emit real-time event
	if br := ctxutil.BrokerFrom(c); br != nil {
		br.EmitCenterUpdate(hubID.String(), gin.H{
			"serviceId":       serviceProvision.ID,
			"hubId":           hubID,
			"entrepreneurId":  entrepreneurID,
			"serviceType":     serviceProvision.ServiceType,
			"action":          "service_created",
		})
	}

	// Build response
	response := gin.H{
		"id":             serviceProvision.ID,
		"hubId":          serviceProvision.HubID,
		"entrepreneurId": serviceProvision.EntrepreneurID,
		"serviceType":    serviceProvision.ServiceType,
		"description":    serviceProvision.Description,
		"status":         serviceProvision.Status,
		"startDate":      serviceProvision.StartDate,
		"createdAt":      serviceProvision.CreatedAt,
		"hub": gin.H{
			"id":       serviceProvision.Hub.ID,
			"name":     serviceProvision.Hub.Name,
			"location": serviceProvision.Hub.Location,
		},
		"entrepreneur": gin.H{
			"id":           serviceProvision.Entrepreneur.ID,
			"businessName": serviceProvision.Entrepreneur.BusinessName,
			"businessType": serviceProvision.Entrepreneur.BusinessType,
		},
	}

	// Add optional fields if present
	if serviceProvision.CollaboratingHubID != nil && serviceProvision.CollaboratingHub != nil {
		response["collaboratingHub"] = gin.H{
			"id":       serviceProvision.CollaboratingHub.ID,
			"name":     serviceProvision.CollaboratingHub.Name,
			"location": serviceProvision.CollaboratingHub.Location,
		}
	}
	if serviceProvision.InvestorName != nil {
		response["investorName"] = *serviceProvision.InvestorName
	}
	if serviceProvision.InvestorDetails != nil {
		response["investorDetails"] = *serviceProvision.InvestorDetails
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Service provision created successfully",
		"service": response,
	})
}

// GET /api/services/hub/:hubId - List services provided by hub (CENTER_MANAGER/ADMIN)
func GetHubServiceProvisions(c *gin.Context) {
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

	// Optional filters
	status := c.Query("status")
	serviceType := c.Query("serviceType")

	query := gdb.Preload("Hub").Preload("Entrepreneur.User").Preload("CollaboratingHub").
		Where("hub_id = ?", hubID)

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}

	var services []db.ServiceProvision
	if err := query.Order("created_at DESC").Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch service provisions"})
		return
	}

	// Transform response
	transformedServices := make([]gin.H, len(services))
	for i, s := range services {
		service := gin.H{
			"id":             s.ID,
			"hubId":          s.HubID,
			"entrepreneurId": s.EntrepreneurID,
			"serviceType":    s.ServiceType,
			"description":    s.Description,
			"status":         s.Status,
			"startDate":      s.StartDate,
			"completionDate": s.CompletionDate,
			"outcome":        s.Outcome,
			"createdAt":      s.CreatedAt,
			"updatedAt":      s.UpdatedAt,
			"entrepreneur": gin.H{
				"id":           s.Entrepreneur.ID,
				"businessName": s.Entrepreneur.BusinessName,
				"businessType": s.Entrepreneur.BusinessType,
				"user": gin.H{
					"name":  s.Entrepreneur.User.Name,
					"email": s.Entrepreneur.User.Email,
				},
			},
		}

		if s.CollaboratingHubID != nil && s.CollaboratingHub != nil {
			service["collaboratingHub"] = gin.H{
				"id":       s.CollaboratingHub.ID,
				"name":     s.CollaboratingHub.Name,
				"location": s.CollaboratingHub.Location,
			}
		}
		if s.InvestorName != nil {
			service["investorName"] = *s.InvestorName
		}
		if s.InvestorDetails != nil {
			service["investorDetails"] = *s.InvestorDetails
		}

		transformedServices[i] = service
	}

	c.JSON(http.StatusOK, gin.H{
		"services": transformedServices,
		"total":    len(transformedServices),
	})
}

// GET /api/services/entrepreneur/:entrepreneurId - List services received by entrepreneur
func GetEntrepreneurServices(c *gin.Context) {
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

	// Authorization: entrepreneur can view their own, admin/manager can view all
	role := ctxutil.RoleFrom(c)
	userID := ctxutil.UserIDFrom(c)

	if role == string(db.RoleEntrepreneur) {
		var entrepreneur db.Entrepreneur
		if err := gdb.First(&entrepreneur, entrepreneurID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "entrepreneur not found"})
			return
		}
		uid, _ := uuid.Parse(userID)
		if entrepreneur.UserID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized to view these services"})
			return
		}
	} else if role != string(db.RoleAdmin) && role != string(db.RoleCenterManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	// Optional filters
	status := c.Query("status")
	serviceType := c.Query("serviceType")

	query := gdb.Preload("Hub").Preload("CollaboratingHub").
		Where("entrepreneur_id = ?", entrepreneurID)

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if serviceType != "" {
		query = query.Where("service_type = ?", serviceType)
	}

	var services []db.ServiceProvision
	if err := query.Order("created_at DESC").Find(&services).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch service provisions"})
		return
	}

	// Transform response
	transformedServices := make([]gin.H, len(services))
	for i, s := range services {
		service := gin.H{
			"id":             s.ID,
			"hubId":          s.HubID,
			"entrepreneurId": s.EntrepreneurID,
			"serviceType":    s.ServiceType,
			"description":    s.Description,
			"status":         s.Status,
			"startDate":      s.StartDate,
			"completionDate": s.CompletionDate,
			"outcome":        s.Outcome,
			"createdAt":      s.CreatedAt,
			"updatedAt":      s.UpdatedAt,
			"hub": gin.H{
				"id":          s.Hub.ID,
				"name":        s.Hub.Name,
				"location":    s.Hub.Location,
				"description": s.Hub.Description,
			},
		}

		if s.CollaboratingHubID != nil && s.CollaboratingHub != nil {
			service["collaboratingHub"] = gin.H{
				"id":       s.CollaboratingHub.ID,
				"name":     s.CollaboratingHub.Name,
				"location": s.CollaboratingHub.Location,
			}
		}
		if s.InvestorName != nil {
			service["investorName"] = *s.InvestorName
		}
		if s.InvestorDetails != nil {
			service["investorDetails"] = *s.InvestorDetails
		}

		transformedServices[i] = service
	}

	c.JSON(http.StatusOK, gin.H{
		"services": transformedServices,
		"total":    len(transformedServices),
	})
}

// PUT /api/services/:id - Update service provision (CENTER_MANAGER/ADMIN)
func UpdateServiceProvision(c *gin.Context) {
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

	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service id"})
		return
	}

	var req struct {
		Status         *string `json:"status"`
		Outcome        *string `json:"outcome"`
		CompletionDate *string `json:"completionDate"` // ISO8601 format
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	var service db.ServiceProvision
	if err := gdb.First(&service, serviceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "service provision not found"})
		return
	}

	// Update status if provided
	if req.Status != nil {
		newStatus := db.ServiceProvisionStatus(*req.Status)
		if newStatus != db.ServicePending && newStatus != db.ServiceActive &&
		   newStatus != db.ServiceCompleted && newStatus != db.ServiceCancelled {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status value"})
			return
		}
		service.Status = newStatus

		// Auto-set completion date if status is COMPLETED or CANCELLED
		if (newStatus == db.ServiceCompleted || newStatus == db.ServiceCancelled) && service.CompletionDate == nil {
			now := time.Now()
			service.CompletionDate = &now
		}
	}

	// Update outcome if provided
	if req.Outcome != nil {
		service.Outcome = req.Outcome
	}

	// Update completion date if provided
	if req.CompletionDate != nil && *req.CompletionDate != "" {
		parsedDate, err := time.Parse(time.RFC3339, *req.CompletionDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid completion date format, use ISO8601"})
			return
		}
		service.CompletionDate = &parsedDate
	}

	if err := gdb.Save(&service).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update service provision"})
		return
	}

	// Preload relations for response
	gdb.Preload("Hub").Preload("Entrepreneur").Preload("CollaboratingHub").First(&service, service.ID)

	// Emit real-time event
	if br := ctxutil.BrokerFrom(c); br != nil {
		br.EmitCenterUpdate(service.HubID.String(), gin.H{
			"serviceId":      service.ID,
			"status":         service.Status,
			"action":         "service_updated",
			"entrepreneurId": service.EntrepreneurID,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Service provision updated successfully",
		"service": gin.H{
			"id":             service.ID,
			"status":         service.Status,
			"outcome":        service.Outcome,
			"completionDate": service.CompletionDate,
			"updatedAt":      service.UpdatedAt,
		},
	})
}

// GET /api/services/:id - Get single service provision details
func GetServiceProvision(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	serviceID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid service id"})
		return
	}

	var service db.ServiceProvision
	if err := gdb.Preload("Hub").Preload("Entrepreneur.User").Preload("CollaboratingHub").
		First(&service, serviceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "service provision not found"})
		return
	}

	// Authorization check
	role := ctxutil.RoleFrom(c)
	userID := ctxutil.UserIDFrom(c)

	if role == string(db.RoleEntrepreneur) {
		uid, _ := uuid.Parse(userID)
		if service.Entrepreneur.UserID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "not authorized to view this service"})
			return
		}
	} else if role != string(db.RoleAdmin) && role != string(db.RoleCenterManager) {
		c.JSON(http.StatusForbidden, gin.H{"error": "insufficient permissions"})
		return
	}

	response := gin.H{
		"id":             service.ID,
		"hubId":          service.HubID,
		"entrepreneurId": service.EntrepreneurID,
		"serviceType":    service.ServiceType,
		"description":    service.Description,
		"status":         service.Status,
		"startDate":      service.StartDate,
		"completionDate": service.CompletionDate,
		"outcome":        service.Outcome,
		"createdAt":      service.CreatedAt,
		"updatedAt":      service.UpdatedAt,
		"hub": gin.H{
			"id":          service.Hub.ID,
			"name":        service.Hub.Name,
			"location":    service.Hub.Location,
			"description": service.Hub.Description,
			"verified":    service.Hub.Verified,
		},
		"entrepreneur": gin.H{
			"id":           service.Entrepreneur.ID,
			"businessName": service.Entrepreneur.BusinessName,
			"businessType": service.Entrepreneur.BusinessType,
			"description":  service.Entrepreneur.Description,
			"user": gin.H{
				"name":  service.Entrepreneur.User.Name,
				"email": service.Entrepreneur.User.Email,
			},
		},
	}

	if service.CollaboratingHubID != nil && service.CollaboratingHub != nil {
		response["collaboratingHub"] = gin.H{
			"id":          service.CollaboratingHub.ID,
			"name":        service.CollaboratingHub.Name,
			"location":    service.CollaboratingHub.Location,
			"description": service.CollaboratingHub.Description,
		}
	}
	if service.InvestorName != nil {
		response["investorName"] = *service.InvestorName
	}
	if service.InvestorDetails != nil {
		response["investorDetails"] = *service.InvestorDetails
	}

	c.JSON(http.StatusOK, gin.H{
		"service": response,
	})
}
