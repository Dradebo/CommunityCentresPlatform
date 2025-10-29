package auth

import (
    "testing"
    "time"
)

func TestJWTSignParse(t *testing.T) {
    token, err := SignJWT("secret", time.Hour, "u1", "u@example.com", "VISITOR", "User One")
    if err != nil { t.Fatalf("sign error: %v", err) }
    claims, err := ParseJWT("secret", token)
    if err != nil { t.Fatalf("parse error: %v", err) }
    if claims.UserID != "u1" || claims.Email != "u@example.com" { t.Fatalf("unexpected claims: %+v", claims) }
}

