import { Client, Databases, Account, Functions, ExecutionMethod, Storage } from 'appwrite';

let client: Client | null = null;
let databases: Databases | null = null;
let account: Account | null = null;
let functions: Functions | null = null;
let storage: Storage | null = null;

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  collectionId: string;
}

export function initAppwrite(config: AppwriteConfig) {
  if (!config.endpoint || !config.projectId) {
    client = null;
    databases = null;
    account = null;
    functions = null;
    storage = null;
    return;
  }

  client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId);

  databases = new Databases(client);
  account = new Account(client);
  functions = new Functions(client);
  storage = new Storage(client);
}

export function getAppwriteClient() {
  return { client, databases, account, functions, storage };
}

export function isAppwriteConfigured(): boolean {
  return client !== null && databases !== null && account !== null && functions !== null && storage !== null;
}

export async function loginWithOIDC(successUrl?: string, failureUrl?: string) {
  if (!account) throw new Error('Appwrite not configured');
  
  const successRedirect = successUrl || `${window.location.origin}/`;
  const failureRedirect = failureUrl || `${window.location.origin}/`;
  
  const providerName = process.env.NEXT_PUBLIC_OIDC_PROVIDER_NAME || 'oidc';
  
  account.createOAuth2Session(
    providerName as never,
    successRedirect,
    failureRedirect
  );
}

export async function getCurrentUser() {
  if (!account) return null;
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
}

export async function getUserIdentities() {
  if (!account) return null;
  try {
    const identities = await account.listIdentities();
    return identities;
  } catch (error) {
    console.error('Failed to fetch identities:', error);
    return null;
  }
}

export async function logout() {
  if (!account) throw new Error('Appwrite not configured');
  await account.deleteSession('current');
}

export async function executeFunction(functionId: string, body: unknown) {
  if (!functions) throw new Error('Appwrite not configured');
  try {
    const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
    
    const execution = await functions.createExecution(
      functionId,
      bodyString,
      false,
      '/',
      ExecutionMethod.POST
    );
    return execution;
  } catch (error) {
    console.error('Function execution error:', error);
    throw error;
  }
}
