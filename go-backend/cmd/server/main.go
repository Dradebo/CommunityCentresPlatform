package main

import (
    "context"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/joho/godotenv"
    "github.com/gin-gonic/gin"

    httpx "communitycentresplatform/go-backend/internal/http"
    "communitycentresplatform/go-backend/internal/config"
    "communitycentresplatform/go-backend/internal/db"
    "communitycentresplatform/go-backend/internal/events"
)

func main() {
    _ = godotenv.Load()
    cfg := config.Load()

    // connect database
    database, err := db.Connect(cfg.DatabaseURL)
    if err != nil {
        log.Fatalf("failed to connect database: %v", err)
    }

    // auto-migrate schema (safe additive changes; avoid destructive ops in prod without review)
    if err := db.AutoMigrate(database.DB); err != nil {
        log.Fatalf("auto-migrate failed: %v", err)
    }

    // build router and register routes
    r := httpx.NewRouter(httpx.Deps{FrontendURL: cfg.FrontendURL, DB: database.DB, JWTSecret: cfg.JWTSecret})
    r.Use(httpx.RequestLogger())
    r.GET("/healthz", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
    // expose config to handlers (JWT secret/expiry, Google Client ID)
    r.Use(httpx.ConfigMiddleware(cfg.JWTSecret, cfg.JWTExpiresIn.String(), cfg.GoogleClientID))
    // SSE broker
    broker := events.NewBroker()
    r.Use(httpx.BrokerMiddleware(broker))
    httpx.RegisterRoutes(r, httpx.Deps{FrontendURL: cfg.FrontendURL, DB: database.DB, JWTSecret: cfg.JWTSecret})

    srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: r,
	}

	go func() {
		log.Printf("listening on :%s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

    // graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("server forced to shutdown: %v", err)
	}
	log.Println("server exited")
}

