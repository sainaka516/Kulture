import { Take, Community, User, Vote } from './types';

// Use your computer's local IP address instead of localhost
// This allows your mobile device to connect to your computer
const API_URL = 'http://192.168.1.171:3002/api'; // Updated port to match the running server

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  try {
    console.log('Fetching:', `${API_URL}${endpoint}`); // Add logging
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') 
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        typeof data === 'string' ? data : data.message || 'Something went wrong'
      );
    }

    return data;
  } catch (error) {
    console.error('API Error:', error); // Add error logging
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
}

export const api = {
  // Takes
  getTakes: async (communitySlug?: string): Promise<Take[]> => {
    try {
      const endpoint = communitySlug ? `/k/${communitySlug}/takes` : '/takes';
      const data = await fetchApi(endpoint);
      return data.takes || [];
    } catch (error) {
      console.error('Error getting takes:', error);
      throw error;
    }
  },

  createTake: async (take: { title: string; content?: string; communityId: string }): Promise<Take> => {
    const data = await fetchApi('/takes', {
      method: 'POST',
      body: JSON.stringify(take),
    });
    return data.take;
  },

  voteTake: async (takeId: string, type: 'UP' | 'DOWN'): Promise<void> => {
    await fetchApi(`/takes/${takeId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },

  // Communities
  getCommunities: async (): Promise<Community[]> => {
    try {
      const data = await fetchApi('/communities');
      return data.communities || [];
    } catch (error) {
      console.error('Error getting communities:', error);
      throw error;
    }
  },

  getCommunity: async (slug: string): Promise<Community> => {
    const data = await fetchApi(`/k/${slug}`);
    return data.community;
  },

  joinCommunity: async (communityId: string): Promise<void> => {
    await fetchApi(`/communities/${communityId}/join`, {
      method: 'POST',
    });
  },

  leaveCommunity: async (communityId: string): Promise<void> => {
    await fetchApi(`/communities/${communityId}/leave`, {
      method: 'POST',
    });
  },

  // User
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const data = await fetchApi('/auth/session');
      return data.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }
      throw error;
    }
  },

  updateProfile: async (profile: { name?: string; bio?: string }): Promise<User> => {
    const data = await fetchApi('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profile),
    });
    return data.user;
  },

  // Search
  search: async (query: string): Promise<{
    takes: Take[];
    communities: Community[];
    users: User[];
  }> => {
    const data = await fetchApi(`/search?q=${encodeURIComponent(query)}`);
    return data;
  },
}; 