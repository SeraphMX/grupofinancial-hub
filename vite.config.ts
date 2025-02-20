import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Removemos el plugin PWA ya que no es compatible con WebContainer
export default defineConfig({
  plugins: [react()]
});