import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases } from 'node-appwrite';

const appwriteConfig = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || '',
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;

    const client = new Client()
      .setEndpoint(appwriteConfig.endpoint)
      .setProject(appwriteConfig.projectId);

    const databases = new Databases(client);

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

    return NextResponse.json({
      viewportWidth: webBuild.viewportWidth || 1920,
      viewportHeight: webBuild.viewportHeight || 1080,
    });

  } catch (error) {
    console.error('Error fetching metadata:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}
