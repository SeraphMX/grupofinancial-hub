import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';


// Removemos el plugin PWA ya que no es compatible con WebContainer
export default defineConfig({
  plugins: [react(), svgr()],
});