const { Client, Databases, Storage, ID, Permission, Role } = require('node-appwrite');
const { InputFile } = require('node-appwrite/file');
const { writeFileSync, unlinkSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const storage = new Storage(client);

  try {
    const { gameId, userId, action, fileData, fileName, fileType, mediaType, url, mediaId } = JSON.parse(req.body);

    if (!gameId || !userId || !action) {
      return res.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const game = await databases.getDocument('drop-db', 'games', gameId);
    
    if (game.owner !== userId) {
      return res.json({ success: false, error: 'Unauthorized: You do not own this game' }, 403);
    }

    switch (action) {
      case 'upload': {
        if (!fileData || !fileName) {
          return res.json({ success: false, error: 'Missing file data or name' }, 400);
        }

        const buffer = Buffer.from(fileData, 'base64');
        
        const tempFilePath = join(tmpdir(), `upload-${Date.now()}-${fileName}`);
        writeFileSync(tempFilePath, buffer);
        
        let file;
        try {
          const inputFile = InputFile.fromPath(tempFilePath, fileName);
          
          file = await storage.createFile(
            'game-media',
            ID.unique(),
            inputFile,
            [Permission.read(Role.any())]
          );
        } finally {
          try {
            unlinkSync(tempFilePath);
          } catch (e) {
          }
        }

        const fileUrl = `${process.env.APPWRITE_FUNCTION_API_ENDPOINT}/storage/buckets/game-media/files/${file.$id}/view?project=${process.env.APPWRITE_FUNCTION_PROJECT_ID}`;

        const updateData = {};
        
        if (mediaType === 'header') {
          updateData.header = fileUrl;
        } else if (mediaType === 'capsule') {
          updateData.capsule = fileUrl;
        } else if (mediaType === 'hero') {
          updateData.hero = fileUrl;
        } else if (mediaType === 'screenshot') {
          const currentScreenshots = game.screenshots || [];
          updateData.screenshots = [...currentScreenshots, fileUrl];
        }

        if (Object.keys(updateData).length > 0) {
          await databases.updateDocument('drop-db', 'games', gameId, updateData);
        }

        return res.json({ 
          success: true, 
          fileUrl,
          fileId: file.$id,
          mediaType
        });
      }

      case 'addUrl': {
        if (!url || !mediaType) {
          return res.json({ success: false, error: 'Missing URL or media type' }, 400);
        }

        const updateData = {};
        
        if (mediaType === 'header') {
          updateData.header = url;
        } else if (mediaType === 'capsule') {
          updateData.capsule = url;
        } else if (mediaType === 'hero') {
          updateData.hero = url;
        } else if (mediaType === 'screenshot') {
          const currentScreenshots = game.screenshots || [];
          updateData.screenshots = [...currentScreenshots, url];
        }

        await databases.updateDocument('drop-db', 'games', gameId, updateData);

        return res.json({ 
          success: true, 
          url,
          mediaType
        });
      }

      case 'remove': {
        if (!mediaType) {
          return res.json({ success: false, error: 'Missing media type' }, 400);
        }

        const updateData = {};
        
        if (mediaType === 'screenshot' && mediaId !== undefined) {
          const currentScreenshots = game.screenshots || [];
          updateData.screenshots = currentScreenshots.filter((_, index) => index !== mediaId);
        }

        await databases.updateDocument('drop-db', 'games', gameId, updateData);

        return res.json({ 
          success: true,
          mediaType,
          removedIndex: mediaId
        });
      }

      default:
        return res.json({ success: false, error: 'Invalid action' }, 400);
    }

  } catch (err) {
    error('Function error: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
