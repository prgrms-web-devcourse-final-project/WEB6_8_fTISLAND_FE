declare module 'event-source-polyfill' {
  export const NativeEventSource: typeof EventSource | undefined;

  export interface EventSourcePolyfillOptions extends EventSourceInit {
    headers?: Record<string, string>;
    heartbeatTimeout?: number;
  }

  export const EventSourcePolyfill: {
    new (url: string | URL, eventSourceInitDict?: EventSourcePolyfillOptions): EventSource;
  };
}
