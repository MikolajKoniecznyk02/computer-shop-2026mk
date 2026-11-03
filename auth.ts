import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { createAuthOptions } from './lib/auth-options';

export const auth = betterAuth(createAuthOptions());