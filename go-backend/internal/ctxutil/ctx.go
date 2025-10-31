package ctxutil

import (
    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
    "communitycentresplatform/go-backend/internal/events"
)

const (
    KeyDB             = "db"
    KeyJWTSecret      = "jwtSecret"
    KeyJWTExpiry      = "jwtExpiry"
    KeyBroker         = "sseBroker"
    KeyGoogleClientID = "googleClientID"

    KeyUserID = "userId"
    KeyEmail  = "email"
    KeyRole   = "role"
    KeyName   = "name"
)

func DBFrom(c *gin.Context) *gorm.DB {
    if v, ok := c.Get(KeyDB); ok {
        if g, ok2 := v.(*gorm.DB); ok2 {
            return g
        }
    }
    return nil
}

func JWTSecretFrom(c *gin.Context) string {
    if v, ok := c.Get(KeyJWTSecret); ok {
        if s, ok2 := v.(string); ok2 {
            return s
        }
    }
    return ""
}

func JWTExpiryFrom(c *gin.Context) string {
    if v, ok := c.Get(KeyJWTExpiry); ok {
        if s, ok2 := v.(string); ok2 {
            return s
        }
    }
    return "168h"
}

func BrokerFrom(c *gin.Context) *events.Broker {
    if v, ok := c.Get(KeyBroker); ok {
        if b, ok2 := v.(*events.Broker); ok2 {
            return b
        }
    }
    return nil
}

func UserIDFrom(c *gin.Context) string {
    if v, ok := c.Get(KeyUserID); ok {
        if s, ok2 := v.(string); ok2 {
            return s
        }
    }
    return ""
}

func EmailFrom(c *gin.Context) string {
    if v, ok := c.Get(KeyEmail); ok {
        if s, ok2 := v.(string); ok2 {
            return s
        }
    }
    return ""
}

func RoleFrom(c *gin.Context) string {
    if v, ok := c.Get(KeyRole); ok {
        if s, ok2 := v.(string); ok2 {
            return s
        }
    }
    return ""
}

func NameFrom(c *gin.Context) string {
    if v, ok := c.Get(KeyName); ok {
        if s, ok2 := v.(string); ok2 {
            return s
        }
    }
    return ""
}

func GoogleClientIDFrom(c *gin.Context) string {
    if v, ok := c.Get(KeyGoogleClientID); ok {
        if s, ok2 := v.(string); ok2 {
            return s
        }
    }
    return ""
}


