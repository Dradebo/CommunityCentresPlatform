package httpx

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"communitycentresplatform/go-backend/internal/auth"
    "communitycentresplatform/go-backend/internal/events"
    "communitycentresplatform/go-backend/internal/ctxutil"
)

type ContextKeys string

const (
	CtxUserID ContextKeys = "userId"
	CtxEmail  ContextKeys = "email"
	CtxRole   ContextKeys = "role"
	CtxName   ContextKeys = "name"
)

// DBMiddleware injects *gorm.DB into context
func DBMiddleware(gdb *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
        c.Set(ctxutil.KeyDB, gdb)
		c.Next()
	}
}

// AuthMiddleware validates JWT and sets user claims into context
func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authz := c.GetHeader("Authorization")
		if authz == "" || !strings.HasPrefix(authz, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "access token required"})
			return
		}
		token := strings.TrimPrefix(authz, "Bearer ")
		token = strings.TrimSpace(token)  // Remove any whitespace
		claims, err := auth.ParseJWT(secret, token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid or expired token"})
			return
		}
        c.Set(ctxutil.KeyUserID, claims.UserID)
        c.Set(ctxutil.KeyEmail, claims.Email)
        c.Set(ctxutil.KeyRole, claims.Role)
        c.Set(ctxutil.KeyName, claims.Name)
		c.Next()
	}
}

// ConfigMiddleware stores config values needed in handlers (e.g., JWT secret)
func ConfigMiddleware(jwtSecret string, jwtExpiry string) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Set(ctxutil.KeyJWTSecret, jwtSecret)
        c.Set(ctxutil.KeyJWTExpiry, jwtExpiry)
        c.Next()
    }
}

// BrokerMiddleware exposes the SSE broker to handlers
func BrokerMiddleware(b *events.Broker) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Set(ctxutil.KeyBroker, b)
        c.Next()
    }
}

// RequireRole ensures the user has one of the allowed roles
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := map[string]struct{}{}
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
    return func(c *gin.Context) {
        role, _ := c.Get(ctxutil.KeyRole)
		if _, ok := allowed[role.(string)]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "insufficient role"})
			return
		}
		c.Next()
	}
}


