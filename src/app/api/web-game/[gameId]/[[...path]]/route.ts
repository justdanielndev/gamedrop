import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, Storage } from 'node-appwrite';

const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
};

function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const contentTypes: Record<string, string> = {
    'html': 'text/html',
    'htm': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'otf': 'font/otf',
    'mp3': 'audio/mpeg',
    'ogg': 'audio/ogg',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'txt': 'text/plain',
    'xml': 'application/xml',
    'pdf': 'application/pdf',
    'zip': 'application/zip',
    'wasm': 'application/wasm'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string; path?: string[] }> }
) {
  try {
    const { gameId, path } = await params;
    const requestedPath = path ? path.join('/') : 'index.html';

    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);

    const databases = new Databases(client);
    const storage = new Storage(client);

    const webBuildsResponse = await databases.listDocuments(
      'drop-db',
      'web-builds'
    );

    const webBuild = webBuildsResponse.documents.find((doc: any) => doc.gameId === gameId);

    if (!webBuild) {
      return NextResponse.json(
        { error: 'Web game not found' },
        { status: 404 }
      );
    }

    const fileMapping = JSON.parse(webBuild.files);

    const fileId = fileMapping[requestedPath];

    if (!fileId) {
      return NextResponse.json(
        { error: `File not found: ${requestedPath}` },
        { status: 404 }
      );
    }

    const fileArrayBuffer = await storage.getFileDownload('web-game-files', fileId);
    const fileBuffer = Buffer.from(fileArrayBuffer);

    const contentType = getContentType(requestedPath);

    if (contentType === 'text/html') {
      let htmlContent = fileBuffer.toString('utf-8');
      const baseTag = `<base href="/api/web-game/${gameId}/">`;
      
      if (htmlContent.includes('<head>')) {
        htmlContent = htmlContent.replace('<head>', `<head>\n\t${baseTag}`);
      } else if (htmlContent.includes('<HEAD>')) {
        htmlContent = htmlContent.replace('<HEAD>', `<HEAD>\n\t${baseTag}`);
      } else {
        htmlContent = `<!DOCTYPE html>\n<html>\n<head>\n\t${baseTag}\n</head>\n<body>\n${htmlContent}\n</body>\n</html>`;
      }
      
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error serving web game file:', error);
    return NextResponse.json(
      { error: 'Failed to load file' },
      { status: 500 }
    );
  }
}
