import { serve } from 'https://deno.fresh.dev/std@v9.6.2/http/server.ts';
import { S3Client, PutObjectCommand } from 'https://esm.sh/@aws-sdk/client-s3';

const CLOUDFLARE_ACCOUNT_ID = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
const CLOUDFLARE_ACCESS_KEY = Deno.env.get('CLOUDFLARE_ACCESS_KEY');
const CLOUDFLARE_SECRET_KEY = Deno.env.get('CLOUDFLARE_SECRET_KEY');
const CLOUDFLARE_BUCKET_NAME = Deno.env.get('CLOUDFLARE_BUCKET_NAME');

const S3 = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: CLOUDFLARE_SECRET_KEY,
  },
});

serve(async (req) => {
  try {
    // Verificar el método
    if (req.method !== 'POST') {
      return new Response('Método no permitido', { status: 405 });
    }

    // Obtener el archivo y los metadatos
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'documents';

    if (!file) {
      return new Response('No se proporcionó ningún archivo', { status: 400 });
    }

    // Generar nombre único
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const fileName = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Subir a R2
    const command = new PutObjectCommand({
      Bucket: CLOUDFLARE_BUCKET_NAME,
      Key: fileName,
      ContentType: file.type,
      Body: await file.arrayBuffer(),
    });

    await S3.send(command);

    // Construir URL pública
    const publicUrl = `https://${CLOUDFLARE_BUCKET_NAME}.r2.cloudflarestorage.com/${fileName}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al subir el archivo',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});