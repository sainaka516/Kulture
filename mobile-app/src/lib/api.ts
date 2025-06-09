import { Take } from '../types';

// Use your computer's local IP address instead of localhost
// This allows your mobile device to connect to your computer
const API_URL = 'http://192.168.1.171:3000/api'; // Using port 3000 to match the running server

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    console.log('Fetching:', `${API_URL}${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error('Network request failed');
  }
}

export async function fetchTakes(): Promise<Take[]> {
  return fetchApi('/takes');
}

export async function voteTake(takeId: string, voteType: 'UP' | 'DOWN'): Promise<void> {
  await fetchApi(`/takes/${takeId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ type: voteType }),
  });
}

export async function fetchTakesByUser(userId: string): Promise<Take[]> {
  return fetchApi(`/users/${userId}/takes`);
}

export async function fetchTakesByCommunity(communitySlug: string): Promise<Take[]> {
  return fetchApi(`/k/${communitySlug}/takes`);
} 