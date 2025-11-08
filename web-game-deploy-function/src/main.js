const { Client, Databases, Storage, ID, Permission, Role } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
const AdmZip = require('adm-zip');

module.exports = async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const storage = new Storage(client);

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { gameId, version, zipFileId, userId, viewportWidth, viewportHeight } = body;

    if (!gameId || !version || !zipFileId || !userId) {
      return res.json({
        success: false,
        error: 'Missing required fields: gameId, version, zipFileId, userId'
      }, 400);
    }

    const width = viewportWidth || 1920;
    const height = viewportHeight || 1080;

    const zipBuffer = await storage.getFileDownload(
      'game-builds',
      zipFileId
    );

    const zip = new AdmZip(Buffer.from(zipBuffer));
    const zipEntries = zip.getEntries();

    const fileMapping = {};
    let uploadedCount = 0;

    for (const entry of zipEntries) {
      if (entry.isDirectory) {
        continue;
      }

      const filePath = entry.entryName;
      const fileData = entry.getData();

      try {
        const fileId = ID.unique();
        
        const inputFile = InputFile.fromBuffer(
          fileData,
          filePath.split('/').pop()
        );
        
        const uploadedFile = await storage.createFile(
          'web-game-files',
          fileId,
          inputFile,
          [
            Permission.read(Role.any()),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId))
          ]
        );

        fileMapping[filePath] = uploadedFile.$id;
        uploadedCount++;
        
      } catch (err) {
        error(`Failed to upload ${filePath}: ${err.message}`);
      }
    }

    const webBuild = await databases.createDocument(
      'drop-db',
      'web-builds',
      ID.unique(),
      {
        gameId,
        version,
        files: JSON.stringify(fileMapping),
        viewportWidth: width,
        viewportHeight: height
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );

    return res.json({
      success: true,
      webBuildId: webBuild.$id,
      filesUploaded: uploadedCount,
      entryPoint: fileMapping['index.html'] || fileMapping['index.htm'] || null
    });

  } catch (err) {
    error(`Deployment failed: ${err.message}`);
    return res.json({
      success: false,
      error: err.message
    }, 500);
  }
};

function getContentType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const contentTypes = {
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
