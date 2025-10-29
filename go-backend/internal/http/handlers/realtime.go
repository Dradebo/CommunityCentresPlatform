package handlers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "communitycentresplatform/go-backend/internal/ctxutil"
)

// POST /api/realtime/join-center
func JoinCenter(c *gin.Context) {
    var req struct{ CenterID string `json:"centerId" binding:"required"` }
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"}); return }
    userID, _ := c.Get(ctxutil.KeyUserID)
    if userID == nil { c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"}); return }
    if br := ctxutil.BrokerFrom(c); br != nil { br.SubscribeCenter(userID.(string), req.CenterID) }
    c.Status(http.StatusNoContent)
}

// POST /api/realtime/leave-center
func LeaveCenter(c *gin.Context) {
    var req struct{ CenterID string `json:"centerId" binding:"required"` }
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"}); return }
    userID, _ := c.Get(ctxutil.KeyUserID)
    if userID == nil { c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"}); return }
    if br := ctxutil.BrokerFrom(c); br != nil { br.UnsubscribeCenter(userID.(string), req.CenterID) }
    c.Status(http.StatusNoContent)
}

// POST /api/realtime/join-thread
func JoinThread(c *gin.Context) {
    var req struct{ ThreadID string `json:"threadId" binding:"required"` }
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"}); return }
    userID, _ := c.Get(ctxutil.KeyUserID)
    if userID == nil { c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"}); return }
    if br := ctxutil.BrokerFrom(c); br != nil { br.SubscribeThread(userID.(string), req.ThreadID) }
    c.Status(http.StatusNoContent)
}

// POST /api/realtime/leave-thread
func LeaveThread(c *gin.Context) {
    var req struct{ ThreadID string `json:"threadId" binding:"required"` }
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"}); return }
    userID, _ := c.Get(ctxutil.KeyUserID)
    if userID == nil { c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"}); return }
    if br := ctxutil.BrokerFrom(c); br != nil { br.UnsubscribeThread(userID.(string), req.ThreadID) }
    c.Status(http.StatusNoContent)
}

// POST /api/realtime/typing-start
func TypingStart(c *gin.Context) {
    var req struct{ ThreadID string `json:"threadId" binding:"required"`; UserName string `json:"userName" binding:"required"` }
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"}); return }
    if br := ctxutil.BrokerFrom(c); br != nil { br.EmitUserTyping(req.ThreadID, gin.H{"userName": req.UserName, "typing": true}) }
    c.Status(http.StatusNoContent)
}

// POST /api/realtime/typing-stop
func TypingStop(c *gin.Context) {
    var req struct{ ThreadID string `json:"threadId" binding:"required"`; UserName string `json:"userName" binding:"required"` }
    if err := c.ShouldBindJSON(&req); err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "invalid input"}); return }
    if br := ctxutil.BrokerFrom(c); br != nil { br.EmitUserTyping(req.ThreadID, gin.H{"userName": req.UserName, "typing": false}) }
    c.Status(http.StatusNoContent)
}


