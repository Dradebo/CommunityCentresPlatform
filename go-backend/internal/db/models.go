package db

import (
	"database/sql/driver"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// Enums matching Prisma schema exactly
type Role string

const (
	RoleVisitor       Role = "VISITOR"
	RoleCenterManager Role = "CENTER_MANAGER"
	RoleAdmin         Role = "ADMIN"
	RoleEntrepreneur  Role = "ENTREPRENEUR"
)

type ContactMessageStatus string

const (
	ContactStatusPending   ContactMessageStatus = "PENDING"
	ContactStatusForwarded ContactMessageStatus = "FORWARDED"
	ContactStatusResolved  ContactMessageStatus = "RESOLVED"
)

type EnrollmentStatus string

const (
	EnrollmentActive    EnrollmentStatus = "ACTIVE"
	EnrollmentCompleted EnrollmentStatus = "COMPLETED"
	EnrollmentSuspended EnrollmentStatus = "SUSPENDED"
	EnrollmentPending   EnrollmentStatus = "PENDING"
)

type ServiceProvisionStatus string

const (
	ServicePending   ServiceProvisionStatus = "PENDING"
	ServiceActive    ServiceProvisionStatus = "ACTIVE"
	ServiceCompleted ServiceProvisionStatus = "COMPLETED"
	ServiceCancelled ServiceProvisionStatus = "CANCELLED"
)

type RoleUpgradeRequestStatus string

const (
	UpgradeRequestPending  RoleUpgradeRequestStatus = "PENDING"
	UpgradeRequestApproved RoleUpgradeRequestStatus = "APPROVED"
	UpgradeRequestRejected RoleUpgradeRequestStatus = "REJECTED"
)

// StringArray type for PostgreSQL TEXT[] arrays (services field)
type StringArray []string

func (a StringArray) Value() (driver.Value, error) {
	return pq.Array(a).Value()
}

func (a *StringArray) Scan(value interface{}) error {
	arr := pq.StringArray{}
	if err := arr.Scan(value); err != nil {
		return err
	}
	*a = StringArray(arr)
	return nil
}

// User model matching Prisma exactly
type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;column:id"`
	Email        string    `gorm:"uniqueIndex;size:255;not null;column:email"`
	Password     string    `gorm:"size:255;not null;column:password"`
	Name         string    `gorm:"size:255;not null;column:name"`
	Role         Role      `gorm:"type:varchar(20);not null;default:'VISITOR';column:role"`
	Verified     bool      `gorm:"default:false;not null;column:verified"`
	GoogleID     *string   `gorm:"uniqueIndex;size:255;column:google_id"`        // Google's unique user ID
	PictureURL   *string   `gorm:"size:500;column:picture_url"`                  // User's profile picture URL
	AuthProvider string    `gorm:"size:20;not null;default:'EMAIL';column:auth_provider"` // EMAIL or GOOGLE
	CreatedAt    time.Time `gorm:"column:created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at"`

	// Relations
	ManagedCenters  []CommunityCenter `gorm:"foreignKey:ManagerID"`
	ContactMessages []ContactMessage  `gorm:"foreignKey:SenderUserID"`
}

func (User) TableName() string {
	return "users"
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// CommunityCenter model matching Prisma exactly
type CommunityCenter struct {
	ID          uuid.UUID   `gorm:"type:uuid;primaryKey;column:id"`
	Name        string      `gorm:"size:255;not null;column:name"`
	Location    string      `gorm:"size:255;not null;column:location"`
	Latitude    float64     `gorm:"type:double precision;not null;column:latitude"`
	Longitude   float64     `gorm:"type:double precision;not null;column:longitude"`
	Services    StringArray `gorm:"type:text[];column:services"` // PostgreSQL array
	Resources   StringArray `gorm:"type:text[];column:resources"` // PostgreSQL array for resources available
	Description string      `gorm:"type:text;column:description"`
	Verified    bool        `gorm:"default:false;not null;column:verified"`
	AddedBy     string      `gorm:"size:255;not null;column:added_by"` // User ID who added center
	ManagerID   *uuid.UUID  `gorm:"type:uuid;column:manager_id"`       // Optional manager
	CreatedAt   time.Time   `gorm:"column:created_at"`
	UpdatedAt   time.Time   `gorm:"column:updated_at"`

	// Contact Information (optional fields)
	Phone   *string `gorm:"size:50;column:phone"`
	Email   *string `gorm:"size:255;column:email"`
	Website *string `gorm:"size:500;column:website"`

	// Relations
	Manager            *User             `gorm:"foreignKey:ManagerID"`
	ConnectionsFrom    []Connection      `gorm:"foreignKey:CenterAID"`
	ConnectionsTo      []Connection      `gorm:"foreignKey:CenterBID"`
	ContactMessages    []ContactMessage  `gorm:"foreignKey:CenterID"`
	MessageThreads     []MessageThread   `gorm:"many2many:message_thread_participants;"`
	SentMessages       []CenterMessage   `gorm:"foreignKey:SenderID"`
}

func (CommunityCenter) TableName() string {
	return "community_centers"
}

func (c *CommunityCenter) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Connection model - bidirectional relationship between centers
type Connection struct {
	ID                      uuid.UUID `gorm:"type:uuid;primaryKey;column:id"`
	CenterAID               uuid.UUID `gorm:"type:uuid;not null;column:center_a_id;uniqueIndex:idx_center_connection"`
	CenterBID               uuid.UUID `gorm:"type:uuid;not null;column:center_b_id;uniqueIndex:idx_center_connection"`
	CollaborationType       *string   `gorm:"size:100;column:collaboration_type"`       // e.g., "Resource Sharing", "Joint Programs"
	CollaborationDescription *string   `gorm:"type:text;column:collaboration_description"` // Details about the collaboration
	Active                  bool      `gorm:"default:true;not null;column:active"`
	CreatedAt               time.Time `gorm:"column:created_at"`
	UpdatedAt               time.Time `gorm:"column:updated_at"`

	// Relations
	CenterA CommunityCenter `gorm:"foreignKey:CenterAID;constraint:OnDelete:CASCADE"`
	CenterB CommunityCenter `gorm:"foreignKey:CenterBID;constraint:OnDelete:CASCADE"`
}

func (Connection) TableName() string {
	return "connections"
}

func (c *Connection) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// ContactMessage model - visitor inquiries to centers
type ContactMessage struct {
	ID           uuid.UUID            `gorm:"type:uuid;primaryKey;column:id"`
	CenterID     uuid.UUID            `gorm:"type:uuid;not null;column:center_id"`
	SenderUserID uuid.UUID            `gorm:"type:uuid;not null;column:sender_user_id"`
	SenderName   string               `gorm:"size:255;not null;column:sender_name"`
	SenderEmail  string               `gorm:"size:255;not null;column:sender_email"`
	Subject      string               `gorm:"size:500;not null;column:subject"`
	Message      string               `gorm:"type:text;not null;column:message"`
	InquiryType  string               `gorm:"size:100;not null;column:inquiry_type"`
	Status       ContactMessageStatus `gorm:"type:varchar(20);not null;default:'PENDING';column:status"`
	CreatedAt    time.Time            `gorm:"column:created_at"`
	UpdatedAt    time.Time            `gorm:"column:updated_at"`

	// Relations
	Center CommunityCenter `gorm:"foreignKey:CenterID;constraint:OnDelete:CASCADE"`
	Sender User            `gorm:"foreignKey:SenderUserID"`
}

func (ContactMessage) TableName() string {
	return "contact_messages"
}

func (c *ContactMessage) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// MessageThread model - conversation threads between centers
type MessageThread struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;column:id"`
	Subject      string    `gorm:"size:500;not null;column:subject"`
	LastActivity time.Time `gorm:"not null;column:last_activity"`
	MessageCount int       `gorm:"default:0;not null;column:message_count"`
	CreatedAt    time.Time `gorm:"column:created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at"`

	// Relations
	Participants []CommunityCenter `gorm:"many2many:message_thread_participants;"`
	Messages     []CenterMessage   `gorm:"foreignKey:ThreadID"`
}

func (MessageThread) TableName() string {
	return "message_threads"
}

func (m *MessageThread) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	if m.LastActivity.IsZero() {
		m.LastActivity = time.Now()
	}
	return nil
}

// CenterMessage model - messages within threads
type CenterMessage struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;column:id"`
	ThreadID  uuid.UUID `gorm:"type:uuid;not null;index;column:thread_id"`
	SenderID  uuid.UUID `gorm:"type:uuid;not null;index;column:sender_id"`
	Content   string    `gorm:"type:text;not null;column:content"`
	Read      bool      `gorm:"default:false;not null;column:read"`
	CreatedAt time.Time `gorm:"column:created_at"`

	// Relations
	Thread MessageThread   `gorm:"foreignKey:ThreadID;constraint:OnDelete:CASCADE"`
	Sender CommunityCenter `gorm:"foreignKey:SenderID"`
}

func (CenterMessage) TableName() string {
	return "center_messages"
}

func (c *CenterMessage) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

// Entrepreneur model - business profiles for entrepreneurs
type Entrepreneur struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;column:id"`
	UserID       uuid.UUID `gorm:"type:uuid;not null;uniqueIndex;column:user_id"`
	BusinessName string    `gorm:"size:255;not null;column:business_name"`
	BusinessType string    `gorm:"size:100;not null;column:business_type"`
	Description  string    `gorm:"type:text;column:description"`
	Phone        *string   `gorm:"size:50;column:phone"`
	Email        *string   `gorm:"size:255;column:email"`
	Website      *string   `gorm:"size:500;column:website"`
	Verified     bool      `gorm:"default:false;not null;column:verified"`
	CreatedAt    time.Time `gorm:"column:created_at"`
	UpdatedAt    time.Time `gorm:"column:updated_at"`

	// Relations
	User                User                `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Enrollments         []HubEnrollment     `gorm:"foreignKey:EntrepreneurID"`
	ServicesReceived    []ServiceProvision  `gorm:"foreignKey:EntrepreneurID"`
}

func (Entrepreneur) TableName() string {
	return "entrepreneurs"
}

func (e *Entrepreneur) BeforeCreate(tx *gorm.DB) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// HubEnrollment model - tracks entrepreneur enrollment in hubs
type HubEnrollment struct {
	ID             uuid.UUID        `gorm:"type:uuid;primaryKey;column:id"`
	HubID          uuid.UUID        `gorm:"type:uuid;not null;index;column:hub_id"`
	EntrepreneurID uuid.UUID        `gorm:"type:uuid;not null;index;column:entrepreneur_id"`
	Status         EnrollmentStatus `gorm:"type:varchar(20);not null;default:'PENDING';column:status"`
	EnrollmentDate *time.Time       `gorm:"column:enrollment_date"`
	CompletionDate *time.Time       `gorm:"column:completion_date"`
	CreatedAt      time.Time        `gorm:"column:created_at"`
	UpdatedAt      time.Time        `gorm:"column:updated_at"`

	// Relations
	Hub          CommunityCenter `gorm:"foreignKey:HubID;constraint:OnDelete:CASCADE"`
	Entrepreneur Entrepreneur    `gorm:"foreignKey:EntrepreneurID;constraint:OnDelete:CASCADE"`
}

func (HubEnrollment) TableName() string {
	return "hub_enrollments"
}

func (h *HubEnrollment) BeforeCreate(tx *gorm.DB) error {
	if h.ID == uuid.Nil {
		h.ID = uuid.New()
	}
	return nil
}

// ServiceProvision model - tracks services provided by hubs to entrepreneurs
type ServiceProvision struct {
	ID                  uuid.UUID              `gorm:"type:uuid;primaryKey;column:id"`
	HubID               uuid.UUID              `gorm:"type:uuid;not null;index;column:hub_id"`
	EntrepreneurID      uuid.UUID              `gorm:"type:uuid;not null;index;column:entrepreneur_id"`
	ServiceType         string                 `gorm:"size:100;not null;column:service_type"`
	Description         string                 `gorm:"type:text;column:description"`
	CollaboratingHubID  *uuid.UUID             `gorm:"type:uuid;column:collaborating_hub_id"`
	InvestorName        *string                `gorm:"size:255;column:investor_name"`
	InvestorDetails     *string                `gorm:"type:text;column:investor_details"`
	StartDate           *time.Time             `gorm:"column:start_date"`
	CompletionDate      *time.Time             `gorm:"column:completion_date"`
	Status              ServiceProvisionStatus `gorm:"type:varchar(20);not null;default:'PENDING';column:status"`
	Outcome             *string                `gorm:"type:text;column:outcome"`
	CreatedAt           time.Time              `gorm:"column:created_at"`
	UpdatedAt           time.Time              `gorm:"column:updated_at"`

	// Relations
	Hub              CommunityCenter  `gorm:"foreignKey:HubID;constraint:OnDelete:CASCADE"`
	Entrepreneur     Entrepreneur     `gorm:"foreignKey:EntrepreneurID;constraint:OnDelete:CASCADE"`
	CollaboratingHub *CommunityCenter `gorm:"foreignKey:CollaboratingHubID"`
}

func (ServiceProvision) TableName() string {
	return "service_provisions"
}

func (s *ServiceProvision) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// ActivityType enum for hub activities
type ActivityType string

const (
	ActivityEnrollment    ActivityType = "ENROLLMENT"
	ActivityService       ActivityType = "SERVICE"
	ActivityCollaboration ActivityType = "COLLABORATION"
	ActivityAnnouncement  ActivityType = "ANNOUNCEMENT"
	ActivityConnection    ActivityType = "CONNECTION"
)

// HubActivity model - social feed activities for community centers
type HubActivity struct {
	ID                 uuid.UUID    `gorm:"type:uuid;primaryKey;column:id"`
	HubID              uuid.UUID    `gorm:"type:uuid;not null;index;column:hub_id"`
	Type               ActivityType `gorm:"type:varchar(20);not null;column:type"`
	Title              string       `gorm:"size:255;not null;column:title"`
	Description        string       `gorm:"type:text;column:description"`
	EntrepreneurID     *uuid.UUID   `gorm:"type:uuid;column:entrepreneur_id"`
	ServiceProvisionID *uuid.UUID   `gorm:"type:uuid;column:service_provision_id"`
	ConnectionID       *uuid.UUID   `gorm:"type:uuid;column:connection_id"`
	CollaboratingHubID *uuid.UUID   `gorm:"type:uuid;column:collaborating_hub_id"`
	ImageURL           *string      `gorm:"size:500;column:image_url"`
	Pinned             bool         `gorm:"default:false;column:pinned"`
	CreatedBy          uuid.UUID    `gorm:"type:uuid;not null;column:created_by"`
	CreatedAt          time.Time    `gorm:"column:created_at;index"`
	UpdatedAt          time.Time    `gorm:"column:updated_at"`

	// Relations
	Hub              CommunityCenter   `gorm:"foreignKey:HubID;constraint:OnDelete:CASCADE"`
	Entrepreneur     *Entrepreneur     `gorm:"foreignKey:EntrepreneurID"`
	ServiceProvision *ServiceProvision `gorm:"foreignKey:ServiceProvisionID"`
	Connection       *Connection       `gorm:"foreignKey:ConnectionID"`
	CollaboratingHub *CommunityCenter  `gorm:"foreignKey:CollaboratingHubID"`
	Creator          User              `gorm:"foreignKey:CreatedBy"`
}

func (HubActivity) TableName() string {
	return "hub_activities"
}

func (h *HubActivity) BeforeCreate(tx *gorm.DB) error {
	if h.ID == uuid.Nil {
		h.ID = uuid.New()
	}
	return nil
}

// RoleUpgradeRequest model - requests for role upgrades requiring admin approval
type RoleUpgradeRequest struct {
	ID            uuid.UUID                `gorm:"type:uuid;primaryKey;column:id"`
	UserID        uuid.UUID                `gorm:"type:uuid;not null;index;column:user_id"`
	CurrentRole   Role                     `gorm:"type:varchar(20);not null;column:current_role"`
	RequestedRole Role                     `gorm:"type:varchar(20);not null;column:requested_role"`
	CenterID      *uuid.UUID               `gorm:"type:uuid;column:center_id"` // For CENTER_MANAGER requests
	Justification string                   `gorm:"type:text;not null;column:justification"`
	Status        RoleUpgradeRequestStatus `gorm:"type:varchar(20);not null;default:'PENDING';column:status"`
	ReviewedBy    *uuid.UUID               `gorm:"type:uuid;column:reviewed_by"` // Admin who reviewed
	ReviewNotes   *string                  `gorm:"type:text;column:review_notes"`
	CreatedAt     time.Time                `gorm:"column:created_at"`
	UpdatedAt     time.Time                `gorm:"column:updated_at"`

	// Relations
	User           User             `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Center         *CommunityCenter `gorm:"foreignKey:CenterID"`
	ReviewedByUser *User            `gorm:"foreignKey:ReviewedBy"`
}

func (RoleUpgradeRequest) TableName() string {
	return "role_upgrade_requests"
}

func (r *RoleUpgradeRequest) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

// AutoMigrate runs migrations for all models
func AutoMigrate(gdb *gorm.DB) error {
	return gdb.AutoMigrate(
		&User{},
		&CommunityCenter{},
		&Connection{},
		&ContactMessage{},
		&MessageThread{},
		&CenterMessage{},
		&Entrepreneur{},
		&HubEnrollment{},
		&ServiceProvision{},
		&HubActivity{},
		&RoleUpgradeRequest{},
	)
}


