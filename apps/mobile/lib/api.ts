import { createApiClient } from '@veritek/api-client';
import { getToken } from './supabase';

export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  getToken,
});
