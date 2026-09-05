import React, { useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Book, ReaderSettings } from '../../types';

export interface PdfViewerCanvasRef {
  jumpToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

interface PdfViewerCanvasProps {
  book: Book;
  fileUri: string;
  settings: ReaderSettings;
  currentPage: number;
  onPageChange: (page: number, totalPages: number) => void;
  onCoverGenerated?: (coverUrl: string) => void;
  onToggleOverlay: () => void;
}

export const PdfViewerCanvas = React.forwardRef<PdfViewerCanvasRef, PdfViewerCanvasProps>(
  (
    {
      book,
      fileUri,
      settings,
      currentPage,
      onPageChange,
      onCoverGenerated,
      onToggleOverlay,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);
    const pdfLoadedRef = useRef<boolean>(false);

    // Expose explicit programmatic controls to React Native UI without bidirectional echo
    useImperativeHandle(ref, () => ({
      jumpToPage: (page: number) => {
        console.log('[PdfViewerCanvas] Imperative jumpToPage called:', page);
        webViewRef.current?.injectJavaScript(`
          if (typeof window.jumpToPage === 'function') {
            window.jumpToPage(${page});
          }
          true;
        `);
      },
      nextPage: () => {
        webViewRef.current?.injectJavaScript(`
          if (typeof window.nextPage === 'function') {
            window.nextPage();
          }
          true;
        `);
      },
      prevPage: () => {
        webViewRef.current?.injectJavaScript(`
          if (typeof window.prevPage === 'function') {
            window.prevPage();
          }
          true;
        `);
      },
    }));

    // Inject PDF file URI directly into V8 global window scope (0 JVM Heap allocation)
    const injectedJS = useMemo(() => {
      console.log('[PdfViewerCanvas] Preparing injectedJS payload. File URI:', fileUri);
      return `
        (function() {
          window.__PDF_FILE_URI__ = "${fileUri}";
          window.__PDF_INITIAL_PAGE__ = ${currentPage};
          window.__PDF_INITIAL_SETTINGS__ = ${JSON.stringify(settings)};
          if (typeof window.checkAndLoadPDF === 'function') {
            window.checkAndLoadPDF();
          }
        })();
        true;
      `;
    }, [book.id, fileUri]);

    // Inject dynamic settings updates directly into V8 engine WITHOUT reloading the WebView
    useEffect(() => {
      if (webViewRef.current) {
        console.log('[PdfViewerCanvas] Injecting dynamic settings into V8 engine:', settings);
        webViewRef.current.injectJavaScript(`
          if (typeof window.applyDynamicSettings === 'function') {
            window.applyDynamicSettings(${JSON.stringify(settings)});
          }
          true;
        `);
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
      -webkit-overflow-scrolling: touch;
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
      min-height: 500px;
      padding: 2px 0;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      position: relative;
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
      transition: transform 0.32s cubic-bezier(0.25, 1, 0.5, 1);
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

    .page-placeholder {
      display: flex;
      justify-content: center;
      align-items: center;
      color: #666666;
      font-size: 14px;
      font-weight: 500;
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
    // Forward console logs to React Native
    (function() {
      const origLog = console.log;
      const origErr = console.error;
      const origWarn = console.warn;
      console.log = function(...args) {
        origLog.apply(console, args);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONSOLE_LOG', level: 'LOG', msg: args.join(' ') }));
        }
      };
      console.error = function(...args) {
        origErr.apply(console, args);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONSOLE_LOG', level: 'ERROR', msg: args.join(' ') }));
        }
      };
      console.warn = function(...args) {
        origWarn.apply(console, args);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONSOLE_LOG', level: 'WARN', msg: args.join(' ') }));
        }
      };
    })();

    console.log('[WebView HTML] Initializing WebView PDF script...');

    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      console.log('[WebView HTML] PDF.js workerSrc set successfully.');
    } else {
      console.error('[WebView HTML] ERROR: pdfjsLib is undefined! Check CDN network.');
    }

    let pdfDoc = null;
    let totalPages = 1;
    let currentPage = 1;
    let readingMode = "long_strip";
    let volumeKeyNav = false;
    let isInitialJumpDone = false;
    let isCoverGenerated = false;

    // Gesture & Animation queue for Single Page mode (glitch-free back-to-back swiping)
    let isTransitioning = false;
    let pendingNavDirection = 0; // +1 for next, -1 for prev
    let transitionTimeout = null;
    let isUserTouching = false;
    let touchStartX = 0;
    let touchStartY = 0;

    // Estimated page height based on page aspect ratio (stabilizes scroll container, 0 layout shifts)
    let estimatedPageHeight = Math.round(window.innerWidth * 1.414);

    // Page rendering cache & virtualization maps
    const renderedPages = new Set();
    const renderingPages = new Set();
    let intersectionObserver = null;

    function loadFileAsArrayBuffer(url) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if ((xhr.status === 200 || xhr.status === 0) && xhr.response && xhr.response.byteLength > 0) {
            resolve(xhr.response);
          } else {
            reject(new Error('XHR status ' + xhr.status + ' loading ' + url));
          }
        };
        xhr.onerror = function() {
          reject(new Error('XHR network error on file URI: ' + url));
        };
        xhr.send();
      });
    }

    window.checkAndLoadPDF = function() {
      if (window.__PDF_FILE_URI__ && !pdfDoc) {
        console.log('[WebView HTML] checkAndLoadPDF triggered with URI:', window.__PDF_FILE_URI__);
        initPDFFromFileUri(window.__PDF_FILE_URI__, window.__PDF_INITIAL_PAGE__, window.__PDF_INITIAL_SETTINGS__);
      }
    };

    async function initPDFFromFileUri(fileUri, initialPage, initialSettings) {
      console.log('[WebView HTML] initPDFFromFileUri called:', fileUri);
      const loader = document.getElementById('loader');
      try {
        if (initialPage) currentPage = initialPage;
        if (initialSettings) applyDynamicSettings(initialSettings);

        let buffer = null;
        try {
          console.log('[WebView HTML] Loading PDF ArrayBuffer via native Chromium XHR...');
          buffer = await loadFileAsArrayBuffer(fileUri);
          console.log('[WebView HTML] ArrayBuffer loaded successfully! Bytes:', buffer.byteLength);
        } catch (xhrErr) {
          console.warn('[WebView HTML] Direct XHR failed, trying encoded URI...', xhrErr);
          try {
            buffer = await loadFileAsArrayBuffer(encodeURI(fileUri));
          } catch (encErr) {
            console.warn('[WebView HTML] Encoded XHR failed, attempting PDF.js direct URL stream...', encErr);
          }
        }

        let loadingTask;
        if (buffer) {
          loadingTask = pdfjsLib.getDocument({
            data: buffer,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true
          });
        } else {
          loadingTask = pdfjsLib.getDocument({
            url: fileUri,
            cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
            cMapPacked: true,
            disableRange: true,
            disableStream: true
          });
        }

        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        console.log('[WebView HTML] PDF loaded & parsed! Total pages:', totalPages);

        if (loader) loader.style.display = 'none';
        renderView();
        notifyPageChange();
      } catch (err) {
        console.error('[WebView HTML] PDF initialization error:', err);
        if (loader) loader.innerText = 'Unable to render PDF document. Error: ' + err.message;
      }
    }

    function renderView() {
      console.log('[WebView HTML] renderView called. ReadingMode:', readingMode, 'Total pages:', totalPages);
      const app = document.getElementById('app');
      const container = document.getElementById('scroll-container');
      app.innerHTML = '';
      renderedPages.clear();
      renderingPages.clear();

      if (intersectionObserver) {
        intersectionObserver.disconnect();
        intersectionObserver = null;
      }

      if (readingMode === 'long_strip') {
        container.style.overflowY = 'auto';
        const strip = document.createElement('div');
        strip.className = 'long-strip';

        // Pre-create placeholder wrappers with locked uniform minHeight to prevent scroll jumping
        for (let i = 1; i <= totalPages; i++) {
          const wrapper = document.createElement('div');
          wrapper.id = 'page-wrapper-' + i;
          wrapper.className = 'page-wrapper';
          wrapper.setAttribute('data-page', i);
          wrapper.style.minHeight = estimatedPageHeight + 'px';

          const placeholder = document.createElement('div');
          placeholder.className = 'page-placeholder';
          placeholder.id = 'placeholder-' + i;
          placeholder.innerText = 'Page ' + i;
          wrapper.appendChild(placeholder);

          strip.appendChild(wrapper);
        }
        app.appendChild(strip);

        // Virtualized rendering: only render canvases near viewport
        setupVirtualizedLongStrip();
        setupScrollObserver();

        if (!isInitialJumpDone) {
          isInitialJumpDone = true;
          setTimeout(() => {
            const target = document.getElementById('page-wrapper-' + currentPage);
            if (target) {
              target.scrollIntoView({ behavior: 'auto' });
              ensurePageRendered(currentPage);
            }
          }, 150);
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
          wrapper.id = 'page-wrapper-' + i;
          wrapper.setAttribute('data-page', i);

          const placeholder = document.createElement('div');
          placeholder.className = 'page-placeholder';
          placeholder.innerText = 'Page ' + i;
          wrapper.appendChild(placeholder);

          slider.appendChild(wrapper);
        }

        // Attach transitionend listener to dequeue back-to-back gestures
        slider.addEventListener('transitionend', onSliderTransitionEnd);

        viewport.appendChild(slider);
        app.appendChild(viewport);
        updateSliderPosition(false);
        updateSinglePageRenderWindow();
      }
    }

    // Virtualized IntersectionObserver for Long Strip mode
    function setupVirtualizedLongStrip() {
      if (!('IntersectionObserver' in window)) {
        for (let i = 1; i <= Math.min(10, totalPages); i++) {
          ensurePageRendered(i);
        }
        return;
      }

      intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const wrapper = entry.target;
          const pNum = parseInt(wrapper.getAttribute('data-page'), 10);
          if (entry.isIntersecting) {
            ensurePageRendered(pNum);
          } else {
            // Free canvases that are distant to conserve GPU/RAM, only if memory pressure warrants
            if (Math.abs(pNum - currentPage) > 5 && renderedPages.size > 10) {
              freePageCanvas(pNum);
            }
          }
        });
      }, {
        root: document.getElementById('scroll-container'),
        rootMargin: '120% 0px 120% 0px'
      });

      const wrappers = document.querySelectorAll('.long-strip .page-wrapper');
      wrappers.forEach((wrap) => intersectionObserver.observe(wrap));
    }

    // Ensure a specific page canvas is rendered
    async function ensurePageRendered(pageNum) {
      if (renderedPages.has(pageNum) || renderingPages.has(pageNum)) return;
      const wrapper = document.getElementById('page-wrapper-' + pageNum);
      if (!wrapper) return;

      renderingPages.add(pageNum);
      let canvas = wrapper.querySelector('canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'page-canvas-' + pageNum;
        wrapper.appendChild(canvas);
      }

      const placeholder = wrapper.querySelector('.page-placeholder');
      if (placeholder) placeholder.style.display = 'none';

      await renderPageCanvas(pageNum, canvas, wrapper);
      renderingPages.delete(pageNum);
      renderedPages.add(pageNum);
    }

    // Free canvas memory for distant pages without collapsing wrapper height
    function freePageCanvas(pageNum) {
      if (pageNum === 1) return; // Keep page 1 for cover thumbnail
      if (!renderedPages.has(pageNum)) return;

      const wrapper = document.getElementById('page-wrapper-' + pageNum);
      if (!wrapper) return;

      const canvas = wrapper.querySelector('canvas');
      if (canvas) {
        if (canvas.clientHeight > 0) {
          wrapper.style.minHeight = canvas.clientHeight + 'px';
        }
        canvas.remove();
      }

      const placeholder = wrapper.querySelector('.page-placeholder');
      if (placeholder) placeholder.style.display = 'flex';

      renderedPages.delete(pageNum);
    }

    // Sliding window of 3 pages in Single Page mode
    function updateSinglePageRenderWindow() {
      const activeWindow = [currentPage - 1, currentPage, currentPage + 1];
      activeWindow.forEach((p) => {
        if (p >= 1 && p <= totalPages) {
          ensurePageRendered(p);
        }
      });

      for (const p of renderedPages) {
        if (Math.abs(p - currentPage) > 2) {
          freePageCanvas(p);
        }
      }
    }

    async function renderPageCanvas(pageNum, canvas, wrapper) {
      if (!pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.25 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Calculate and stabilize uniform page aspect ratio from page 1
        if (pageNum === 1 && viewport.width > 0) {
          const ratio = viewport.height / viewport.width;
          estimatedPageHeight = Math.round(window.innerWidth * ratio);
        }

        const actualHeight = Math.round((window.innerWidth / (viewport.width || 1)) * viewport.height);
        if (wrapper && readingMode === 'long_strip') {
          wrapper.style.minHeight = (canvas.clientHeight || actualHeight || estimatedPageHeight) + 'px';
        }

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        if (wrapper && readingMode === 'long_strip' && canvas.clientHeight > 0) {
          wrapper.style.minHeight = canvas.clientHeight + 'px';
        }

        // Generate Page 1 PNG cover thumbnail data URL for library cards
        if (pageNum === 1 && !isCoverGenerated) {
          isCoverGenerated = true;
          try {
            const thumbUrl = canvas.toDataURL('image/png');
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'PAGE1_THUMBNAIL',
              coverUrl: thumbUrl
            }));
          } catch (e) {
            console.error('[WebView HTML] Thumbnail canvas.toDataURL error:', e);
          }
        }
      } catch (e) {
        console.error('[WebView HTML] Error rendering page ' + pageNum, e);
      }
    }

    function updateSliderPosition(animate = true) {
      const slider = document.getElementById('page-slider');
      if (slider) {
        if (!animate) {
          slider.style.transition = 'none';
        } else {
          slider.style.transition = 'transform 0.26s cubic-bezier(0.25, 1, 0.5, 1)';
        }
        const offset = (currentPage - 1) * -100;
        slider.style.transform = 'translateX(' + offset + '%)';
      }
    }

    function executePageTransition(direction) {
      isTransitioning = true;
      currentPage += direction;
      updateSliderPosition(true);
      updateSinglePageRenderWindow();
      notifyPageChange();

      if (transitionTimeout) clearTimeout(transitionTimeout);
      transitionTimeout = setTimeout(() => {
        onSliderTransitionEnd();
      }, 290);
    }

    function onSliderTransitionEnd() {
      if (transitionTimeout) {
        clearTimeout(transitionTimeout);
        transitionTimeout = null;
      }
      isTransitioning = false;

      // Handle queued gestures sequentially without glitching
      if (pendingNavDirection !== 0) {
        const dir = pendingNavDirection > 0 ? 1 : -1;
        pendingNavDirection = pendingNavDirection > 0 ? pendingNavDirection - 1 : pendingNavDirection + 1;
        requestAnimationFrame(() => {
          if (dir > 0 && currentPage < totalPages) {
            executePageTransition(1);
          } else if (dir < 0 && currentPage > 1) {
            executePageTransition(-1);
          }
        });
      }
    }

    // Scroll observer with Viewport Midpoint Detection for Long Strip mode
    function setupScrollObserver() {
      const container = document.getElementById('scroll-container');
      if (!container) return;

      let isTicking = false;
      container.addEventListener('scroll', () => {
        if (!isTicking) {
          window.requestAnimationFrame(() => {
            const midY = window.innerHeight * 0.4;
            const wrappers = document.querySelectorAll('.long-strip .page-wrapper');
            for (let i = 0; i < wrappers.length; i++) {
              const rect = wrappers[i].getBoundingClientRect();
              if (rect.top <= midY && rect.bottom >= midY) {
                const pNum = parseInt(wrappers[i].getAttribute('data-page'), 10);
                if (pNum && pNum !== currentPage) {
                  currentPage = pNum;
                  notifyPageChange();
                }
                break;
              }
            }
            isTicking = false;
          });
          isTicking = true;
        }
      }, { passive: true });
    }

    // Touch events for HUD toggle and single-page swiping
    document.addEventListener('touchstart', (e) => {
      isUserTouching = true;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      setTimeout(() => { isUserTouching = false; }, 150);

      // Tap detection for overlay toggle or tap navigation
      if (Math.abs(diffX) < 16 && Math.abs(diffY) < 16) {
        const screenWidth = window.innerWidth;
        if (touchStartX < screenWidth * 0.25) {
          if (readingMode !== 'long_strip') prevPage();
        } else if (touchStartX > screenWidth * 0.75) {
          if (readingMode !== 'long_strip') nextPage();
        } else {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_OVERLAY' }));
        }
      } else if (Math.abs(diffX) > 36 && Math.abs(diffX) > Math.abs(diffY) && readingMode !== 'long_strip') {
        // Horizontal swipe gesture in Single Page mode
        if (diffX < 0) {
          nextPage();
        } else {
          prevPage();
        }
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

    function jumpToPage(p) {
      console.log('[WebView HTML] jumpToPage called with target page:', p);
      if (p < 1 || p > totalPages) return;
      if (currentPage === p) return;

      const isConsecutive = Math.abs(p - currentPage) === 1;
      currentPage = p;

      if (readingMode === 'long_strip') {
        const target = document.getElementById('page-wrapper-' + currentPage);
        if (target) {
          target.scrollIntoView({ behavior: isConsecutive ? 'smooth' : 'auto', block: 'start' });
          ensurePageRendered(currentPage);
        }
      } else {
        isTransitioning = false;
        pendingNavDirection = 0;
        if (transitionTimeout) clearTimeout(transitionTimeout);
        updateSliderPosition(isConsecutive);
        updateSinglePageRenderWindow();
      }
      notifyPageChange();
    }
    window.jumpToPage = jumpToPage;

    function nextPage() {
      if (readingMode === 'long_strip') {
        if (currentPage < totalPages) {
          jumpToPage(currentPage + 1);
        }
        return;
      }

      if (isTransitioning) {
        const projectedPage = currentPage + (pendingNavDirection > 0 ? pendingNavDirection + 1 : 1);
        if (projectedPage <= totalPages) {
          pendingNavDirection = pendingNavDirection > 0 ? pendingNavDirection + 1 : 1;
        }
        return;
      }

      if (currentPage < totalPages) {
        executePageTransition(1);
      }
    }
    window.nextPage = nextPage;

    function prevPage() {
      if (readingMode === 'long_strip') {
        if (currentPage > 1) {
          jumpToPage(currentPage - 1);
        }
        return;
      }

      if (isTransitioning) {
        const projectedPage = currentPage + (pendingNavDirection < 0 ? pendingNavDirection - 1 : -1);
        if (projectedPage >= 1) {
          pendingNavDirection = pendingNavDirection < 0 ? pendingNavDirection - 1 : -1;
        }
        return;
      }

      if (currentPage > 1) {
        executePageTransition(-1);
      }
    }
    window.prevPage = prevPage;

    function notifyPageChange() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAGE_CHANGE',
          page: currentPage,
          totalPages: totalPages
        }));
      }
    }

    // Dynamic CSS Custom Variable updater without page reload
    function applyDynamicSettings(s) {
      console.log('[WebView HTML] applyDynamicSettings called with:', JSON.stringify(s));
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
    window.applyDynamicSettings = applyDynamicSettings;

    // Safe Message listener from React Native
    window.addEventListener('message', (event) => {
      try {
        if (!event.data || typeof event.data !== 'string') return;
        const data = JSON.parse(event.data);

        if (data.action === 'JUMP_TO_PAGE') {
          jumpToPage(data.page);
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
      } catch (e) {
        console.error('[WebView HTML] window message error:', e);
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      window.checkAndLoadPDF();
    });
  </script>
</body>
</html>
    `;
  }, [book.id]);

  const handleMessage = (event: any) => {
    try {
      if (!event.nativeEvent.data) return;
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'CONSOLE_LOG') {
        console.log(`[WebView ${data.level || 'LOG'}]`, data.msg);
      } else if (data.type === 'TOGGLE_OVERLAY') {
        onToggleOverlay();
      } else if (data.type === 'PAGE_CHANGE') {
        onPageChange(data.page, data.totalPages);
      } else if (data.type === 'PAGE1_THUMBNAIL') {
        console.log('[PdfViewerCanvas] Received PAGE1_THUMBNAIL Data URL from WebView!');
        if (onCoverGenerated && data.coverUrl) {
          onCoverGenerated(data.coverUrl);
        }
      }
    } catch (e) {
      console.error('[PdfViewerCanvas handleMessage] Error:', e);
    }
  };

  const handleWebViewLoad = () => {
    pdfLoadedRef.current = true;
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent, baseUrl: 'file:///' }}
        injectedJavaScriptBeforeContentLoaded={injectedJS}
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
});

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
