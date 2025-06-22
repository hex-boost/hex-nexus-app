package logger

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"sort"
	"strings"
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

type LokiWriter struct {
	hook  *LokiHook
	level zapcore.Level // Default level to use when writing
}

func NewLokiWriter(hook *LokiHook, level zapcore.Level) *LokiWriter {
	return &LokiWriter{
		hook:  hook,
		level: level,
	}
}

// Write implements io.Writer
func (w *LokiWriter) Write(p []byte) (n int, err error) {
	// Call the hook's Write method
	return w.hook.Write(p)
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

func (h *LokiHook) Write(p []byte) (n int, err error) {
	var fields map[string]interface{}
	if err := json.Unmarshal(p, &fields); err != nil {
		// If parsing fails, send the raw message with current time.
		h.logChan <- &lokiEntry{
			timestamp: time.Now(),
			level:     zapcore.WarnLevel,
			message:   fmt.Sprintf("failed to unmarshal log: %s", string(p)),
			fields:    map[string]interface{}{"error": err.Error()},
		}
		return len(p), nil
	}

	// Extract message
	msg, _ := fields["msg"].(string)
	delete(fields, "msg")

	// Extract and parse timestamp
	entryTime := time.Now() // Default to now
	if tsStr, ok := fields["time"].(string); ok {
		// Using RFC3339 which is compatible with ISO8601TimeEncoder
		if parsedTime, err := time.Parse(time.RFC3339, tsStr); err == nil {
			entryTime = parsedTime
		}
	}
	delete(fields, "time")

	// Extract and parse level
	entryLevel := zapcore.InfoLevel // Default to info
	if lvlStr, ok := fields["level"].(string); ok {
		_ = entryLevel.UnmarshalText([]byte(lvlStr))
	}
	delete(fields, "level")

	h.logChan <- &lokiEntry{
		timestamp: entryTime,
		level:     entryLevel,
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

	if len(lokiBatch.Streams) == 0 {
		return
	}

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

var labelRegex = regexp.MustCompile(`(\w+)="([^"]*)"`)

func labelsToString(labels map[string]string) string {
	keys := make([]string, 0, len(labels))
	for k := range labels {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var b strings.Builder
	b.WriteString("{")
	for i, k := range keys {
		if i > 0 {
			b.WriteString(",")
		}
		fmt.Fprintf(&b, `%s="%s"`, k, labels[k])
	}
	b.WriteString("}")
	return b.String()
}

func parseLabelsString(s string) map[string]string {
	labels := make(map[string]string)
	matches := labelRegex.FindAllStringSubmatch(s, -1)
	for _, match := range matches {
		if len(match) == 3 {
			labels[match[1]] = match[2]
		}
	}
	return labels
}

func (h *LokiHook) Stop() {
	close(h.stopChan)
}
