package user

import (
	"github.com/hex-boost/hex-nexus-app/backend/types"
)

// Client handles user-related API operations
type Client struct {
	http *HTTPClient
}

// NewUserClient creates a new user client
func NewClient(http *HTTPClient) *Client {
	return &Client{
		http: http,
	}
}

// Me gets the current user profile
func (u *Client) Me() (*types.User, error) {
	var user types.User
	_, err := u.http.Get("/api/users/me", &user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Update updates a user profile
func (u *Client) Update(userId int, userData map[string]interface{}) (*types.User, error) {
	var updatedUser types.User
	_, err := u.http.Put(fmt.Sprintf("/api/users/%d", userId), userData, &updatedUser)
	if err != nil {
		return nil, err
	}
	return &updatedUser, nil
}
