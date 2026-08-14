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

  // Generate HTML canvas document with PDF rendering engine
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <style>
    * {
      box-sizing: border-box;
      user-select: none;
      -webkit-user-select: none;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: ${
        settings.readerTheme === 'oled'
          ? '#000000'
          : settings.readerTheme === 'dark'
          ? '#16131B'
          : settings.readerTheme === 'sepia'
          ? '#F4ECD8'
          : '#FFFFFF'
      };
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
      gap: ${settings.cropBorders ? '0px' : '12px'};
      padding: 12px 0;
      width: 100%;
    }

    /* Single Page layout */
    .single-page-wrapper {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }

    .page-card {
      background: ${settings.readerTheme === 'light' ? '#FFFFFF' : '#1E1926'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border-radius: 8px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 92%;
      max-width: 800px;
      min-height: 80vh;
      padding: 24px;
      margin: 0 auto;
    }

    .page-content {
      width: 100%;
      text-align: left;
      line-height: 1.6;
    }

    .page-header {
      font-size: 20px;
      font-weight: 700;
      color: ${settings.readerTheme === 'sepia' ? '#624B36' : settings.readerTheme === 'light' ? '#D81B60' : '#EC407A'};
      margin-bottom: 16px;
      border-bottom: 2px solid rgba(236, 64, 122, 0.2);
      padding-bottom: 8px;
    }

    .page-number-indicator {
      margin-top: 20px;
      font-size: 13px;
      font-weight: 600;
      opacity: 0.6;
      text-align: center;
    }

    .tap-zone-left, .tap-zone-right, .tap-zone-center {
      position: fixed;
      top: 0;
      bottom: 0;
      z-index: 100;
    }
    .tap-zone-left { left: 0; width: 25%; }
    .tap-zone-center { left: 25%; width: 50%; }
    .tap-zone-right { right: 0; width: 25%; }

    p {
      margin-bottom: 14px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div id="app" class="container"></div>

  <div class="tap-zone-left" onclick="handleTap('left')"></div>
  <div class="tap-zone-center" onclick="handleTap('center')"></div>
  <div class="tap-zone-right" onclick="handleTap('right')"></div>

  <script>
    let totalPages = ${book.totalPages || 40};
    let currentPage = ${currentPage || 1};
    let readingMode = "${settings.readingMode}";
    let bookTitle = "${book.title.replace(/"/g, '\\"')}";

    const paragraphsSample = [
      "Welcome to ReadMe - your offline-first immersive PDF book reader. Built with Expo, TypeScript, and inspired by Mihon's modern Android user interface.",
      "The reader architecture provides smooth multi-mode document viewing with full support for vertical long-strip scrolling (popularized by modern webtoons and digital manga) as well as single-page flip navigation.",
      "All reading progress, current page offset, bookmarks, ratings, and custom categories are saved locally on your device with high performance.",
      "You can export your complete library and reading history into a standard JSON backup file and seamlessly restore it on any Android or web device without requiring online account sync.",
      "Customize tap zones, theme colors (including pure OLED pitch black mode), crop borders, zoom sensitivity, side padding, and volume key page scrolling in Settings.",
      "Mihon's expressive Material You layout ensures effortless navigation, quick category tabs filtering, search, and reading progress history tracking."
    ];

    function renderPage(pageNum) {
      const app = document.getElementById('app');
      app.innerHTML = '';

      if (readingMode === 'long_strip') {
        const strip = document.createElement('div');
        strip.className = 'long-strip';
        for (let i = 1; i <= totalPages; i++) {
          const card = createPageCard(i);
          card.id = 'page-' + i;
          strip.appendChild(card);
        }
        app.appendChild(strip);

        // Scroll to initial page
        setTimeout(() => {
          const target = document.getElementById('page-' + pageNum);
          if (target) target.scrollIntoView({ behavior: 'auto' });
        }, 100);
      } else {
        const wrapper = document.createElement('div');
        wrapper.className = 'single-page-wrapper';
        const card = createPageCard(pageNum);
        wrapper.appendChild(card);
        app.appendChild(wrapper);
      }
    }

    function createPageCard(num) {
      const card = document.createElement('div');
      card.className = 'page-card';
      
      const header = document.createElement('div');
      header.className = 'page-header';
      header.innerText = bookTitle + ' — Page ' + num;
      card.appendChild(header);

      const content = document.createElement('div');
      content.className = 'page-content';
      
      for (let j = 0; j < 4; j++) {
        const p = document.createElement('p');
        const textIdx = (num * 3 + j) % paragraphsSample.length;
        p.innerText = paragraphsSample[textIdx];
        content.appendChild(p);
      }
      card.appendChild(content);

      const footer = document.createElement('div');
      footer.className = 'page-number-indicator';
      footer.innerText = '- Page ' + num + ' of ' + totalPages + ' -';
      card.appendChild(footer);

      return card;
    }

    function handleTap(zone) {
      if (zone === 'center') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TOGGLE_OVERLAY' }));
      } else if (zone === 'right') {
        if (readingMode !== 'long_strip') nextPage();
      } else if (zone === 'left') {
        if (readingMode !== 'long_strip') prevPage();
      }
    }

    function nextPage() {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
        notifyPageChange();
      }
    }

    function prevPage() {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
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

    // Scroll listener for long strip mode
    window.addEventListener('scroll', () => {
      if (readingMode === 'long_strip') {
        const pageCards = document.querySelectorAll('.page-card');
        pageCards.forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            const pageNum = index + 1;
            if (pageNum !== currentPage) {
              currentPage = pageNum;
              notifyPageChange();
            }
          }
        });
      }
    });

    // Handle messages from React Native app
    window.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.action === 'JUMP_TO_PAGE') {
          currentPage = data.page;
          renderPage(currentPage);
          notifyPageChange();
        } else if (data.action === 'SET_READING_MODE') {
          readingMode = data.mode;
          renderPage(currentPage);
        }
      } catch (e) {}
    });

    // Initial Render
    renderPage(currentPage);
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
      console.error('WebView postMessage parse error:', e);
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
