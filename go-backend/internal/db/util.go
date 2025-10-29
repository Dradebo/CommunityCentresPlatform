package db

import "github.com/google/uuid"

func UUIDFromString(s string) uuid.UUID {
    id, err := uuid.Parse(s)
    if err != nil {
        return uuid.Nil
    }
    return id
}


