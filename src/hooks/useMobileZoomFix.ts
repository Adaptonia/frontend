'use client';

import { useEffect } from 'react';

export const useMobileZoomFix = () => {
  useEffect(() => {
    // This is the standard and safest way to prevent iOS from zooming on input focus.
    const preventZoom = (e: Event) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (window.innerWidth <= 768) { 
          const target = e.target as HTMLInputElement | HTMLTextAreaElement;
          // Setting font-size to 16px is the key to preventing zoom on iOS.
          if (target.style.fontSize !== '16px') {
            target.style.fontSize = '16px';
          }
        }
      }
    };

    // The resetZoom logic that manipulated the viewport meta tag was too aggressive
    // and is a likely cause of touch event issues on iOS. It has been removed.
    // A simple CSS-based approach is much safer.

    // Add event listeners for all input and textarea elements
    const inputs = document.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', preventZoom);
    });

    // Observer to handle dynamically added inputs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            const newInputs = node.querySelectorAll('input, textarea');
            newInputs.forEach(input => {
              input.addEventListener('focus', preventZoom);
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
      });
      observer.disconnect();
    };
  }, []);

  // No need to return anything as the hook is now fully self-contained.
  return {};
}; 
