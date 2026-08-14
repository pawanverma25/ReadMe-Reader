import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Book, ReaderSettings } from '../../types';

interface PdfViewerCanvasProps {
  book: Book;
  settings: ReaderSettings;
  currentPage: number;
  onPageChange: (page: number, totalPages: number) => void;
  onToggleOverlay: () => void;
}

export const PdfViewerCanvas: React.FC<PdfViewerCanvasProps> = ({
  book,
  settings,
  currentPage,
  onPageChange,
  onToggleOverlay,
}) => {
  const webViewRef = useRef<WebView>(null);

  // Background color based on readerTheme setting
  const getBgColor = () => {
    switch (settings.readerTheme) {
      case 'oled':
        return '#000000';
      case 'dark':
        return '#16131B';
      case 'sepia':
        return '#F4ECD8';
      case 'light':
        return '#FFFFFF';
      default:
        return '#000000';
    }
  };

  // Filter style (grayscale / inverted)
  const getFilterStyle = () => {
    let filters: string[] = [];
    if (settings.grayscale) filters.push('grayscale(100%)');
    if (settings.inverted) filters.push('invert(100%) hue-rotate(180deg)');
    return filters.length > 0 ? filters.join(' ') : 'none';
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: ${getBgColor()};
      color: ${settings.readerTheme === 'light' || settings.readerTheme === 'sepia' ? '#111111' : '#FFFFFF'};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow-x: hidden;
      overflow-y: ${settings.readingMode === 'long_strip' ? 'auto' : 'hidden'};
      padding-left: ${settings.sidePadding}%;
      padding-right: ${settings.sidePadding}%;
    }
    
    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      width: 100%;
    }

    /* Long Strip continuous scroll layout */
    .long-strip {
      display: flex;
      flex-direction: column;
      gap: ${settings.cropBorders ? '0px' : '10px'};
      padding: 10px 0;
      width: 100%;
      align-items: center;
    }

    /* Single Page Slider & Swipe Animation */
    .single-page-viewport {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .single-page-slider {
      display: flex;
      flex-direction: row;
      width: 100%;
      height: 100%;
      transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      will-change: transform;
    }

    .page-wrapper {
      min-width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 12px;
    }

    canvas {
      max-width: 100%;
      max-height: 95vh;
      height: auto;
      object-fit: contain;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      border-radius: 4px;
      filter: ${getFilterStyle()};
      transition: filter 0.2s ease;
    }

    /* Tap zones for gestures */
    .tap-zone-left, .tap-zone-right, .tap-zone-center {
      position: fixed;
      top: 0;
      bottom: 0;
      z-index: 100;
    }
    .tap-zone-left { left: 0; width: 25%; }
    .tap-zone-center { left: 25%; width: 50%; }
    .tap-zone-right { right: 0; width: 25%; }

    .loading-spinner {
      margin-top: 40vh;
      font-size: 16px;
      font-weight: 600;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <div id="app" class="container">
    <div class="loading-spinner" id="loader">Loading PDF Document...</div>
  </div>

  <div class="tap-zone-left" id="zone-left"></div>
  <div class="tap-zone-center" id="zone-center"></div>
  <div class="tap-zone-right" id="zone-right"></div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    let pdfDoc = null;
    let totalPages = 0;
    let currentPage = ${currentPage || 1};
    let readingMode = "${settings.readingMode}";
    let pdfUri = "${book.uri}";
    let touchStartX = 0;
    let touchEndX = 0;

    // Load PDF file
    async function loadPDF() {
      try {
        if (!pdfUri || pdfUri.startsWith('sample://')) {
          renderFallbackPDF();
          return;
        }

        const loadingTask = pdfjsLib.getDocument(pdfUri);
        pdfDoc = await loadingTask.promise;
        totalPages = pdfDoc.numPages;
        
        document.getElementById('loader').style.display = 'none';
        renderView();
        notifyPageChange();
      } catch (err) {
        console.error('PDF JS load error:', err);
        renderFallbackPDF();
      }
    }

    function renderView() {
      const app = document.getElementById('app');
      app.innerHTML = '';

      if (readingMode === 'long_strip') {
        const strip = document.createElement('div');
        strip.className = 'long-strip';
        for (let i = 1; i <= totalPages; i++) {
          const wrapper = document.createElement('div');
          wrapper.id = 'page-wrapper-' + i;
          wrapper.className = 'page-wrapper';
          const canvas = document.createElement('canvas');
          canvas.id = 'page-canvas-' + i;
          wrapper.appendChild(canvas);
          strip.appendChild(wrapper);
          renderPageCanvas(i, canvas);
        }
        app.appendChild(strip);

        setTimeout(() => {
          const target = document.getElementById('page-wrapper-' + currentPage);
          if (target) target.scrollIntoView({ behavior: 'auto' });
        }, 150);
      } else {
        // Single Page mode with smooth horizontal touch swipe transition animation
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
        setupSwipeGestures(viewport);
      }
    }

    async function renderPageCanvas(pageNum, canvas) {
      if (!pdfDoc) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
      } catch (e) {
        console.error('Page render error:', e);
      }
    }

    function updateSliderPosition() {
      const slider = document.getElementById('page-slider');
      if (slider) {
        const offset = (currentPage - 1) * -100;
        slider.style.transform = 'translateX(' + offset + 'vw)';
      }
    }

    function setupSwipeGestures(element) {
      element.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, false);

      element.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, false);
    }

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff < 0) {
          nextPage(); // Swipe Left -> Next Page
        } else {
          prevPage(); // Swipe Right -> Prev Page
        }
      }
    }

    function renderFallbackPDF() {
      const loader = document.getElementById('loader');
      if (loader) loader.style.display = 'none';
      totalPages = ${book.totalPages || 30};
      
      const app = document.getElementById('app');
      app.innerHTML = '';

      if (readingMode === 'long_strip') {
        const strip = document.createElement('div');
        strip.className = 'long-strip';
        for (let i = 1; i <= totalPages; i++) {
          strip.appendChild(createMockCard(i));
        }
        app.appendChild(strip);
      } else {
        const viewport = document.createElement('div');
        viewport.className = 'single-page-viewport';
        const slider = document.createElement('div');
        slider.className = 'single-page-slider';
        slider.id = 'page-slider';
        for (let i = 1; i <= totalPages; i++) {
          const wrapper = document.createElement('div');
          wrapper.className = 'page-wrapper';
          wrapper.appendChild(createMockCard(i));
          slider.appendChild(wrapper);
        }
        viewport.appendChild(slider);
        app.appendChild(viewport);
        updateSliderPosition();
        setupSwipeGestures(viewport);
      }
    }

    function createMockCard(num) {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '${settings.readerTheme === 'light' ? '#FFFFFF' : settings.readerTheme === 'sepia' ? '#F4ECD8' : '#1E1926'}';
      ctx.fillRect(0, 0, 600, 800);
      
      ctx.fillStyle = '#EC407A';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText("${book.title.replace(/"/g, '\\"')}", 40, 60);

      ctx.fillStyle = '${settings.readerTheme === 'light' ? '#222222' : '#EEEEEE'}';
      ctx.font = '18px sans-serif';
      ctx.fillText("PDF Page " + num + " of " + totalPages, 40, 110);
      return canvas;
    }

    document.getElementById('zone-center').onclick = () => {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_OVERLAY' }));
    };
    document.getElementById('zone-right').onclick = () => {
      if (readingMode !== 'long_strip') nextPage();
    };
    document.getElementById('zone-left').onclick = () => {
      if (readingMode !== 'long_strip') prevPage();
    };

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

    // Window message listener from RN
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === 'JUMP_TO_PAGE') {
          currentPage = data.page;
          if (readingMode === 'long_strip') {
            const target = document.getElementById('page-wrapper-' + currentPage);
            if (target) target.scrollIntoView({ behavior: 'auto' });
          } else {
            updateSliderPosition();
          }
          notifyPageChange();
        }
      } catch (e) {}
    });

    loadPDF();
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'TOGGLE_OVERLAY') {
        onToggleOverlay();
      } else if (data.type === 'PAGE_CHANGE') {
        onPageChange(data.page, data.totalPages);
      }
    } catch (e) {
      console.error('WebView postMessage error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
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
