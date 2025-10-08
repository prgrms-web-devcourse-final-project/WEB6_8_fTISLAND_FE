import { useMutation } from '@tanstack/react-query';
import { http } from '@/api/core';

export type SignupPayload = {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
};

export type SignupResponse = {
  success: boolean;
  code: string;
  message: string;
  content: {
    userId: number;
    email: string;
    name: string;
    isOnboardingCompleted: boolean;
  };
};

export default function useSignup() {
  const mutation = useMutation({
    mutationKey: ['signup'],
    mutationFn: async (payload: SignupPayload) => {
      return await http.post<SignupResponse>('/api/v1/auth/signup', payload);
    },
  });

  return { signup: mutation.mutateAsync, loading: mutation.isPending };
}
