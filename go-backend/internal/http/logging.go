package httpx

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// RequestLogger returns a Gin middleware that logs requests with zerolog
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		dur := time.Since(start)
		status := c.Writer.Status()
		method := c.Request.Method
		path := c.Request.URL.Path
		ip := c.ClientIP()
		zerolog.TimestampFieldName = "ts"
		log.Info().
			Str("method", method).
			Str("path", path).
			Str("ip", ip).
			Int("status", status).
			Dur("duration", dur).
			Msg("http_request")
	}
}

