// First, create a new Expo app with:
// npx create-expo-app@latest youtube-ad-blocker
// cd youtube-ad-blocker

// Install required dependencies:
// npx expo install expo-web-browser expo-linking react-native-webview

// App.js
import * as Linking from "expo-linking";
import React, { useRef, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function App() {
  const [currentUrl, setCurrentUrl] = useState("https://www.youtube.com");
  const [isLoading, setIsLoading] = useState(false);
  const webViewRef = useRef(null);

  // Basic ad blocking script to inject into the WebView
  const adBlockingScript = `
    (function() {
      // Hide common ad elements
      const adSelectors = [
        '.ad-container',
        '.video-ads',
        '.ytp-ad-module',
        '#player-ads',
        '.masthead-ad-control',
        '.ytd-display-ad-renderer',
        '.ytd-promoted-sparkles-web-renderer',
        '.ytd-ad-slot-renderer',
        'ytd-banner-promo-renderer',
        'ytd-popup-container',
        '.ytp-ad-overlay-container',
        '.ytp-ad-text-overlay',
        '[id^="google_ads"]',
        '.googima-ad-div'
      ];

      function removeAds() {
        adSelectors.forEach(selector => {
          const ads = document.querySelectorAll(selector);
          ads.forEach(ad => {
            if (ad) {
              ad.style.display = 'none';
              ad.remove();
            }
          });
        });

        // Skip video ads automatically
        const skipButton = document.querySelector('.ytp-ad-skip-button, .ytp-skip-ad-button');
        if (skipButton && skipButton.offsetParent !== null) {
          skipButton.click();
        }

        // Hide ad overlay
        const adOverlay = document.querySelector('.ytp-ad-overlay-container');
        if (adOverlay) {
          adOverlay.style.display = 'none';
        }
      }

      // Run ad removal on page load and periodically
      removeAds();
      setInterval(removeAds, 1000);

      // Observer to watch for new elements being added to the DOM
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes.length) {
            removeAds();
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Block ad requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string') {
          // Block common ad domains
          const adDomains = [
            'googleads',
            'googlesyndication',
            'doubleclick',
            'adsystem',
            'ads.youtube',
            'googletagmanager'
          ];
          
          if (adDomains.some(domain => url.includes(domain))) {
            console.log('Blocked ad request:', url);
            return Promise.reject(new Error('Ad blocked'));
          }
        }
        return originalFetch.apply(this, args);
      };

      console.log('Ad blocker initialized');
    })();
    true; // Prevents the webview from showing an error
  `;

  const handleNavigationStateChange = (navState) => {
    setCurrentUrl(navState.url);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleGoBack = () => {
    webViewRef.current?.goBack();
  };

  const handleGoForward = () => {
    webViewRef.current?.goForward();
  };

  const handleRefresh = () => {
    webViewRef.current?.reload();
  };

  const openInExternalBrowser = () => {
    Linking.openURL(currentUrl);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>YouTube Ad Blocker</Text>
      </View>

      {/* Navigation Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={handleGoBack}>
          <Text style={styles.controlButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleGoForward}
        >
          <Text style={styles.controlButtonText}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleRefresh}>
          <Text style={styles.controlButtonText}>⟳</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={openInExternalBrowser}
        >
          <Text style={styles.controlButtonText}>🌐</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        injectedJavaScript={adBlockingScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(error) => {
          Alert.alert("Error", "Failed to load the page");
          console.log("WebView error:", error);
        }}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#ff0000",
    padding: 15,
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  controls: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 5,
    justifyContent: "space-around",
  },
  controlButton: {
    padding: 10,
    minWidth: 40,
    alignItems: "center",
  },
  controlButtonText: {
    fontSize: 18,
    color: "#333",
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -25 }, { translateY: -10 }],
    zIndex: 1000,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  loadingText: {
    color: "#fff",
    textAlign: "center",
  },
  webview: {
    flex: 1,
  },
});
