import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Book, ReaderSettings } from '../../types';

interface PdfViewerCanvasProps {
  book: Book;
  pdfBase64: string | null;
  settings: ReaderSettings;
  currentPage: number;
  onPageChange: (page: number, totalPages: number) => void;
  onCoverGenerated?: (coverUrl: string) => void;
  onToggleOverlay: () => void;
}

export const PdfViewerCanvas: React.FC<PdfViewerCanvasProps> = ({
  book,
  pdfBase64,
  settings,
  currentPage,
  onPageChange,
  onCoverGenerated,
  onToggleOverlay,
}) => {
  const webViewRef = useRef<WebView>(null);
  const pdfSentRef = useRef<boolean>(false);

  // Helper to send PDF payload into WebView safely
  const sendPdfPayload = () => {
    if (pdfBase64 && webViewRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          action: 'LOAD_PDF_BASE64',
          pdfBase64,
          currentPage,
          settings,
        })
      );
      pdfSentRef.current = true;
    }
  };

  // Send PDF Base64 data whenever pdfBase64 prop loads/updates
  useEffect(() => {
    if (pdfBase64) {
      sendPdfPayload();
    }
  }, [pdfBase64]);

  // Send dynamic settings updates over postMessage WITHOUT reloading the WebView
  useEffect(() => {
    if (webViewRef.current && pdfSentRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          action: 'UPDATE_SETTINGS',
          settings,
        })
      );
    }
  }, [
    settings.readerTheme,
    settings.readingMode,
    settings.sidePadding,
    settings.grayscale,
    settings.inverted,
    settings.cropBorders,
    settings.volumeKeyNavigation,
  ]);

  // Send page jump over postMessage WITHOUT reloading the WebView
  useEffect(() => {
    if (webViewRef.current && pdfSentRef.current) {
      webViewRef.current.postMessage(
        JSON.stringify({
          action: 'JUMP_TO_PAGE',
          page: currentPage,
        })
      );
    }
  }, [currentPage]);

  // Construct static base HTML string ONCE so WebView source prop NEVER changes
  const htmlContent = useMemo(() => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    :root {
      --bg-color: #000000;
      --side-padding: 0%;
      --canvas-filter: none;
    }

    * {
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background-color: var(--bg-color);
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow: hidden;
      transition: background-color 0.2s ease;
    }
    
    #scroll-container {
      width: 100%;
      height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      background-color: var(--bg-color);
      box-sizing: border-box;
      transition: background-color 0.2s ease;
    }

    /* Continuous Long Strip webtoon strip layout */
    .long-strip {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 12px;
      padding-bottom: 12px;
      padding-left: var(--side-padding);
      padding-right: var(--side-padding);
      width: 100%;
      box-sizing: border-box;
      align-items: center;
    }

    .long-strip .page-wrapper {
      width: 100%;
      height: auto;
      min-height: unset;
      padding: 2px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
    }

    /* Single Page Slider & Touch Swipe Animation */
    .single-page-viewport {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding-left: var(--side-padding);
      padding-right: var(--side-padding);
      box-sizing: border-box;
    }

    .single-page-slider {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
      will-change: transform;
    }

    .single-page-viewport .page-wrapper {
      min-width: 100%;
      width: 100%;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 6px;
      box-sizing: border-box;
    }

    canvas {
      display: block;
      margin: 0 auto;
      max-width: 100%;
      max-height: 98vh;
      height: auto;
      object-fit: contain;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      border-radius: 4px;
      filter: var(--canvas-filter);
      transition: filter 0.2s ease;
    }

    .loading-text {
      position: absolute;
      top: 45%;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 15px;
      font-weight: 600;
      opacity: 0.85;
    }
  </style>
</head>
<body>
  <div id="scroll-container">
    <div id="app">
      <div class="loading-text" id="loader">Preparing PDF Document...</div>
    </div>
  </div>

  <script>
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    let pdfDoc = null;
    let totalPages = 1;
    let currentPage = 1;
    let readingMode = "long_strip";
    let volumeKeyNav = false;
    let isInitialJumpDone = false;
    let isCoverGenerated = false;

    let touchStartX = 0;
    let touchStartY = 0;

    // Send READY handshake to React Native
    function sendReadySignal() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'WEBVIEW_READY' }));
      }
    }

    // Polling handshake until pdfDoc is initialized
    const readyInterval = setInterval(() => {
      if (!pdfDoc) {
        sendReadySignal();
      } else {
        clearInterval(readyInterval);
      }
    }, 400);

    function base64ToUint8Array(base64) {
      const raw = atob(base64);
      const uint8Array = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) {
        uint8Array[i] = raw.charCodeAt(i);
      }
      return uint8Array;
    }

    async function initPDFFromBase64(base64Data, initialPage, initialSettings) {
      const loader = document.getElementById('loader');
      try {
        if (initialPage) currentPage = initialPage;
        if (initialSettings) applyDynamicSettings(initialSettings);

        if (base64Data && base64Data.length > 100) {
          const buffer = base64ToUint8Array(base64Data);
          const loadingTask = pdfjsLib.getDocument({ data: buffer });
          pdfDoc = await loadingTask.promise;
          totalPages = pdfDoc.numPages;
          clearInterval(readyInterval);
        }

        if (loader) loader.style.display = 'none';
        renderView();
        notifyPageChange();
      } catch (err) {
        console.error('PDF parsing error:', err);
        if (loader) loader.innerText = 'Unable to render PDF document.';
      }
    }

    function renderView() {
      const app = document.getElementById('app');
      const container = document.getElementById('scroll-container');
      app.innerHTML = '';

      if (readingMode === 'long_strip') {
        container.style.overflowY = 'auto';
        const strip = document.createElement('div');
        strip.className = 'long-strip';
        for (let i = 1; i <= totalPages; i++) {
          const wrapper = document.createElement('div');
          wrapper.id = 'page-wrapper-' + i;
          wrapper.className = 'page-wrapper';
          wrapper.setAttribute('data-page', i);
          const canvas = document.createElement('canvas');
          canvas.id = 'page-canvas-' + i;
          wrapper.appendChild(canvas);
          strip.appendChild(wrapper);
          renderPageCanvas(i, canvas);
        }
        app.appendChild(strip);

        setupScrollObserver();
        if (!isInitialJumpDone) {
          isInitialJumpDone = true;
          setTimeout(() => {
            const target = document.getElementById('page-wrapper-' + currentPage);
            if (target) target.scrollIntoView({ behavior: 'auto' });
          }, 200);
        }
      } else {
        container.style.overflowY = 'hidden';
        const viewport = document.createElement('div');
        viewport.className = 'single-page-viewport';

        const slider = document.createElement('div');
        slider.className = 'single-page-slider';
        slider.id = 'page-slider';

        for (let i = 1; i <= totalPages; i++) {
          const wrapper = document.createElement('div');
          wrapper.className = 'page-wrapper';
          const canvas = document.createElement('canvas');
          canvas.id = 'page-canvas-' + i;
          wrapper.appendChild(canvas);
          slider.appendChild(wrapper);
          renderPageCanvas(i, canvas);
        }

        viewport.appendChild(slider);
        app.appendChild(viewport);
        updateSliderPosition();
      }
    }

    async function renderPageCanvas(pageNum, canvas) {
      if (!pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.2 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        // Generate Page 1 PNG cover thumbnail data URL for library cards
        if (pageNum === 1 && !isCoverGenerated) {
          isCoverGenerated = true;
          try {
            const thumbUrl = canvas.toDataURL('image/png');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAGE1_THUMBNAIL',
              coverUrl: thumbUrl
            }));
          } catch (e) {}
        }
      } catch (e) {
        console.error('Error rendering page ' + pageNum, e);
      }
    }

    function updateSliderPosition() {
      const slider = document.getElementById('page-slider');
      if (slider) {
        const offset = (currentPage - 1) * -100;
        slider.style.transform = 'translateX(' + offset + '%)';
      }
    }

    // Scroll observer for real-time progress in Long Strip mode
    function setupScrollObserver() {
      const container = document.getElementById('scroll-container');
      if (!container) return;

      let isTicking = false;
      container.addEventListener('scroll', () => {
        if (!isTicking) {
          window.requestAnimationFrame(() => {
            const wrappers = document.querySelectorAll('.page-wrapper');
            wrappers.forEach((wrap) => {
              const rect = wrap.getBoundingClientRect();
              if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
                const pNum = parseInt(wrap.getAttribute('data-page'), 10);
                if (pNum && pNum !== currentPage) {
                  currentPage = pNum;
                  notifyPageChange();
                }
              }
            });
            isTicking = false;
          });
          isTicking = true;
        }
      }, { passive: true });
    }

    // Differentiate between Tap (overlay toggle) and Swipe (page turn animation)
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = touchEndX - touchStartX;
      const diffY = e.changedTouches[0].clientY - touchStartY;

      if (Math.abs(diffX) < 15 && Math.abs(diffY) < 15) {
        const screenWidth = window.innerWidth;
        if (touchStartX < screenWidth * 0.25) {
          if (readingMode !== 'long_strip') prevPage();
        } else if (touchStartX > screenWidth * 0.75) {
          if (readingMode !== 'long_strip') nextPage();
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_OVERLAY' }));
        }
      } else if (Math.abs(diffX) > 40 && readingMode !== 'long_strip') {
        if (diffX < 0) nextPage();
        else prevPage();
      }
    }, { passive: true });

    // Hardware Volume Keys & Keyboard Navigation
    window.addEventListener('keydown', (e) => {
      if (!volumeKeyNav) return;
      if (e.key === 'VolumeUp' || e.keyCode === 24 || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        prevPage();
        e.preventDefault();
      } else if (e.key === 'VolumeDown' || e.keyCode === 25 || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextPage();
        e.preventDefault();
      }
    });

    function nextPage() {
      if (currentPage < totalPages) {
        currentPage++;
        if (readingMode === 'long_strip') {
          const target = document.getElementById('page-wrapper-' + currentPage);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        } else {
          updateSliderPosition();
        }
        notifyPageChange();
      }
    }

    function prevPage() {
      if (currentPage > 1) {
        currentPage--;
        if (readingMode === 'long_strip') {
          const target = document.getElementById('page-wrapper-' + currentPage);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        } else {
          updateSliderPosition();
        }
        notifyPageChange();
      }
    }

    function notifyPageChange() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'PAGE_CHANGE',
        page: currentPage,
        totalPages: totalPages
      }));
    }

    // Dynamic CSS Custom Variable updater without page reload
    function applyDynamicSettings(s) {
      const root = document.documentElement;

      if (s.readerTheme) {
        const bgMap = { oled: '#000000', dark: '#16131B', sepia: '#F4ECD8', light: '#FFFFFF' };
        const bgColor = bgMap[s.readerTheme] || '#000000';
        root.style.setProperty('--bg-color', bgColor);
      }

      if (s.sidePadding !== undefined) {
        root.style.setProperty('--side-padding', s.sidePadding + '%');
      }

      let filters = [];
      if (s.grayscale) filters.push('grayscale(100%)');
      if (s.inverted) filters.push('invert(100%) hue-rotate(180deg)');
      const filterStr = filters.length > 0 ? filters.join(' ') : 'none';
      root.style.setProperty('--canvas-filter', filterStr);

      if (s.readingMode && s.readingMode !== readingMode) {
        readingMode = s.readingMode;
        renderView();
      }
    }

    // Safe Message listener from React Native
    window.addEventListener('message', (event) => {
      try {
        if (!event.data || typeof event.data !== 'string') return;
        const data = JSON.parse(event.data);

        if (data.action === 'LOAD_PDF_BASE64') {
          initPDFFromBase64(data.pdfBase64, data.currentPage, data.settings);
        } else if (data.action === 'JUMP_TO_PAGE') {
          if (currentPage !== data.page) {
            currentPage = data.page;
            if (readingMode === 'long_strip') {
              const target = document.getElementById('page-wrapper-' + currentPage);
              if (target) target.scrollIntoView({ behavior: 'auto' });
            } else {
              updateSliderPosition();
            }
          }
        } else if (data.action === 'UPDATE_SETTINGS') {
          applyDynamicSettings(data.settings);
          if (data.settings.volumeKeyNavigation !== undefined) {
            volumeKeyNav = data.settings.volumeKeyNavigation;
          }
        } else if (data.action === 'NEXT_PAGE') {
          nextPage();
        } else if (data.action === 'PREV_PAGE') {
          prevPage();
        }
      } catch (e) {}
    });

    sendReadySignal();
  </script>
</body>
</html>
    `;
  }, [book.id]);

  const handleMessage = (event: any) => {
    try {
      if (!event.nativeEvent.data) return;
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'WEBVIEW_READY') {
        sendPdfPayload();
      } else if (data.type === 'TOGGLE_OVERLAY') {
        onToggleOverlay();
      } else if (data.type === 'PAGE_CHANGE') {
        onPageChange(data.page, data.totalPages);
      } else if (data.type === 'PAGE1_THUMBNAIL') {
        if (onCoverGenerated && data.coverUrl) {
          onCoverGenerated(data.coverUrl);
        }
      }
    } catch (e) {
      console.error('WebView postMessage error:', e);
    }
  };

  const handleWebViewLoad = () => {
    sendPdfPayload();
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        onLoadEnd={handleWebViewLoad}
        style={styles.webview}
        scrollEnabled={true}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        allowFileAccess={true}
        allowFileAccessFromFileURLs={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
