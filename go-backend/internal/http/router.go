package httpx

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Deps struct {
    FrontendURL string
    DB          *gorm.DB
    JWTSecret   string
}

func NewRouter(d Deps) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	// Build allowed origins list
	// Always allow localhost for development
	allowedOrigins := []string{"http://localhost:3000"}

	// Parse FRONTEND_URL - supports comma-separated list for multiple domains
	if d.FrontendURL != "" {
		urls := strings.Split(d.FrontendURL, ",")
		for _, url := range urls {
			url = strings.TrimSpace(url)
			// Avoid duplicates and empty strings
			if url != "" && url != "http://localhost:3000" {
				allowedOrigins = append(allowedOrigins, url)
			}
		}
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	return r
}


