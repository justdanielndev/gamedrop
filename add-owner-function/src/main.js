import { Client, Databases, Permission, Role } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID || 'drop-db';

  try {
    const { inviteId, userId } = JSON.parse(req.body || '{}');
    
    if (!inviteId || !userId) {
      return res.json({ 
        success: false, 
        error: 'Missing required parameters: inviteId, userId' 
      }, 400);
    }

    const invite = await databases.getDocument(
      databaseId,
      'invites',
      inviteId
    );

    if (invite.redeemed) {
      return res.json({
        success: false,
        error: 'This invite has already been redeemed'
      }, 400);
    }

    if (invite.userId !== userId) {
      return res.json({
        success: false,
        error: 'This invite is not for you'
      }, 403);
    }

    const game = await databases.getDocument(
      databaseId,
      'games',
      invite.gameId.toString()
    );

    await databases.updateDocument(
      databaseId,
      'games',
      invite.gameId.toString(),
      {
        owner: userId
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId))
      ]
    );

    await databases.updateDocument(
      databaseId,
      'invites',
      inviteId,
      {
        redeemed: true
      }
    );

    return res.json({
      success: true,
      message: 'Successfully redeemed invite and became game owner',
      gameId: invite.gameId,
      gameName: game.title
    });

  } catch (err) {
    error(`Error processing invite: ${err.message}`);
    return res.json({ 
      success: false, 
      error: err.message 
    }, 500);
  }
};
