// Chrome/Edge 116+ only — not yet in TypeScript's bundled DOM lib.
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API
interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
}

interface DocumentPictureInPicture extends EventTarget {
  readonly window: Window | null;
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
}

interface Window {
  documentPictureInPicture?: DocumentPictureInPicture;
}
