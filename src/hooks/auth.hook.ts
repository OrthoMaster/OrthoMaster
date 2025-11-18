/** @author Francis */
import { AxiosError } from 'axios';
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, me } from '../services/v2/AuthService';

type LoginInput = {
  email: string;
  password: string;
};

type LoginResponse = {
  data: any;
};

type ApiError = {
  error?: string;
};

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, AxiosError<ApiError>, LoginInput>({
    mutationFn: async (data) => {
      return login({
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: async (res) => {
      SecureStore.setItemAsync('JWT', res.data.token.jwt_token);
      SecureStore.setItemAsync('refreshToken', res.data.token.refresh_token);
      AsyncStorage.setItem('user', JSON.stringify(res.data.user));

      queryClient.setQueryData(['current-user'], res.data.user);
    },
  });
}

export function useGetUser() {
    // run the query
    return useQuery({
        queryKey: ['current-user'],
        // queryFn: () => getCurrentUser(), // Old version
        queryFn: () => me(),
        enabled: false,
        staleTime: Infinity,
    });
};
