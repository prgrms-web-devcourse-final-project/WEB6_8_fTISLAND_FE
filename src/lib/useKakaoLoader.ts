/*
  Kakao Maps SDK singleton loader hook
  - 보안 키 탐색 우선순위: env → meta[name="kakao-js-key"] → window.__KAKAO_JS_KEY → localStorage → ?kakaoKey
  - autoload=false로 로드 후 kakao.maps.load로 초기화까지 보장
*/
import * as React from 'react';

declare global {
  interface Window {
    kakao?: any;
    __kakaoLoaderPromise?: Promise<void>;
    __KAKAO_JS_KEY?: string;
  }
}

function maskKey(value?: string): string | undefined {
  if (!value) return value;
  if (value.length <= 6) return '*'.repeat(value.length);
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function resolveKakaoKey(): string | undefined {
  try {
    const envKey = (import.meta as any)?.env?.VITE_KAKAO_JS_KEY as string | undefined;
    if (envKey) return envKey;
  } catch {}
  const metaKey = (document.querySelector('meta[name="kakao-js-key"]') as HTMLMetaElement | null)?.content || undefined;
  if (metaKey) return metaKey;
  if (typeof window !== 'undefined' && window.__KAKAO_JS_KEY) return window.__KAKAO_JS_KEY;
  try {
    const ls = localStorage.getItem('VITE_KAKAO_JS_KEY') || undefined;
    if (ls) return ls;
  } catch {}
  try {
    const urlKey = new URLSearchParams(location.search).get('kakaoKey') || undefined;
    if (urlKey) return urlKey;
  } catch {}
  return undefined;
}

export function useKakaoLoader(): { ready: boolean; error: string | null; ensure: () => Promise<void> } {
  const [ready, setReady] = React.useState<boolean>(
    typeof window !== 'undefined' && Boolean(window.kakao?.maps?.services)
  );
  const [error, setError] = React.useState<string | null>(null);

  const ensure = React.useCallback(async () => {
    if (typeof window === 'undefined') throw new Error('no-window');
    const w = window as Window;
    const done = () => setReady(true);

    // 이미 services가 있으면 종료
    if (w.kakao?.maps?.services) {
      done();
      return;
    }
    // kakao.maps.load만 있는 경우 초기화
    if (w.kakao?.maps?.load) {
      await new Promise<void>((resolve) => w.kakao!.maps!.load(() => resolve()));
      done();
      return;
    }

    // 디버그: 키 후보 로깅
    try {
      const envKey = (import.meta as any)?.env?.VITE_KAKAO_JS_KEY as string | undefined;
      const metaKey =
        (document.querySelector('meta[name="kakao-js-key"]') as HTMLMetaElement | null)?.content || undefined;
      const globalKey = (w as any).__KAKAO_JS_KEY as string | undefined;
      const lsKey = (() => {
        try {
          return localStorage.getItem('VITE_KAKAO_JS_KEY') || undefined;
        } catch {
          return undefined;
        }
      })();
      const urlKey = (() => {
        try {
          return new URLSearchParams(location.search).get('kakaoKey') || undefined;
        } catch {
          return undefined;
        }
      })();
      const picked = envKey || metaKey || globalKey || lsKey || urlKey || undefined;
      console.groupCollapsed('[KakaoLoader] 키 탐색');
      console.debug('envKey:', maskKey(envKey));
      console.debug('metaKey:', maskKey(metaKey));
      console.debug('global __KAKAO_JS_KEY:', maskKey(globalKey));
      console.debug('localStorage VITE_KAKAO_JS_KEY:', maskKey(lsKey));
      console.debug('url ?kakaoKey:', maskKey(urlKey));
      console.debug('picked:', maskKey(picked));
      console.groupEnd();
    } catch {}

    const key = resolveKakaoKey();
    if (!key) throw new Error('Missing VITE_KAKAO_JS_KEY');

    // 싱글톤 프라미스 사용
    if (w.__kakaoLoaderPromise) {
      await w.__kakaoLoaderPromise;
      // 보수적으로 재귀 없이 상태만 반영
      if (w.kakao?.maps?.load && !w.kakao?.maps?.services) {
        await new Promise<void>((resolve) => w.kakao!.maps!.load(() => resolve()));
      }
      done();
      return;
    }

    const existing = document.getElementById('kakao-maps-sdk') as HTMLScriptElement | null;
    if (existing) {
      try {
        console.debug('[KakaoLoader] 기존 kakao-maps-sdk 스크립트 태그 발견');
      } catch {}
      w.__kakaoLoaderPromise = new Promise<void>((res) => {
        const tryLoad = () => {
          const g = window as any;
          if (g?.kakao?.maps?.load) g.kakao.maps.load(() => res());
          else setTimeout(tryLoad, 50);
        };
        tryLoad();
      });
      await w.__kakaoLoaderPromise;
      done();
      return;
    }

    const script = document.createElement('script');
    script.id = 'kakao-maps-sdk';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
    script.async = true;
    w.__kakaoLoaderPromise = new Promise<void>((res) => {
      script.onload = () => {
        try {
          console.debug('[KakaoLoader] Kakao SDK onload fired');
        } catch {}
        const g = window as any;
        const waitLoad = () => {
          if (g?.kakao?.maps?.load) g.kakao.maps.load(() => res());
          else setTimeout(waitLoad, 50);
        };
        waitLoad();
      };
      script.onerror = () => {
        res();
        setError('Kakao SDK load failed');
        try {
          console.error('[KakaoLoader] Kakao SDK 로드 실패', { src: script.src });
        } catch {}
      };
    });
    try {
      console.debug('[KakaoLoader] Kakao SDK 로드 시작', { src: script.src });
    } catch {}
    document.head.appendChild(script);
    await w.__kakaoLoaderPromise;
    done();
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    // 옵셔널 자동 보장: 최초 마운트 시 한 번 시도 (팝업 열리기 전에 미리 로드 가능)
    ensure().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [ensure]);

  return { ready, error, ensure };
}
