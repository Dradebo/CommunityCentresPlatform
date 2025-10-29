package events

import (
	"encoding/json"
	"fmt"
	"sync"
)

type Event struct {
    ID      int64       `json:"id"`
    Type    string      `json:"type"`
    Payload interface{} `json:"payload"`
}

type Client struct {
	UserID        string
	Send          chan Event
	Centers       map[string]struct{}
	Threads       map[string]struct{}
}

type Broker struct {
	mu      sync.RWMutex
	clients map[string]*Client // keyed by userId (one active stream per user)
    lastID  int64
    backlog []Event // simple rolling buffer
}

func NewBroker() *Broker {
    return &Broker{clients: make(map[string]*Client), backlog: make([]Event, 0, 512)}
}

func (b *Broker) AddClient(userId string) *Client {
	b.mu.Lock()
	defer b.mu.Unlock()
	cl := &Client{UserID: userId, Send: make(chan Event, 64), Centers: map[string]struct{}{}, Threads: map[string]struct{}{}}
	b.clients[userId] = cl
	return cl
}

func (b *Broker) RemoveClient(userId string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if cl, ok := b.clients[userId]; ok {
		close(cl.Send)
		delete(b.clients, userId)
	}
}

func (b *Broker) SubscribeCenter(userId, centerId string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if cl, ok := b.clients[userId]; ok {
		cl.Centers[centerId] = struct{}{}
	}
}

func (b *Broker) UnsubscribeCenter(userId, centerId string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if cl, ok := b.clients[userId]; ok {
		delete(cl.Centers, centerId)
	}
}

func (b *Broker) SubscribeThread(userId, threadId string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if cl, ok := b.clients[userId]; ok {
		cl.Threads[threadId] = struct{}{}
	}
}

func (b *Broker) UnsubscribeThread(userId, threadId string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if cl, ok := b.clients[userId]; ok {
		delete(cl.Threads, threadId)
	}
}

// Emit helpers
func (b *Broker) EmitCenterUpdate(centerId string, payload interface{}) {
	b.mu.Lock()
	ev := b.nextEvent("center-updated", payload)
	b.mu.Unlock()

	b.mu.RLock()
	defer b.mu.RUnlock()
    for _, cl := range b.clients {
		if _, ok := cl.Centers[centerId]; ok {
            select { case cl.Send <- ev: default: }
		}
	}
}

func (b *Broker) EmitNewMessage(threadId string, payload interface{}) {
	b.mu.Lock()
	ev := b.nextEvent("new-message", payload)
	b.mu.Unlock()

	b.mu.RLock()
	defer b.mu.RUnlock()
    for _, cl := range b.clients {
		if _, ok := cl.Threads[threadId]; ok {
            select { case cl.Send <- ev: default: }
		}
	}
}

func (b *Broker) EmitUserTyping(threadId string, payload interface{}) {
	b.mu.Lock()
	ev := b.nextEvent("user-typing", payload)
	b.mu.Unlock()

	b.mu.RLock()
	defer b.mu.RUnlock()
    for _, cl := range b.clients {
		if _, ok := cl.Threads[threadId]; ok {
            select { case cl.Send <- ev: default: }
		}
	}
}

// Format SSE line
func ToSSE(e Event) []byte {
    buf, _ := json.Marshal(e.Payload)
	line := append([]byte("event: "), []byte(e.Type)...)
	line = append(line, []byte("\n")...)
    // id line for Last-Event-ID resume
    line = append(line, []byte("id: ")...)
    line = append(line, []byte(fmt.Sprintf("%d", e.ID))...)
    line = append(line, []byte("\n")...)
	line = append(line, []byte("data: ")...)
	line = append(line, buf...)
	line = append(line, []byte("\n\n")...)
	return line
}

// internal: allocate id and append to backlog (rolling buffer)
func (b *Broker) nextEvent(t string, payload interface{}) Event {
    b.lastID++
    ev := Event{ID: b.lastID, Type: t, Payload: payload}
    // append with simple cap of 512 events
    if len(b.backlog) >= 512 { b.backlog = b.backlog[1:] }
    b.backlog = append(b.backlog, ev)
    return ev
}

// Get events since id (exclusive)
func (b *Broker) GetSince(id int64) []Event {
    out := make([]Event, 0)
    for _, ev := range b.backlog {
        if ev.ID > id { out = append(out, ev) }
    }
    return out
}


