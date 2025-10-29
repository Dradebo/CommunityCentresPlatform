package main

import (
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"communitycentresplatform/go-backend/internal/auth"
	"communitycentresplatform/go-backend/internal/config"
	"communitycentresplatform/go-backend/internal/db"
)

func main() {
	// Load environment variables
	_ = godotenv.Load()
	cfg := config.Load()

	// Connect to database
	database, err := db.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	// Auto-migrate schema first
	if err := db.AutoMigrate(database.DB); err != nil {
		log.Fatalf("auto-migrate failed: %v", err)
	}

	fmt.Println("Starting database seed...")

	// Create admin user
	adminPassword, _ := auth.HashPassword("admin123")
	admin := db.User{
		Email:    "admin@kampalacenters.org",
		Password: adminPassword,
		Name:     "System Administrator",
		Role:     db.RoleAdmin,
		Verified: true,
	}

	result := database.DB.Where("email = ?", admin.Email).FirstOrCreate(&admin)
	if result.Error != nil {
		log.Fatalf("failed to create admin user: %v", result.Error)
	}
	fmt.Printf("Created admin user: %s\n", admin.Email)

	// Create visitor user
	visitorPassword, _ := auth.HashPassword("visitor123")
	visitor := db.User{
		Email:    "visitor@example.com",
		Password: visitorPassword,
		Name:     "Test Visitor",
		Role:     db.RoleVisitor,
		Verified: true,
	}

	result = database.DB.Where("email = ?", visitor.Email).FirstOrCreate(&visitor)
	if result.Error != nil {
		log.Fatalf("failed to create visitor user: %v", result.Error)
	}
	fmt.Printf("Created visitor user: %s\n", visitor.Email)

	// Define community centers
	centerData := []struct {
		center      db.CommunityCenter
		isAdmin     bool
	}{
		{
			center: db.CommunityCenter{
				Name:        "Kampala Community Hub",
				Location:    "Central Division, Kampala",
				Latitude:    0.3476,
				Longitude:   32.5825,
				Services:    db.StringArray{"Skills Training", "Healthcare", "Education", "Microfinance"},
				Description: "A comprehensive community center serving Central Kampala with various social services.",
				Verified:    true,
				AddedBy:     admin.ID.String(),
				ManagerID:   &admin.ID,
				Phone:       stringPtr("+256-700-123456"),
				Email:       stringPtr("info@kampalahub.org"),
				Website:     stringPtr("www.kampalahub.org"),
			},
			isAdmin: true,
		},
		{
			center: db.CommunityCenter{
				Name:        "Makerere Community Center",
				Location:    "Kawempe Division, Kampala",
				Latitude:    0.3354,
				Longitude:   32.5659,
				Services:    db.StringArray{"Youth Programs", "Computer Training", "Library"},
				Description: "Located near Makerere University, focusing on youth development and education.",
				Verified:    true,
				AddedBy:     admin.ID.String(),
				ManagerID:   &admin.ID,
				Phone:       stringPtr("+256-700-234567"),
				Email:       stringPtr("contact@makererecenter.org"),
			},
			isAdmin: true,
		},
		{
			center: db.CommunityCenter{
				Name:        "Mengo Women's Center",
				Location:    "Rubaga Division, Kampala",
				Latitude:    0.3029,
				Longitude:   32.5599,
				Services:    db.StringArray{"Women Empowerment", "Childcare", "Vocational Training"},
				Description: "Dedicated to empowering women and supporting families in the Mengo area.",
				Verified:    false,
				AddedBy:     visitor.ID.String(),
				Phone:       stringPtr("+256-700-345678"),
			},
			isAdmin: false,
		},
		{
			center: db.CommunityCenter{
				Name:        "Nakawa Skills Center",
				Location:    "Nakawa Division, Kampala",
				Latitude:    0.3373,
				Longitude:   32.6268,
				Services:    db.StringArray{"Vocational Training", "Computer Training", "Skills Training"},
				Description: "Focused on providing technical and vocational skills to youth in Nakawa.",
				Verified:    true,
				AddedBy:     admin.ID.String(),
				ManagerID:   &admin.ID,
				Phone:       stringPtr("+256-700-456789"),
				Email:       stringPtr("info@nakawaskills.org"),
			},
			isAdmin: true,
		},
		{
			center: db.CommunityCenter{
				Name:        "Makindye Health & Wellness",
				Location:    "Makindye Division, Kampala",
				Latitude:    0.2735,
				Longitude:   32.6055,
				Services:    db.StringArray{"Healthcare", "Mental Health", "Women Empowerment"},
				Description: "Community health center providing medical services and wellness programs.",
				Verified:    false,
				AddedBy:     visitor.ID.String(),
				Phone:       stringPtr("+256-700-567890"),
			},
			isAdmin: false,
		},
		{
			center: db.CommunityCenter{
				Name:        "Rubaga Youth Sports Club",
				Location:    "Rubaga Division, Kampala",
				Latitude:    0.3025,
				Longitude:   32.5590,
				Services:    db.StringArray{"Sports & Recreation", "Youth Programs", "Community Events"},
				Description: "Sports and recreation center engaging youth through various athletic programs.",
				Verified:    true,
				AddedBy:     admin.ID.String(),
				ManagerID:   &admin.ID,
				Phone:       stringPtr("+256-700-678901"),
				Email:       stringPtr("info@rubagasports.org"),
			},
			isAdmin: true,
		},
		{
			center: db.CommunityCenter{
				Name:        "Central Library & Learning Hub",
				Location:    "Central Division, Kampala",
				Latitude:    0.3480,
				Longitude:   32.5830,
				Services:    db.StringArray{"Library", "Education", "Computer Training", "Adult Literacy"},
				Description: "Public library offering educational resources, computer access, and learning programs.",
				Verified:    true,
				AddedBy:     admin.ID.String(),
				ManagerID:   &admin.ID,
				Phone:       stringPtr("+256-700-789012"),
				Email:       stringPtr("library@centrallearning.org"),
				Website:     stringPtr("www.centrallearninghub.org"),
			},
			isAdmin: true,
		},
		{
			center: db.CommunityCenter{
				Name:        "Kawempe Legal Aid Center",
				Location:    "Kawempe Division, Kampala",
				Latitude:    0.3360,
				Longitude:   32.5665,
				Services:    db.StringArray{"Legal Aid", "Community Events", "Education"},
				Description: "Provides free legal assistance and education to community members.",
				Verified:    false,
				AddedBy:     visitor.ID.String(),
				Phone:       stringPtr("+256-700-890123"),
			},
			isAdmin: false,
		},
	}

	// Create centers
	var centers []db.CommunityCenter
	for _, data := range centerData {
		var center db.CommunityCenter
		result := database.DB.Where("name = ?", data.center.Name).FirstOrCreate(&center, data.center)
		if result.Error != nil {
			log.Printf("failed to create center %s: %v", data.center.Name, result.Error)
			continue
		}
		centers = append(centers, center)
		fmt.Printf("Created center: %s\n", center.Name)
	}

	if len(centers) < 8 {
		log.Printf("Warning: only created %d centers out of 8", len(centers))
	}

	// Create connections between centers
	connections := [][]int{
		{0, 1}, // Kampala Hub <-> Makerere
		{0, 2}, // Kampala Hub <-> Mengo Women's
		{1, 6}, // Makerere <-> Central Library
		{5, 2}, // Rubaga Sports <-> Mengo Women's
	}

	for _, conn := range connections {
		if conn[0] >= len(centers) || conn[1] >= len(centers) {
			continue
		}

		connection := db.Connection{
			CenterAID: centers[conn[0]].ID,
			CenterBID: centers[conn[1]].ID,
		}

		// Check if connection already exists (either direction)
		var existing db.Connection
		result := database.DB.Where(
			"(center_a_id = ? AND center_b_id = ?) OR (center_a_id = ? AND center_b_id = ?)",
			connection.CenterAID, connection.CenterBID,
			connection.CenterBID, connection.CenterAID,
		).First(&existing)

		if result.Error != nil {
			// Connection doesn't exist, create it
			if err := database.DB.Create(&connection).Error; err != nil {
				log.Printf("failed to create connection: %v", err)
				continue
			}
			fmt.Printf("Connected centers: %s <-> %s\n", centers[conn[0]].Name, centers[conn[1]].Name)
		}
	}

	// Create sample contact message
	if len(centers) > 0 {
		message := db.ContactMessage{
			CenterID:       centers[0].ID,
			SenderUserID:   visitor.ID,
			SenderName:     visitor.Name,
			SenderEmail:    visitor.Email,
			Subject:        "Inquiry about Skills Training Programs",
			Message:        "Hello, I would like to know more about the skills training programs you offer. What are the requirements and schedules?",
			InquiryType:    "Program Information",
			Status:         db.ContactStatusPending,
		}

		var existing db.ContactMessage
		result := database.DB.Where("subject = ? AND sender_email = ?", message.Subject, message.SenderEmail).First(&existing)
		if result.Error != nil {
			if err := database.DB.Create(&message).Error; err != nil {
				log.Printf("failed to create contact message: %v", err)
			} else {
				fmt.Println("Created sample contact message")
			}
		}
	}

	fmt.Println("\nDatabase seeded successfully!")
	fmt.Println("\nLogin credentials:")
	fmt.Println("Admin: admin@kampalacenters.org / admin123")
	fmt.Println("Visitor: visitor@example.com / visitor123")
	fmt.Printf("\nCreated %d community centers across Kampala divisions\n", len(centers))
}

// Helper function to create string pointers
func stringPtr(s string) *string {
	return &s
}

// Helper function to create uuid pointers
func uuidPtr(id uuid.UUID) *uuid.UUID {
	return &id
}
