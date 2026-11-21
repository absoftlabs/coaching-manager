// Creates (or resets) the first admin account from the DEMO_ADMIN_* env vars.
// Usage: npm run seed:admin
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function main() {
    const email = (process.env.DEMO_ADMIN_EMAIL || "").trim().toLowerCase();
    const username = (process.env.DEMO_ADMIN_USERNAME || email).trim();
    const password = process.env.DEMO_ADMIN_PASSWORD || "";

    if (!email || !password) {
        throw new Error("Set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD in .env first.");
    }
    if (password.length < 8) {
        throw new Error("DEMO_ADMIN_PASSWORD must be at least 8 characters.");
    }

    const prisma = new PrismaClient();
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const now = new Date();
        await prisma.admin.upsert({
            where: { email },
            update: { username, passwordHash, role: "admin", passwordChangedAt: now },
            create: { email, username, passwordHash, role: "admin", passwordChangedAt: now },
        });
        console.log(`Admin ready: ${email} (username: ${username})`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
});
