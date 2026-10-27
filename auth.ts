import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL || "";
const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString })
});

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "dummy_id",
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "dummy_secret",
        }
    }
});