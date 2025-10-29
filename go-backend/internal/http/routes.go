package httpx

import (
    "github.com/gin-gonic/gin"
    "communitycentresplatform/go-backend/internal/http/handlers"
)

// RegisterRoutes wires all API routes into the provided router
func RegisterRoutes(r *gin.Engine, d Deps) {
    // attach db to context
    r.Use(DBMiddleware(d.DB))
	api := r.Group("/api")

	// /api/auth
    auth := api.Group("/auth")
	{
        auth.POST("/register", handlers.Register)
        auth.POST("/login", handlers.Login)
        auth.GET("/me", AuthMiddleware(d.JWTSecret), handlers.Me)
	}

	// /api/centers
    centers := api.Group("/centers")
	{
        centers.GET("/", handlers.ListCenters)
        centers.GET("/:id", handlers.GetCenter)
        centers.POST("/", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN", "CENTER_MANAGER"), handlers.CreateCenter)
        centers.PUT("/", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN", "CENTER_MANAGER"), handlers.UpdateCenter)
        centers.PATCH("/:id/verify", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN"), handlers.VerifyCenter)
        centers.POST("/connect", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN"), handlers.ConnectCenters)
	}

	// /api/messages
    messages := api.Group("/messages")
	{
        // Contact messages
        messages.GET("/contact", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN"), handlers.GetContactMessages)
        messages.POST("/contact", AuthMiddleware(d.JWTSecret), handlers.SendContactMessage)

        // Message threads
        messages.POST("/threads", AuthMiddleware(d.JWTSecret), handlers.CreateThread)
        messages.GET("/threads/:centerId", AuthMiddleware(d.JWTSecret), handlers.GetThreadsForCenter)

        // Thread messages - use /thread-messages to avoid conflict
        messages.GET("/thread-messages/:threadId", AuthMiddleware(d.JWTSecret), handlers.GetThreadMessages)
        messages.POST("/thread-messages/:threadId", AuthMiddleware(d.JWTSecret), handlers.SendThreadMessage)
	}

	// /api/events
    events := api.Group("/events")
	{
        events.GET("/", handlers.GetEvents)
	}

    // /api/realtime (REST endpoints to manage subscriptions and typing)
    realtime := api.Group("/realtime")
    {
        realtime.Use(AuthMiddleware(d.JWTSecret))
        realtime.POST("/join-center", handlers.JoinCenter)
        realtime.POST("/leave-center", handlers.LeaveCenter)
        realtime.POST("/join-thread", handlers.JoinThread)
        realtime.POST("/leave-thread", handlers.LeaveThread)
        realtime.POST("/typing-start", handlers.TypingStart)
        realtime.POST("/typing-stop", handlers.TypingStop)
    }

	// /api/entrepreneurs
	entrepreneurs := api.Group("/entrepreneurs")
	{
		entrepreneurs.POST("/", AuthMiddleware(d.JWTSecret), RequireRole("ENTREPRENEUR"), handlers.CreateEntrepreneur)
		entrepreneurs.GET("/:id", AuthMiddleware(d.JWTSecret), handlers.GetEntrepreneur)
		entrepreneurs.PUT("/:id", AuthMiddleware(d.JWTSecret), handlers.UpdateEntrepreneur)
		entrepreneurs.DELETE("/:id", AuthMiddleware(d.JWTSecret), handlers.DeleteEntrepreneur)
		entrepreneurs.GET("/", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN"), handlers.ListEntrepreneurs)
		entrepreneurs.PATCH("/:id/verify", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN"), handlers.VerifyEntrepreneur)
	}

	// /api/enrollments
	enrollments := api.Group("/enrollments")
	{
		enrollments.POST("/", AuthMiddleware(d.JWTSecret), handlers.CreateEnrollment)
		enrollments.GET("/hub/:hubId", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN", "CENTER_MANAGER"), handlers.GetHubEnrollments)
		enrollments.GET("/entrepreneur/:entrepreneurId", AuthMiddleware(d.JWTSecret), handlers.GetEntrepreneurEnrollments)
		enrollments.GET("/:id", AuthMiddleware(d.JWTSecret), handlers.GetEnrollment)
		enrollments.PATCH("/:id/status", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN", "CENTER_MANAGER"), handlers.UpdateEnrollmentStatus)
	}

	// /api/services
	services := api.Group("/services")
	{
		services.POST("/", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN", "CENTER_MANAGER"), handlers.CreateServiceProvision)
		services.GET("/hub/:hubId", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN", "CENTER_MANAGER"), handlers.GetHubServiceProvisions)
		services.GET("/entrepreneur/:entrepreneurId", AuthMiddleware(d.JWTSecret), handlers.GetEntrepreneurServices)
		services.GET("/:id", AuthMiddleware(d.JWTSecret), handlers.GetServiceProvision)
		services.PUT("/:id", AuthMiddleware(d.JWTSecret), RequireRole("ADMIN", "CENTER_MANAGER"), handlers.UpdateServiceProvision)
	}
}

// NotImplemented is a placeholder for yet-to-be-built handlers
// NotImplemented handler removed; individual handlers now stubbed in handlers package.


