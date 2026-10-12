import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLibrary } from '../../contexts/LibraryContext';
import { Book } from '../../types';
import { saveCoverImage } from '../../utils/storage';

export const ThumbnailGenerator: React.FC = () => {
  const { books, updateBookCover } = useLibrary();
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const attemptedIdsRef = useRef<Set<string>>(new Set());
  const webViewRef = useRef<WebView>(null);
  const timeoutRef = useRef<any>(null);

  // Find next book needing a cover thumbnail
  useEffect(() => {
    if (currentBook) return;

    const bookNeedingCover = books.find(
      (b) =>
        (!b.coverUrl || b.coverUrl.length <= 20) &&
        b.uri &&
        !attemptedIdsRef.current.has(b.id)
    );

    if (bookNeedingCover) {
      attemptedIdsRef.current.add(bookNeedingCover.id);
      setCurrentBook(bookNeedingCover);

      // Safety timeout: if thumbnail takes > 12s, release queue
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        console.warn(`[ThumbnailGenerator] Timeout generating thumbnail for: ${bookNeedingCover.title}`);
        setCurrentBook(null);
      }, 12000);
    }
  }, [books, currentBook]);

  // Clean timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleMessage = async (event: any) => {
    try {
      if (!event.nativeEvent.data) return;
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'THUMBNAIL_READY' && data.coverUrl && currentBook) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        const permanentCoverUri = await saveCoverImage(currentBook.id, data.coverUrl);
        if (permanentCoverUri) {
          await updateBookCover(currentBook.id, permanentCoverUri);
        }
        setCurrentBook(null);
      } else if (data.type === 'THUMBNAIL_ERROR') {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        console.warn('[ThumbnailGenerator] Error from WebView:', data.error);
        setCurrentBook(null);
      }
    } catch (e) {
      console.warn('[ThumbnailGenerator] Message parse error:', e);
      setCurrentBook(null);
    }
  };

  const htmlContent = useMemo(() => {
    if (!currentBook) return '';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
</head>
<body>
  <div id="status">Loading...</div>
  <script>
    (async function() {
      const fileUri = ${JSON.stringify(currentBook.uri)};
      try {
        function waitForPdfjs(timeoutMs) {
          const start = Date.now();
          return new Promise(function(resolve, reject) {
            function check() {
              if (window.pdfjsLib) return resolve(window.pdfjsLib);
              if (Date.now() - start > timeoutMs) return reject(new Error('pdfjsLib load timeout'));
              setTimeout(check, 100);
            }
            check();
          });
        }

        await waitForPdfjs(8000);

        function loadArrayBuffer(url) {
          return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
              if ((xhr.status === 200 || xhr.status === 0) && xhr.response) {
                resolve(xhr.response);
              } else {
                reject(new Error('XHR status ' + xhr.status));
              }
            };
            xhr.onerror = function() {
              reject(new Error('XHR error on ' + url));
            };
            xhr.send();
          });
        }

        let buffer = null;
        try {
          buffer = await loadArrayBuffer(fileUri);
        } catch (_) {
          try {
            buffer = await loadArrayBuffer(encodeURI(fileUri));
          } catch (e2) {}
        }

        const cmapConfig = {
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true
        };

        const loadingTask = buffer 
          ? pdfjsLib.getDocument(Object.assign({ data: buffer }, cmapConfig))
          : pdfjsLib.getDocument(Object.assign({ url: fileUri, disableRange: true, disableStream: true }, cmapConfig));

        const doc = await loadingTask.promise;
        const page1 = await doc.getPage(1);
        const unscaled = page1.getViewport({ scale: 1.0 });
        const scale = Math.min(180 / (unscaled.width || 1), 0.45);
        const viewport = page1.getViewport({ scale: scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(Math.round(viewport.width), 100);
        canvas.height = Math.max(Math.round(viewport.height), 140);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page1.render({ canvasContext: ctx, viewport: viewport }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'THUMBNAIL_READY',
            coverUrl: dataUrl
          }));
        }
      } catch (err) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'THUMBNAIL_ERROR',
            error: String(err && err.message ? err.message : err)
          }));
        }
      }
    })();
  </script>
</body>
</html>
    `;
  }, [currentBook?.id, currentBook?.uri]);

  if (!currentBook) return null;

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        ref={webViewRef}
        key={currentBook.id}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'file:///' }}
        onMessage={handleMessage}
        style={styles.hiddenWebView}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hiddenContainer: {
    position: 'absolute',
    top: -200,
    left: -200,
    width: 2,
    height: 2,
    opacity: 0.01,
    overflow: 'hidden',
  },
  hiddenWebView: {
    width: 2,
    height: 2,
  },
});
