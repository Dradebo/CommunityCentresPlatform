package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"communitycentresplatform/go-backend/internal/auth"
	"communitycentresplatform/go-backend/internal/db"
    "communitycentresplatform/go-backend/internal/ctxutil"
)

type registerRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name" binding:"required,min=2"`
	Role     string `json:"role"` // VISITOR|CENTER_MANAGER|ADMIN (ADMIN should be restricted elsewhere)
}

// POST /api/auth/register
func Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

    gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var existing db.User
	if err := gdb.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already exists with this email"})
		return
	}

	hashed, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	role := strings.ToUpper(strings.TrimSpace(req.Role))
	if role == "" { role = string(db.RoleVisitor) }
	if role != string(db.RoleVisitor) && role != string(db.RoleCenterManager) && role != string(db.RoleAdmin) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid role"})
		return
	}

	user := db.User{
		Email:    req.Email,
		Password: hashed,
		Name:     req.Name,
		Role:     db.Role(role),
		Verified: role == string(db.RoleVisitor),
	}
	if err := gdb.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

    secret := ctxutil.JWTSecretFrom(c)
    dur, _ := time.ParseDuration(ctxutil.JWTExpiryFrom(c))
	token, err := auth.SignJWT(secret, dur, user.ID.String(), user.Email, string(user.Role), user.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"token":   token,
		"user": gin.H{
			"id":       user.ID,
			"email":    user.Email,
			"name":     user.Name,
			"role":     user.Role,
			"verified": user.Verified,
		},
	})
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// POST /api/auth/login
func Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"})
		return
	}

    gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var user db.User
	if err := gdb.Where("email = ?", req.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid credentials"})
		return
	}
	if !auth.CheckPassword(user.Password, req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid credentials"})
		return
	}

    secret := ctxutil.JWTSecretFrom(c)
    dur, _ := time.ParseDuration(ctxutil.JWTExpiryFrom(c))
	token, err := auth.SignJWT(secret, dur, user.ID.String(), user.Email, string(user.Role), user.Name)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user": gin.H{
			"id":       user.ID,
			"email":    user.Email,
			"name":     user.Name,
			"role":     user.Role,
			"verified": user.Verified,
		},
	})
}

// GET /api/auth/me
func Me(c *gin.Context) {
    userIDVal, _ := c.Get(ctxutil.KeyUserID)
	if userIDVal == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

    gdb := ctxutil.DBFrom(c)
	if gdb == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "db unavailable"})
		return
	}

	var user db.User
	if err := gdb.Where("id = ?", userIDVal.(string)).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":        user.ID,
			"email":     user.Email,
			"name":      user.Name,
			"role":      user.Role,
			"verified":  user.Verified,
			"createdAt": user.CreatedAt,
		},
	})
}


