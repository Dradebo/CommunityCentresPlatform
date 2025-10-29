package db

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ListThreadsForCenter retrieves all message threads for a center
func ListThreadsForCenter(db *gorm.DB, centerID uuid.UUID) ([]MessageThread, error) {
	var threads []MessageThread
	err := db.
		Joins("JOIN message_thread_participants ON message_thread_participants.message_thread_id = message_threads.id").
		Where("message_thread_participants.community_center_id = ?", centerID).
		Preload("Participants").
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(1) // Load last message for preview
		}).
		Order("last_activity DESC").
		Find(&threads).Error

	return threads, err
}

// ListThreadsForUser retrieves message threads for a user's managed centers
func ListThreadsForUser(db *gorm.DB, userID uuid.UUID) ([]MessageThread, error) {
	// First find all centers managed by this user
	var centers []CommunityCenter
	err := db.Where("manager_id = ?", userID).Find(&centers).Error
	if err != nil {
		return nil, err
	}

	if len(centers) == 0 {
		return []MessageThread{}, nil
	}

	// Collect center IDs
	centerIDs := make([]uuid.UUID, len(centers))
	for i, c := range centers {
		centerIDs[i] = c.ID
	}

	// Find threads for these centers
	var threads []MessageThread
	err = db.
		Joins("JOIN message_thread_participants ON message_thread_participants.message_thread_id = message_threads.id").
		Where("message_thread_participants.community_center_id IN ?", centerIDs).
		Preload("Participants").
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(1)
		}).
		Order("last_activity DESC").
		Find(&threads).Error

	return threads, err
}

// ListMessagesInThread retrieves messages in a thread with pagination
func ListMessagesInThread(db *gorm.DB, threadID uuid.UUID, limit, offset int) ([]CenterMessage, error) {
	var messages []CenterMessage
	query := db.Where("thread_id = ?", threadID).
		Preload("Sender").
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	err := query.Find(&messages).Error
	return messages, err
}

// CreateMessageThread creates a new message thread
func CreateMessageThread(db *gorm.DB, subject string, participantIDs []uuid.UUID) (*MessageThread, error) {
	// Find participant centers
	var participants []CommunityCenter
	err := db.Where("id IN ?", participantIDs).Find(&participants).Error
	if err != nil {
		return nil, err
	}

	thread := &MessageThread{
		Subject:      subject,
		LastActivity: time.Now(),
		MessageCount: 0,
		Participants: participants,
	}

	err = db.Create(thread).Error
	if err != nil {
		return nil, err
	}

	return thread, nil
}

// CreateMessage creates a new message in a thread (with transaction to update thread metadata)
func CreateMessage(db *gorm.DB, threadID, senderID uuid.UUID, content string) (*CenterMessage, error) {
	var message *CenterMessage
	var thread MessageThread

	// Use transaction to ensure atomicity
	err := db.Transaction(func(tx *gorm.DB) error {
		// Create the message
		message = &CenterMessage{
			ThreadID: threadID,
			SenderID: senderID,
			Content:  content,
			Read:     false,
		}

		if err := tx.Create(message).Error; err != nil {
			return err
		}

		// Update thread's last activity and message count
		if err := tx.Where("id = ?", threadID).First(&thread).Error; err != nil {
			return err
		}

		thread.LastActivity = time.Now()
		thread.MessageCount++

		if err := tx.Save(&thread).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Load sender info for response
	db.Preload("Sender").First(message, message.ID)

	return message, nil
}

// MarkMessagesAsRead marks messages in a thread as read
func MarkMessagesAsRead(db *gorm.DB, threadID, centerID uuid.UUID) error {
	// Mark all messages in thread as read, except those sent by this center
	return db.Model(&CenterMessage{}).
		Where("thread_id = ? AND sender_id != ? AND read = ?", threadID, centerID, false).
		Update("read", true).Error
}

// FindThreadByID retrieves a thread by ID
func FindThreadByID(db *gorm.DB, threadID uuid.UUID) (*MessageThread, error) {
	var thread MessageThread
	err := db.Preload("Participants").Where("id = ?", threadID).First(&thread).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &thread, nil
}

// CreateContactMessage creates a visitor contact message to a center
func CreateContactMessage(db *gorm.DB, msg *ContactMessage) error {
	return db.Create(msg).Error
}

// ListContactMessages retrieves all contact messages (admin only)
func ListContactMessages(db *gorm.DB, status string, limit, offset int) ([]ContactMessage, error) {
	query := db.Preload("Center").Preload("Sender").Order("created_at DESC")

	if status != "" && status != "all" {
		query = query.Where("status = ?", strings.ToUpper(status))
	}

	if limit > 0 {
		query = query.Limit(limit)
	}
	if offset > 0 {
		query = query.Offset(offset)
	}

	var messages []ContactMessage
	err := query.Find(&messages).Error
	return messages, err
}

// UpdateContactMessageStatus updates the status of a contact message
func UpdateContactMessageStatus(db *gorm.DB, messageID uuid.UUID, status ContactMessageStatus) error {
	return db.Model(&ContactMessage{}).Where("id = ?", messageID).Update("status", status).Error
}
