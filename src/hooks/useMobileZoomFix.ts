'use client';

import { useEffect } from 'react';

export const useMobileZoomFix = () => {
  useEffect(() => {
    // Function to prevent zoom on iOS devices
    const preventZoom = (e: Event) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Set font-size to 16px to prevent zoom on iOS
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (window.innerWidth <= 768) { // Only on mobile devices
          target.style.fontSize = '16px';
        }
      }
    };

    // Function to reset viewport zoom after editing
    const resetZoom = () => {
      if (window.innerWidth <= 768) { // Only on mobile devices
        // Small delay to ensure input loses focus first
        setTimeout(() => {
          // Force viewport reset by updating the meta tag
          const viewportTag = document.querySelector('meta[name="viewport"]');
          if (viewportTag) {
            const content = viewportTag.getAttribute('content');
            viewportTag.setAttribute('content', content + ', minimal-ui');
            setTimeout(() => {
              viewportTag.setAttribute('content', content || '');
            }, 100);
          }
          
          // Alternative approach: scroll to trigger layout recalculation
          window.scrollTo({ top: window.scrollY + 1, behavior: 'smooth' });
          setTimeout(() => {
            window.scrollTo({ top: window.scrollY - 1, behavior: 'smooth' });
          }, 100);
        }, 300);
      }
    };

    // Add event listeners for all input and textarea elements
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', preventZoom);
      input.addEventListener('blur', resetZoom);
    });

    // Observer to handle dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            const newInputs = node.querySelectorAll('input, textarea');
            newInputs.forEach(input => {
              input.addEventListener('focus', preventZoom);
              input.addEventListener('blur', resetZoom);
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      inputs.forEach(input => {
        input.removeEventListener('focus', preventZoom);
        input.removeEventListener('blur', resetZoom);
      });
      observer.disconnect();
    };
  }, []);

  // Function to manually reset zoom (can be called from components)
  const resetViewportZoom = () => {
    if (window.innerWidth <= 768) {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        const currentContent = viewport.getAttribute('content');
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
        setTimeout(() => {
          if (currentContent) {
            viewport.setAttribute('content', currentContent);
          }
        }, 100);
      }
    }
  };

  return { resetViewportZoom };
}; 
