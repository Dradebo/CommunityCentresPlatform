package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"communitycentresplatform/go-backend/internal/ctxutil"
	"communitycentresplatform/go-backend/internal/db"
)

// GET /api/messages/contact - Get contact messages (Admin only)
func GetContactMessages(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	messages, err := db.ListContactMessages(gdb, "", 0, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch contact messages"})
		return
	}

	// Transform to match Node.js format
	transformed := make([]gin.H, len(messages))
	for i, msg := range messages {
		transformed[i] = gin.H{
			"id":          msg.ID,
			"centerName":  msg.Center.Name,
			"centerId":    msg.CenterID,
			"senderName":  msg.SenderName,
			"senderEmail": msg.SenderEmail,
			"subject":     msg.Subject,
			"message":     msg.Message,
			"inquiryType": msg.InquiryType,
			"timestamp":   msg.CreatedAt,
			"status":      strings.ToLower(string(msg.Status)),
		}
	}

	c.JSON(http.StatusOK, gin.H{"messages": transformed})
}

// POST /api/messages/contact - Send contact message
func SendContactMessage(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var req struct {
		CenterID    string `json:"centerId" binding:"required"`
		Subject     string `json:"subject" binding:"required,min=5"`
		Message     string `json:"message" binding:"required,min=10"`
		InquiryType string `json:"inquiryType" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	userName := ctxutil.NameFrom(c)
	userEmail := ctxutil.EmailFrom(c)

	// Parse center ID
	centerID, err := uuid.Parse(req.CenterID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid centerId"})
		return
	}

	// Verify center exists
	center, err := db.FindCenterByID(gdb, centerID)
	if err != nil || center == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "center not found"})
		return
	}

	// Parse user ID
	senderUserID, _ := uuid.Parse(userID)

	// Create contact message
	contactMsg := &db.ContactMessage{
		CenterID:     centerID,
		SenderUserID: senderUserID,
		SenderName:   userName,
		SenderEmail:  userEmail,
		Subject:      req.Subject,
		Message:      req.Message,
		InquiryType:  req.InquiryType,
		Status:       db.ContactStatusPending,
	}

	if err := db.CreateContactMessage(gdb, contactMsg); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send contact message"})
		return
	}

	// Emit real-time event for admin notifications
	if br := ctxutil.BrokerFrom(c); br != nil {
		br.EmitNewMessage("admin", gin.H{
			"type":        "new-contact-message",
			"id":          contactMsg.ID,
			"centerName":  center.Name,
			"centerId":    contactMsg.CenterID,
			"senderName":  contactMsg.SenderName,
			"senderEmail": contactMsg.SenderEmail,
			"subject":     contactMsg.Subject,
			"inquiryType": contactMsg.InquiryType,
			"timestamp":   contactMsg.CreatedAt,
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Contact message sent successfully",
		"contactMessage": gin.H{
			"id":          contactMsg.ID,
			"centerName":  center.Name,
			"centerId":    contactMsg.CenterID,
			"senderName":  contactMsg.SenderName,
			"senderEmail": contactMsg.SenderEmail,
			"subject":     contactMsg.Subject,
			"message":     contactMsg.Message,
			"inquiryType": contactMsg.InquiryType,
			"timestamp":   contactMsg.CreatedAt,
			"status":      strings.ToLower(string(contactMsg.Status)),
		},
	})
}

// GET /api/messages/threads/:centerId - Get message threads for a center
func GetThreadsForCenter(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	centerIDStr := c.Param("centerId")
	centerID, err := uuid.Parse(centerIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid center id"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)

	// Verify user has access (admin or center manager)
	if role != "ADMIN" {
		uid, _ := uuid.Parse(userID)
		center, _ := db.FindCenterByID(gdb, centerID)
		if center == nil || center.ManagerID == nil || *center.ManagerID != uid {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied to this center"})
			return
		}
	}

	// Get threads
	threads, err := db.ListThreadsForCenter(gdb, centerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch threads"})
		return
	}

	// Transform to match Node.js format
	transformed := make([]gin.H, len(threads))
	for i, thread := range threads {
		// Get participant IDs and names
		participantIDs := make([]uuid.UUID, len(thread.Participants))
		participantNames := make([]string, len(thread.Participants))
		for j, p := range thread.Participants {
			participantIDs[j] = p.ID
			participantNames[j] = p.Name
		}

		// Get last message
		var lastMessage interface{}
		if len(thread.Messages) > 0 {
			msg := thread.Messages[0]
			lastMessage = gin.H{
				"id":         msg.ID,
				"threadId":   msg.ThreadID,
				"senderId":   msg.SenderID,
				"senderName": msg.Sender.Name,
				"content":    msg.Content,
				"timestamp":  msg.CreatedAt,
				"read":       msg.Read,
			}
		}

		transformed[i] = gin.H{
			"id":               thread.ID,
			"participants":     participantIDs,
			"participantNames": participantNames,
			"subject":          thread.Subject,
			"lastMessage":      lastMessage,
			"lastActivity":     thread.LastActivity,
			"messageCount":     thread.MessageCount,
		}
	}

	c.JSON(http.StatusOK, gin.H{"threads": transformed})
}

// GET /api/messages/threads/:threadId/messages - Get messages in a thread
func GetThreadMessages(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	threadIDStr := c.Param("threadId")
	threadID, err := uuid.Parse(threadIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid thread id"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)

	// Verify thread exists
	thread, err := db.FindThreadByID(gdb, threadID)
	if err != nil || thread == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found or access denied"})
		return
	}

	// Verify access (admin or participant's manager)
	hasAccess := role == "ADMIN"
	if !hasAccess {
		uid, _ := uuid.Parse(userID)
		for _, participant := range thread.Participants {
			if participant.ManagerID != nil && *participant.ManagerID == uid {
				hasAccess = true
				break
			}
		}
	}

	if !hasAccess {
		c.JSON(http.StatusForbidden, gin.H{"error": "thread not found or access denied"})
		return
	}

	// Get messages
	messages, err := db.ListMessagesInThread(gdb, threadID, 0, 0)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch messages"})
		return
	}

	// Transform to match Node.js format
	transformed := make([]gin.H, len(messages))
	for i, msg := range messages {
		transformed[i] = gin.H{
			"id":         msg.ID,
			"threadId":   msg.ThreadID,
			"senderId":   msg.SenderID,
			"senderName": msg.Sender.Name,
			"content":    msg.Content,
			"timestamp":  msg.CreatedAt,
			"read":       msg.Read,
		}
	}

	c.JSON(http.StatusOK, gin.H{"messages": transformed})
}

// POST /api/messages/threads/:threadId/messages - Send message to thread
func SendThreadMessage(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	threadIDStr := c.Param("threadId")
	threadID, err := uuid.Parse(threadIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid thread id"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)
	uid, _ := uuid.Parse(userID)

	// Find a center managed by this user to send from
	var senderCenter *db.CommunityCenter
	if role == "ADMIN" {
		// Admin can send from any verified center
		centers, _ := db.ListCenters(gdb, db.CenterFilters{VerificationStatus: "verified", Limit: 1})
		if len(centers) > 0 {
			senderCenter = &centers[0]
		}
	} else {
		// Find center managed by this user
		centers, _ := db.ListCenters(gdb, db.CenterFilters{Limit: 100})
		for _, center := range centers {
			if center.ManagerID != nil && *center.ManagerID == uid {
				senderCenter = &center
				break
			}
		}
	}

	if senderCenter == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "no center found to send message from"})
		return
	}

	// Verify thread exists and user has access
	thread, err := db.FindThreadByID(gdb, threadID)
	if err != nil || thread == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "thread not found or access denied"})
		return
	}

	// Check if sender's center is a participant
	isParticipant := false
	for _, participant := range thread.Participants {
		if participant.ID == senderCenter.ID {
			isParticipant = true
			break
		}
	}

	if !isParticipant {
		c.JSON(http.StatusForbidden, gin.H{"error": "thread not found or access denied"})
		return
	}

	// Create message (transaction updates thread metadata)
	message, err := db.CreateMessage(gdb, threadID, senderCenter.ID, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send message"})
		return
	}

	// Emit real-time event
	if br := ctxutil.BrokerFrom(c); br != nil {
		br.EmitNewMessage(threadID.String(), gin.H{
			"id":         message.ID,
			"threadId":   message.ThreadID,
			"senderId":   message.SenderID,
			"senderName": senderCenter.Name,
			"content":    message.Content,
			"timestamp":  message.CreatedAt,
			"read":       message.Read,
		})
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Message sent successfully",
		"centerMessage": gin.H{
			"id":         message.ID,
			"threadId":   message.ThreadID,
			"senderId":   message.SenderID,
			"senderName": senderCenter.Name,
			"content":    message.Content,
			"timestamp":  message.CreatedAt,
			"read":       message.Read,
		},
	})
}

// POST /api/messages/threads - Create new message thread
func CreateThread(c *gin.Context) {
	gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var req struct {
		ParticipantIDs []string `json:"participantIds" binding:"required,min=2"`
		Subject        string   `json:"subject" binding:"required,min=5"`
		InitialMessage string   `json:"initialMessage" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

	userID := ctxutil.UserIDFrom(c)
	role := ctxutil.RoleFrom(c)
	uid, _ := uuid.Parse(userID)

	// Find sender center
	var senderCenter *db.CommunityCenter
	if role == "ADMIN" {
		centers, _ := db.ListCenters(gdb, db.CenterFilters{VerificationStatus: "verified", Limit: 1})
		if len(centers) > 0 {
			senderCenter = &centers[0]
		}
	} else {
		centers, _ := db.ListCenters(gdb, db.CenterFilters{Limit: 100})
		for _, center := range centers {
			if center.ManagerID != nil && *center.ManagerID == uid {
				senderCenter = &center
				break
			}
		}
	}

	if senderCenter == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "no center found to send message from"})
		return
	}

	// Parse participant IDs
	participantIDs := make([]uuid.UUID, len(req.ParticipantIDs))
	for i, idStr := range req.ParticipantIDs {
		id, err := uuid.Parse(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid participantIds"})
			return
		}
		participantIDs[i] = id
	}

	// Create thread with participants
	thread, err := db.CreateMessageThread(gdb, req.Subject, participantIDs)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create thread"})
		return
	}

	// Create initial message
	message, err := db.CreateMessage(gdb, thread.ID, senderCenter.ID, req.InitialMessage)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send initial message"})
		return
	}

	// Get participant names
	participantNames := make([]string, len(thread.Participants))
	for i, p := range thread.Participants {
		participantNames[i] = p.Name
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Thread created successfully",
		"thread": gin.H{
			"id":               thread.ID,
			"participants":     participantIDs,
			"participantNames": participantNames,
			"subject":          thread.Subject,
			"lastMessage": gin.H{
				"id":         message.ID,
				"threadId":   message.ThreadID,
				"senderId":   message.SenderID,
				"senderName": senderCenter.Name,
				"content":    message.Content,
				"timestamp":  message.CreatedAt,
				"read":       message.Read,
			},
			"lastActivity": thread.LastActivity,
			"messageCount": thread.MessageCount,
		},
	})
}
