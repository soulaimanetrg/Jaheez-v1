import { create } from 'zustand';

interface TransitionParams {
  route: string;
  originX: number;
  originY: number;
  serviceName: string;
}

interface TransitionStore {
  isTransitioning: boolean;
  originX: number;
  originY: number;
  route: string | null;
  serviceName: string | null;
  startTransition: (params: TransitionParams) => void;
  finishTransition: () => void;
}

/**
 * Zustand store to coordinate the full-screen transition overlay.
 * Tapping a category card registers the click coordinates and target route,
 * triggering the animated transition.
 */
export const useJaheezTransition = create<TransitionStore>((set) => ({
  isTransitioning: false,
  originX: 0,
  originY: 0,
  route: null,
  serviceName: null,
  startTransition: ({ route, originX, originY, serviceName }) => {
    set({
      isTransitioning: true,
      originX,
      originY,
      route,
      serviceName,
    });
  },
  finishTransition: () => {
    set({
      isTransitioning: false,
      route: null,
      serviceName: null,
    });
  },
}));
