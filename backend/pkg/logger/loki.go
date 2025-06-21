package logger

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/hex-boost/hex-nexus-app/backend/internal/config"
	"go.uber.org/zap/zapcore"
)

type LokiHook struct {
	client     *http.Client
	endpoint   string
	appName    string
	batchSize  int
	batchDelay time.Duration
	logChan    chan *lokiEntry
	stopChan   chan struct{}
}

type lokiEntry struct {
	timestamp time.Time
	level     zapcore.Level
	message   string
	fields    map[string]interface{}
}

type lokiBatch struct {
	Streams []lokiStream `json:"streams"`
}

type lokiStream struct {
	Stream map[string]string `json:"stream"`
	Values [][]string        `json:"values"`
}

func NewLokiHook(cfg *config.Config) *LokiHook {
	hook := &LokiHook{
		client:     &http.Client{Timeout: 5 * time.Second},
		endpoint:   cfg.Loki.Endpoint, // e.g., "https://loki-url.railway.app/loki/api/v1/push"
		appName:    "nexus-app",
		batchSize:  100,
		batchDelay: 1 * time.Second,
		logChan:    make(chan *lokiEntry, 1000),
		stopChan:   make(chan struct{}),
	}

	go hook.batchProcessor()
	return hook
}

func (h *LokiHook) Write(p []byte, level zapcore.Level, t time.Time) (n int, err error) {
	// Parse the log entry
	var fields map[string]interface{}
	if err := json.Unmarshal(p, &fields); err != nil {
		// If parsing fails, send the raw message
		h.logChan <- &lokiEntry{
			timestamp: t,
			level:     level,
			message:   string(p),
		}
		return len(p), nil
	}

	// Extract message field
	msg, _ := fields["msg"].(string)
	delete(fields, "msg")

	h.logChan <- &lokiEntry{
		timestamp: t,
		level:     level,
		message:   msg,
		fields:    fields,
	}

	return len(p), nil
}

func (h *LokiHook) batchProcessor() {
	var batch []*lokiEntry
	ticker := time.NewTicker(h.batchDelay)
	defer ticker.Stop()

	for {
		select {
		case entry := <-h.logChan:
			batch = append(batch, entry)
			if len(batch) >= h.batchSize {
				h.sendBatch(batch)
				batch = batch[:0]
			}
		case <-ticker.C:
			if len(batch) > 0 {
				h.sendBatch(batch)
				batch = batch[:0]
			}
		case <-h.stopChan:
			if len(batch) > 0 {
				h.sendBatch(batch)
			}
			return
		}
	}
}

func (h *LokiHook) sendBatch(batch []*lokiEntry) {
	// Convert batch to Loki format
	lokiBatch := h.convertToLokiBatch(batch)

	// Serialize to JSON
	jsonData, err := json.Marshal(lokiBatch)
	if err != nil {
		fmt.Printf("Error marshaling Loki batch: %v\n", err)
		return
	}

	// Send to Loki
	req, err := http.NewRequest("POST", h.endpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error creating Loki request: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := h.client.Do(req)
	if err != nil {
		fmt.Printf("Error sending logs to Loki: %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		fmt.Printf("Loki responded with error status: %d\n", resp.StatusCode)
	}
}

func (h *LokiHook) convertToLokiBatch(batch []*lokiEntry) lokiBatch {
	// Group by labels
	streams := make(map[string][]lokiEntryValue)

	for _, entry := range batch {
		// Create labels for this entry
		labels := map[string]string{
			"app":   h.appName,
			"level": entry.level.String(),
		}

		// Add fields as labels if they're simple types
		for k, v := range entry.fields {
			if s, ok := v.(string); ok {
				labels[k] = s
			}
		}

		// Create label string for map key
		labelStr := labelsToString(labels)

		// Convert timestamp to Loki format (nanoseconds)
		ts := fmt.Sprintf("%d", entry.timestamp.UnixNano())

		// Add entry to stream
		streams[labelStr] = append(streams[labelStr], lokiEntryValue{
			ts:  ts,
			msg: entry.message,
		})
	}

	// Convert to Loki batch format
	result := lokiBatch{
		Streams: make([]lokiStream, 0, len(streams)),
	}

	for labelStr, values := range streams {
		stream := lokiStream{
			Stream: parseLabelsString(labelStr),
			Values: make([][]string, len(values)),
		}

		for i, v := range values {
			stream.Values[i] = []string{v.ts, v.msg}
		}

		result.Streams = append(result.Streams, stream)
	}

	return result
}

type lokiEntryValue struct {
	ts  string
	msg string
}

func labelsToString(labels map[string]string) string {
	// Simple implementation - in a real app, you'd want to escape values properly
	result := "{"
	first := true
	for k, v := range labels {
		if !first {
			result += ","
		}
		result += fmt.Sprintf("%s=\"%s\"", k, v)
		first = false
	}
	result += "}"
	return result
}

func parseLabelsString(s string) map[string]string {
	// For simplicity - in a real implementation this would properly parse the label string
	// This is just a placeholder for the structure
	return map[string]string{"app": "nexus-app"}
}

func (h *LokiHook) Stop() {
	close(h.stopChan)
}
