package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

// GoogleUser represents the user information returned from Google
type GoogleUser struct {
	GoogleID      string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
}

// GoogleTokenInfo represents the response from Google's tokeninfo endpoint
type GoogleTokenInfo struct {
	Aud           string `json:"aud"`
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"` // Google returns "true" or "false" as string
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Azp           string `json:"azp"`
	Iat           string `json:"iat"`
	Exp           string `json:"exp"`
}

// VerifyGoogleToken verifies a Google ID token and returns the user information
func VerifyGoogleToken(idToken string, expectedClientID string) (*GoogleUser, error) {
	// Google's tokeninfo endpoint for verification
	tokenInfoURL := "https://oauth2.googleapis.com/tokeninfo"

	// Add id_token as query parameter
	params := url.Values{}
	params.Add("id_token", idToken)
	fullURL := tokenInfoURL + "?" + params.Encode()

	// Make request to Google
	resp, err := http.Get(fullURL)
	if err != nil {
		return nil, fmt.Errorf("failed to verify token with Google: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read Google response: %w", err)
	}

	// Check for non-200 status codes
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google token verification failed: %s", string(body))
	}

	// Parse token info
	var tokenInfo GoogleTokenInfo
	if err := json.Unmarshal(body, &tokenInfo); err != nil {
		return nil, fmt.Errorf("failed to parse Google token info: %w", err)
	}

	// Verify the audience (aud) matches our client ID
	if tokenInfo.Aud != expectedClientID {
		return nil, fmt.Errorf("token audience does not match client ID")
	}

	// Verify email is verified
	if tokenInfo.EmailVerified != "true" {
		return nil, fmt.Errorf("Google account email is not verified")
	}

	// Create GoogleUser from token info
	googleUser := &GoogleUser{
		GoogleID:      tokenInfo.Sub,
		Email:         tokenInfo.Email,
		EmailVerified: true, // We already verified this above
		Name:          tokenInfo.Name,
		Picture:       tokenInfo.Picture,
		GivenName:     tokenInfo.GivenName,
		FamilyName:    tokenInfo.FamilyName,
	}

	return googleUser, nil
}
