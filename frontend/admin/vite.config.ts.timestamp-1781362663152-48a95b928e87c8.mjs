// vite.config.ts
import { defineConfig } from "file:///C:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/admin/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/admin/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///C:/Users/user/Desktop/jaheeez/Jaheez-v1/frontend/admin/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "C:\\Users\\user\\Desktop\\jaheeez\\Jaheez-v1\\frontend\\admin";
var vite_config_default = defineConfig({
  // Trigger server reload to pick up new .env variables
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFx1c2VyXFxcXERlc2t0b3BcXFxcamFoZWVlelxcXFxKYWhlZXotdjFcXFxcZnJvbnRlbmRcXFxcYWRtaW5cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHVzZXJcXFxcRGVza3RvcFxcXFxqYWhlZWV6XFxcXEphaGVlei12MVxcXFxmcm9udGVuZFxcXFxhZG1pblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvdXNlci9EZXNrdG9wL2phaGVlZXovSmFoZWV6LXYxL2Zyb250ZW5kL2FkbWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCB0YWlsd2luZGNzcyBmcm9tICdAdGFpbHdpbmRjc3Mvdml0ZSc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAvLyBUcmlnZ2VyIHNlcnZlciByZWxvYWQgdG8gcGljayB1cCBuZXcgLmVudiB2YXJpYWJsZXNcclxuXHJcbiAgcGx1Z2luczogW3JlYWN0KCksIHRhaWx3aW5kY3NzKCldLFxyXG4gIGJhc2U6ICcvYWRtaW4vJyxcclxuICByZXNvbHZlOiB7XHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcclxuICAgIH0sXHJcbiAgfSxcclxuICAvLyBsdWNpZGUtcmVhY3QgMC40NjArIHNoaXBzIGVhY2ggaWNvbiBhcyBhIHNlcGFyYXRlIEVTTSBmaWxlICguL2ljb25zLyouanMpLlxyXG4gIC8vIFZpdGUncyBwcmUtYnVuZGxlciAoZXNidWlsZCkgY2Fubm90IHJlc29sdmUgdGhvc2UgZnJvbSB0aGUgYmFycmVsIGVudHJ5LlxyXG4gIC8vIEV4Y2x1ZGluZyBpdCBsZXRzIFZpdGUgc2VydmUgbHVjaWRlLXJlYWN0J3MgbmF0aXZlIEVTTSBkaXJlY3RseSBcdTIwMTQgdGhlXHJcbiAgLy8gaW50ZW5kZWQgY29uc3VtcHRpb24gbW9kZWwgZm9yIHRoaXMgdmVyc2lvbiBvZiB0aGUgcGFja2FnZS5cclxuICBvcHRpbWl6ZURlcHM6IHtcclxuICAgIGV4Y2x1ZGU6IFsnbHVjaWRlLXJlYWN0J10sXHJcbiAgfSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHBvcnQ6IDMwMDAsXHJcbiAgICBob3N0OiB0cnVlLFxyXG4gICAgYWxsb3dlZEhvc3RzOiAnYWxsJyxcclxuICAgIGhtcjoge1xyXG4gICAgICBwYXRoOiAnL19fYWRtaW5faG1yJyxcclxuICAgIH0sXHJcbiAgICBwcm94eToge1xyXG4gICAgICAnL2FkbWluLWFwaSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDInLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBb1csU0FBUyxvQkFBb0I7QUFDalksT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUhqQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQTtBQUFBLEVBRzFCLFNBQVMsQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDO0FBQUEsRUFDaEMsTUFBTTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLElBQ3BDO0FBQUEsRUFDRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixjQUFjO0FBQUEsSUFDZCxLQUFLO0FBQUEsTUFDSCxNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsY0FBYztBQUFBLFFBQ1osUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
