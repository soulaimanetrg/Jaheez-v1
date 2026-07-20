// vite.config.ts
import { defineConfig } from "file:///C:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/admin/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/admin/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/admin/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\user\\Desktop\\jaheeez\\Jaheez-v1\\frontend\\admin";
var vite_config_default = defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/admin/",
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
    }
  },
  // lucide-react 0.460+ ships each icon as a separate ESM file (./icons/*.js).
  // Vite's pre-bundler (esbuild) cannot resolve those from the barrel entry.
  // Excluding it lets Vite serve lucide-react's native ESM directly — the
  // intended consumption model for this version of the package.
  optimizeDeps: {
    exclude: ["lucide-react"]
  },
  server: {
    port: 3e3,
    host: true,
    allowedHosts: "all",
    hmr: {
      path: "/__admin_hmr"
    },
    proxy: {
      "/admin-api": {
        target: "http://localhost:3002",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx1c2VyXFxcXERlc2t0b3BcXFxcamFoZWVlelxcXFxKYWhlZXotdjFcXFxcZnJvbnRlbmRcXFxcYWRtaW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHVzZXJcXFxcRGVza3RvcFxcXFxqYWhlZWV6XFxcXEphaGVlei12MVxcXFxmcm9udGVuZFxcXFxhZG1pblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdXNlci9EZXNrdG9wL2phaGVlZXovSmFoZWV6LXYxL2Zyb250ZW5kL2FkbWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgdGFpbHdpbmRjc3MoKV0sXHJcbiAgYmFzZTogJy9hZG1pbi8nLFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGFsaWFzOiB7XHJcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3NyYycpLFxyXG4gICAgfSxcclxuICB9LFxyXG4gIC8vIGx1Y2lkZS1yZWFjdCAwLjQ2MCsgc2hpcHMgZWFjaCBpY29uIGFzIGEgc2VwYXJhdGUgRVNNIGZpbGUgKC4vaWNvbnMvKi5qcykuXHJcbiAgLy8gVml0ZSdzIHByZS1idW5kbGVyIChlc2J1aWxkKSBjYW5ub3QgcmVzb2x2ZSB0aG9zZSBmcm9tIHRoZSBiYXJyZWwgZW50cnkuXHJcbiAgLy8gRXhjbHVkaW5nIGl0IGxldHMgVml0ZSBzZXJ2ZSBsdWNpZGUtcmVhY3QncyBuYXRpdmUgRVNNIGRpcmVjdGx5IFx1MjAxNCB0aGVcclxuICAvLyBpbnRlbmRlZCBjb25zdW1wdGlvbiBtb2RlbCBmb3IgdGhpcyB2ZXJzaW9uIG9mIHRoZSBwYWNrYWdlLlxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgZXhjbHVkZTogWydsdWNpZGUtcmVhY3QnXSxcclxuICB9LFxyXG4gIHNlcnZlcjoge1xyXG4gICAgcG9ydDogMzAwMCxcclxuICAgIGhvc3Q6IHRydWUsXHJcbiAgICBhbGxvd2VkSG9zdHM6ICdhbGwnLFxyXG4gICAgaG1yOiB7XHJcbiAgICAgIHBhdGg6ICcvX19hZG1pbl9obXInLFxyXG4gICAgfSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYWRtaW4tYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMicsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvVyxTQUFTLG9CQUFvQjtBQUNqWSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsTUFBTTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLElBQ3BDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxLQUFLO0FBQUEsTUFDSCxNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsY0FBYztBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
