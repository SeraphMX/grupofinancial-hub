import { serve } from 'https://deno.land/std@0.210.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Manejar preflight requests (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Obtener archivo del FormData
    const formData = await req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'documents';

    if (!file || !(file instanceof File)) {
      throw new Error('No file provided');
    }

    // Generar un nombre único para el archivo
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const key = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Convertir el archivo a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Variables de entorno
    const R2_BUCKET_NAME = Deno.env.get('CLOUDFLARE_BUCKET_NAME')!;
    const R2_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID')!;
    const R2_ACCESS_KEY_ID = Deno.env.get('CLOUDFLARE_ACCESS_KEY')!;
    const R2_SECRET_ACCESS_KEY = Deno.env.get('CLOUDFLARE_SECRET_KEY')!;

    // Construir la URL del bucket
    const r2Url = `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;

    // Subir archivo usando `fetch()`
    const uploadResponse = await fetch(r2Url, {
      method: 'PUT',
      headers: {
        'Authorization': `AWS ${R2_ACCESS_KEY_ID}:${R2_SECRET_ACCESS_KEY}`,
        'Content-Type': file.type,
      },
      body: arrayBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${await uploadResponse.text()}`);
    }

    // Construir la URL pública
    const fileUrl = `https://${R2_BUCKET_NAME}.r2.cloudflarestorage.com/${key}`;

    return new Response(
      JSON.stringify({ success: true, url: fileUrl }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
