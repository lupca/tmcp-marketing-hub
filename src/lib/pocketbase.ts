import PocketBase from 'pocketbase';
import { TypedPocketBase } from '../models/schema';

// Use the environment variable for the PocketBase URL
const PB_URL = import.meta.env.VITE_POCKETBASE_URL || '/pb';

// Create a singleton instance of the PocketBase client with typed collections
export const pb = new PocketBase(PB_URL) as TypedPocketBase;

// Disable auto-cancellation to prevent issues with strict mode double-invocations
pb.autoCancellation(false);

export default pb;
