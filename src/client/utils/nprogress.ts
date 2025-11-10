// src/client/utils/nprogress.ts
let NProgress: any = null;
let isInitialized = false;

const initNProgress = async () => {
  if (isInitialized || typeof window === 'undefined') return;

  try {
    // Use a more explicit dynamic import that Vite can handle
    const module = await import(/* @vite-ignore */ 'nprogress');
    NProgress = module.default;
    NProgress.configure({
      showSpinner: false,
      trickleSpeed: 200,
      minimum: 0.1,
    });

    // Import CSS
    await import(/* @vite-ignore */ 'nprogress/nprogress.css');

    isInitialized = true;
  } catch (error) {
    console.error('Failed to load nprogress:', error);
  }
};

// Initialize on module load (client-side only)
if (typeof window !== 'undefined') {
  initNProgress();
}

export const nprogress = {
  start: () => {
    if (NProgress) NProgress.start();
  },
  done: () => {
    if (NProgress) NProgress.done();
  },
  set: (value: number) => {
    if (NProgress) NProgress.set(value);
  },
};
