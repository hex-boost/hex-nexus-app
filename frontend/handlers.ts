import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock login
  http.post('/api/auth/local', () => {
    return HttpResponse.json(
      {
        jwt: 'fake-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      },
    );
  }),

  // Mock register
  http.post('/api/auth/local/register', () => {
    return HttpResponse.json(
      {
        jwt: 'fake-jwt-token',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
        },
      },
    );
  }),

];
