package auth

import "testing"

func TestPasswordHashAndCheck(t *testing.T) {
    plain := "secret123"
    hash, err := HashPassword(plain)
    if err != nil { t.Fatalf("hash error: %v", err) }
    if !CheckPassword(hash, plain) { t.Fatalf("expected password to match") }
    if CheckPassword(hash, "wrong") { t.Fatalf("expected wrong password to fail") }
}

