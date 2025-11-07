import { useQueryClient, useMutation } from "@tanstack/react-query";
import AuthService from '../services/AuthService';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { login } from '../services/v2/AuthService';


// login mutation
export function useLogin() {
    // get the query client
    const queryClient = useQueryClient();
    // create the mutation
    return useMutation({
        mutationFn: async (data) => {
            // return AuthService.login({ email: data.email, password: data.password })
            return login({ email: data.email, password: data.password });
        },
        onSuccess: async (res) => {
            // SecureStore.setItemAsync('JWT', data.token.jwt_token)
            // SecureStore.setItemAsync('refreshToken', data.token.refresh_token)
            // AsyncStorage.setItem('user', JSON.stringify(data.user))
            queryClient.setQueryData(['current-user'], res.user);
            await queryClient.invalidateQueries({ queryKey: ['current-user'] });
        }
    })
};