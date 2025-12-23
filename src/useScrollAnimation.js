import { useEffect } from "react";

export default function useScrollAnimation(selector = ".scroll-animate", options = {}) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    const observer = new window.IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.3) {
            entry.target.classList.add("in-view");
          } else {
            entry.target.classList.remove("in-view");
          }
        });
      },
      {
        threshold: 0.3,
        ...options,
      }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [selector, options]);
}
