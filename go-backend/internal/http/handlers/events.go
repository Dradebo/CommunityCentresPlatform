package handlers

import (
	"fmt"
	"net/http"
    "io"
    "strconv"
	"time"

	"github.com/gin-gonic/gin"
    "communitycentresplatform/go-backend/internal/auth"
    "communitycentresplatform/go-backend/internal/events"
    "communitycentresplatform/go-backend/internal/ctxutil"
)

// very simple in-memory SSE stream (polling fallback not implemented here)
// GET /api/events/
func GetEvents(c *gin.Context) {
    c.Writer.Header().Set("Content-Type", "text/event-stream")
    c.Writer.Header().Set("Cache-Control", "no-cache")
    c.Writer.Header().Set("Connection", "keep-alive")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "streaming unsupported"})
		return
	}

    // auth via Authorization header or token query fallback
    token := c.Query("token")
    if token == "" {
        authz := c.GetHeader("Authorization")
        if authz == "" || len(authz) < 8 || authz[:7] != "Bearer " {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "access token required"})
            return
        }
        token = authz[7:]
    }
    claims, err := auth.ParseJWT(ctxutil.JWTSecretFrom(c), token)
    if err != nil {
        c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "invalid or expired token"})
        return
    }

    // initial hello
    fmt.Fprintf(c.Writer, "data: %s\n\n", "connected")
	flusher.Flush()

    // register client in broker
    br := ctxutil.BrokerFrom(c)
    client := br.AddClient(claims.UserID)
    defer br.RemoveClient(claims.UserID)

    // periodic ping
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

    // backlog replay via Last-Event-ID
    if last := c.Request.Header.Get("Last-Event-ID"); last != "" {
        if id, err := strconv.ParseInt(last, 10, 64); err == nil {
            for _, ev := range br.GetSince(id) {
                c.Writer.Write(events.ToSSE(ev))
            }
            flusher.Flush()
        }
    }

	c.Stream(func(w io.Writer) bool {
		select {
		case <-c.Request.Context().Done():
			return false
        case ev, ok := <-client.Send:
            if !ok { return false }
            c.Writer.Write(events.ToSSE(ev))
            flusher.Flush()
            return true
		case <-ticker.C:
			fmt.Fprintf(c.Writer, ": ping\n\n")
			flusher.Flush()
			return true
		}
	})
}


