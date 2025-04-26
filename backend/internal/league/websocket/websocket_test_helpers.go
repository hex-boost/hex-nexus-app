package websocket

// SetTestConnection sets the connection field for testing
func SetTestConnection(service *Service, conn WebSocketConnection) {
	service.conn = conn
}

// AddTestSubscription adds a subscription for testing
func AddTestSubscription(service *Service, path string) {
	service.mutex.Lock()
	defer service.mutex.Unlock()
	service.subscriptions[path] = true
}

// RunWebSocketLoop exports the runWebSocketLoop method for testing
func (s *Service) RunWebSocketLoop() {
	s.runWebSocketLoop()
}

// ConnectToLCUWebSocket exports the connectToLCUWebSocket method for testing
func (s *Service) ConnectToLCUWebSocket() error {
	return s.connectToLCUWebSocket()
}

// ResubscribeToEvents exports the resubscribeToEvents method for testing
func (s *Service) ResubscribeToEvents() error {
	return s.resubscribeToEvents()
}

// SendSubscription exports the sendSubscriptionImpl method for testing
func (s *Service) SendSubscription(path string) error {
	return s.sendSubscriptionFunc(path)
}

// SendUnsubscription exports the sendUnsubscriptionImpl method for testing
func (s *Service) SendUnsubscription(path string) error {
	return s.sendUnsubscriptionFunc(path)
}

func (s *Service) IsRunning() bool {
	return s.isRunning
}

// ReadMessages exports the readMessages method for testing
func (s *Service) ReadMessages() {
	s.readMessages()
}

func (s *Service) IsConnected() bool {
	return s.isConnected()
}

func (s *Service) HandleWebsocketEvent(event []byte) {
	s.handleWebSocketEvent(event)
}

func (s *Service) SetApp(app App) {
	s.app = app
}
