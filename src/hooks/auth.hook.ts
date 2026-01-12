/** @author Francis */
import { AxiosError } from 'axios';
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, me } from '../services/v2/AuthService';

type LoginInput = {
  email: string;
  password: string;
  fcm_token: string,
  device_id: string,
  device_type: string,
};

type LoginResponse = {
  data: any;
};

type ApiError = {
  error?: string;
};

const isTimeoutError = (error: AxiosError) => {
  return error.code === 'ECONNABORTED';
};

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, AxiosError<ApiError>, LoginInput>({
    mutationFn: async (data) => {
      return login({
        email: data.email,
        password: data.password,
        fcm_token: data.fcm_token,
        device_id: data.device_id,
        device_type: data.device_type,
      });
    },
    onSuccess: async (res) => {
      SecureStore.setItemAsync('JWT', res.data.token.jwt_token);
      SecureStore.setItemAsync('refreshToken', res.data.token.refresh_token);
      AsyncStorage.setItem('user', JSON.stringify(res.data.user));

      queryClient.setQueryData(['current-user'], res.data.user);
    },
    onError: (error) => {},
  });
}

export function useGetUser() {
  return useQuery({
    queryKey: ['current-user'],
    queryFn: () => me(),
    staleTime: Infinity,
    gcTime: Infinity
  });
};

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      return logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(['current-user'], false);
    },
  })
};

async function logout() {
  AsyncStorage.clear()
  SecureStore.deleteItemAsync('JWT')
  SecureStore.deleteItemAsync('refreshToken')
}