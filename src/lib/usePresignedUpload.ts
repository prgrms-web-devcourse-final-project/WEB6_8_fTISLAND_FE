import { useMutation, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { generatePresignedUrl } from '@/api/generated';
import type { GeneratePresignedUrlRequestDomain } from '@/api/generated/model/generatePresignedUrlRequestDomain';

export interface PresignedUploadParams {
  file: File | Blob;
  domain: GeneratePresignedUrlRequestDomain;
  fileName?: string;
  contentType?: string;
}

export interface PresignedUploadResult {
  presignedUrl: string; // original signed URL (with query)
  objectUrl: string; // URL without query (useful to persist)
}

function ensureFileName(inputName: string | undefined, file: File | Blob): string {
  if (inputName && inputName.trim().length > 0) return inputName.trim();
  const fallbackBase = 'upload';
  const extFromFile =
    typeof File !== 'undefined' && file instanceof File && file.name.includes('.')
      ? file.name.slice(file.name.lastIndexOf('.') + 1)
      : undefined;
  const safeExt = extFromFile ? extFromFile : inferExtFromType((file as any).type as string | undefined);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return safeExt ? `${fallbackBase}-${uid}.${safeExt}` : `${fallbackBase}-${uid}`;
}

function inferExtFromType(mime: string | undefined): string | undefined {
  if (!mime) return undefined;
  // handle common image types
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  if (mime === 'image/heic') return 'heic';
  if (mime === 'image/heif') return 'heif';
  // generic
  const slashIndex = mime.indexOf('/');
  return slashIndex > -1 ? mime.slice(slashIndex + 1) : undefined;
}

async function putToPresignedUrl(url: string, file: File | Blob, contentType?: string): Promise<Response> {
  // Prefer using fetch to avoid axios interceptors (auth headers, baseURL)
  const headers: Record<string, string> = {};
  const finalType = contentType || (file as any).type || 'application/octet-stream';
  if (finalType) headers['Content-Type'] = finalType;
  return fetch(url, {
    method: 'PUT',
    headers,
    body: file,
  });
}

export function usePresignedUpload<TContext = unknown>(
  options?: UseMutationOptions<PresignedUploadResult, Error, PresignedUploadParams, TContext>
): UseMutationResult<PresignedUploadResult, Error, PresignedUploadParams, TContext> {
  return useMutation<PresignedUploadResult, Error, PresignedUploadParams, TContext>({
    mutationKey: ['presigned-upload'],
    mutationFn: async (params) => {
      const { file, domain } = params;
      const fileName = ensureFileName(params.fileName, file);
      const contentType = params.contentType || (file as any).type || 'application/octet-stream';
      const res = await generatePresignedUrl({ fileName, domain, contentType } as any);
      const presignedUrl = res?.data?.content?.presignedUrl;
      if (!presignedUrl) {
        throw new Error('서버로부터 presigned URL을 받지 못했습니다.');
      }
      const putRes = await putToPresignedUrl(presignedUrl, file, contentType);
      if (!putRes.ok) {
        const text = await safeReadText(putRes);
        throw new Error(text || `이미지 업로드 실패 (HTTP ${putRes.status})`);
      }
      const objectUrl = stripQuery(presignedUrl);
      return { presignedUrl, objectUrl };
    },
    onSuccess: (data, variables, context) => {
      toast.success('이미지 업로드 완료');
      // 호환: TanStack Query 버전별 아리티 차이를 안전 캐스팅으로 위임
      (options as any)?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      toast.error(error?.message || '이미지 업로드 중 오류가 발생했어요');
      (options as any)?.onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      (options as any)?.onSettled?.(data, error, variables, context);
    },
  });
}

function stripQuery(url: string): string {
  const q = url.indexOf('?');
  return q > -1 ? url.slice(0, q) : url;
}

async function safeReadText(res: Response): Promise<string | undefined> {
  try {
    const text = await res.text();
    return text?.slice(0, 500);
  } catch {
    return undefined;
  }
}
