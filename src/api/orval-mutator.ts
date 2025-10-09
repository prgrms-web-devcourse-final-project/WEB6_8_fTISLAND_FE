import type { AxiosRequestConfig } from 'axios';
import { api as axiosInstance } from './core';

// orval의 mutator는 (config) => Promise<AxiosResponse> 형태를 기대합니다.
// 이 함수를 지정하면, 모든 생성된 api 함수가 우리 프로젝트의 axios 인스턴스를 공통 사용합니다.
export const customInstance = <T = unknown>(config: AxiosRequestConfig) => {
  return axiosInstance.request<T>(config);
};
