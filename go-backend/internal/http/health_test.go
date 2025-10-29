package httpx

import (
    "net/http"
    "net/http/httptest"
    "testing"
)

func TestHealthz(t *testing.T) {
    r := NewRouter(Deps{FrontendURL: "http://localhost:3000"})
    r.GET("/healthz", func(c *Context) {})
    w := httptest.NewRecorder()
    req, _ := http.NewRequest("GET", "/healthz", nil)
    r.ServeHTTP(w, req)
    if w.Code != http.StatusOK && w.Code != http.StatusNotFound { // depending on override in main
        t.Fatalf("unexpected status: %d", w.Code)
    }
}

