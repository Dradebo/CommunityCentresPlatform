package config

import (
    "log"
    "os"
    "time"
)

type Config struct {
    Port            string
    FrontendURL     string
    DatabaseURL     string
    JWTSecret       string
    JWTExpiresIn    time.Duration
    RealtimeProv    string
    GoogleClientID  string
}

func Load() Config {
    cfg := Config{
        Port:           getenv("PORT", "8080"),
        FrontendURL:    getenv("FRONTEND_URL", "http://localhost:3000"),
        DatabaseURL:    os.Getenv("DATABASE_URL"),
        JWTSecret:      os.Getenv("JWT_SECRET"),
        RealtimeProv:   getenv("REALTIME_PROVIDER", "socketio"),
        GoogleClientID: os.Getenv("GOOGLE_CLIENT_ID"),
    }
    // duration with default 168h
    if d := getenv("JWT_EXPIRES_IN", "168h"); d != "" {
        if dur, err := time.ParseDuration(d); err == nil { cfg.JWTExpiresIn = dur } else { cfg.JWTExpiresIn = 168 * time.Hour }
    }
    if cfg.DatabaseURL == "" || cfg.JWTSecret == "" {
        log.Fatal("DATABASE_URL and JWT_SECRET are required")
    }
    return cfg
}

func getenv(key, def string) string {
    if v := os.Getenv(key); v != "" { return v }
    return def
}


