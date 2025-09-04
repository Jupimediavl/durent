import api from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  userType: 'LANDLORD' | 'TENANT';
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
}

export const authService = {
  async register(data: any): Promise<AuthResponse> {
    try {
      console.log('Registering with data:', data);
      console.log('API URL:', api.defaults.baseURL);
      const response = await api.post('/auth/register', data);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Logging in with:', { email });
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  },

  async createProperty(data: any): Promise<any> {
    try {
      const response = await api.post('/properties', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Property creation failed');
    }
  },

  async generateInvite(propertyId: string): Promise<{ inviteCode: string }> {
    try {
      const response = await api.post('/invites/generate', { propertyId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Invite generation failed');
    }
  },

  async acceptInvite(inviteCode: string): Promise<any> {
    try {
      const response = await api.post('/invites/accept', { inviteCode });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Invite acceptance failed');
    }
  },
};