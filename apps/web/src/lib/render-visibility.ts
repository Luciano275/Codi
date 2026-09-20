export function observeRenderVisibility(
  element: Element,
  onVisibilityChange: (visible: boolean) => void,
) {
  let pageVisible = document.visibilityState === 'visible';
  let elementVisible = true;
  const notify = () => onVisibilityChange(pageVisible && elementVisible);

  const intersectionObserver = new IntersectionObserver(
    ([entry]) => {
      elementVisible = entry?.isIntersecting ?? true;
      notify();
    },
    { rootMargin: '120px' },
  );
  const handlePageVisibility = () => {
    pageVisible = document.visibilityState === 'visible';
    notify();
  };

  intersectionObserver.observe(element);
  document.addEventListener('visibilitychange', handlePageVisibility);
  notify();

  return () => {
    intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', handlePageVisibility);
  };
}
