const { Client, Databases, Storage, ID, Permission, Role, Query } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
const fs = require('fs');
const path = require('path');

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const storage = new Storage(client);

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { gameId, userId, fileData, fileName, fileId } = body;

    if (!gameId || !userId || !fileData || !fileName || !fileId) {
      error('Missing required fields');
      return res.json({
        success: false,
        error: 'Missing required fields: gameId, userId, fileData, fileName, fileId'
      }, 400);
    }

    try {
      const game = await databases.getDocument('drop-db', 'games', gameId);
      
      if (game.owner !== userId) {
        error('User does not own this game', { gameId, userId, owner: game.owner });
        return res.json({
          success: false,
          error: 'Unauthorized: You do not own this game'
        }, 403);
      }
    } catch (err) {
      error('Error fetching game', err);
      return res.json({
        success: false,
        error: 'Game not found'
      }, 404);
    }

    const buffer = Buffer.from(fileData, 'base64');
    
    const tmpDir = '/tmp';
    const tmpFilePath = path.join(tmpDir, fileName);
    
    fs.writeFileSync(tmpFilePath, buffer);
    
    const inputFile = InputFile.fromPath(tmpFilePath, fileName);
    
    const uploadedFile = await storage.createFile(
      'game-builds',
      fileId,
      inputFile,
      [
        Permission.read(Role.any())
      ]
    );

    try {
      fs.unlinkSync(tmpFilePath);
    } catch (cleanupErr) {
      error('Error cleaning up temp file', cleanupErr);
    }

    const fileUrl = `${process.env.APPWRITE_FUNCTION_API_ENDPOINT || 'https://cloud.appwrite.io/v1'}/storage/buckets/game-builds/files/${uploadedFile.$id}/view?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;

    return res.json({
      success: true,
      fileId: uploadedFile.$id,
      fileUrl: fileUrl,
      message: 'Build uploaded successfully'
    });

  } catch (err) {
    error('Unexpected error during build upload', err);
    return res.json({
      success: false,
      error: err.message || 'Failed to upload build'
    }, 500);
  }
};
