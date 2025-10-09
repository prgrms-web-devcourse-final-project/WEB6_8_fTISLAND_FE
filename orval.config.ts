import { defineConfig } from 'orval';

// OpenAPI 스펙 URL은 서버 환경에 맞게 조정 가능
// 필요시 /v3/api-docs, /v3/api-docs/swagger-config, /swagger.json 등으로 변경하세요.
const OPENAPI_SPEC = 'https://api.deliver-anything.shop/v3/api-docs';

export default defineConfig({
  deliverAnything: {
    input: {
      target: OPENAPI_SPEC,
      // 일부 서버에서 스키마 검증 이슈가 있을 수 있어 완화
      validation: false,
    },
    output: {
      target: 'src/api/generated/index.ts',
      schemas: 'src/api/generated/model',
      client: 'react-query',
      // axios 기반 + 우리 프로젝트의 axios 인스턴스/인터셉터를 그대로 활용
      override: {
        mutator: {
          path: './src/api/orval-mutator.ts',
          name: 'customInstance',
        },
        // TanStack Query v5 옵션
        query: {
          useQuery: true,
          useMutation: true,
          useInfinite: true,
          suspense: false,
        },
      },
      clean: true,
      prettier: true,
    },
  },
});
