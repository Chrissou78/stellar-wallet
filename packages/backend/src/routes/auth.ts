import { FastifyInstance } from "fastify";
import { db, schema } from "../db";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  validateStoredRefreshToken,
  verifyRefreshToken,
} from "../lib/auth";
import { authMiddleware } from "../middleware/auth";

export async function authRoutes(app: FastifyInstance) {
  // ──────────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────────
  app.post("/api/v1/auth/register", async (request, reply) => {
    const { email, password, firstName, lastName } = request.body as {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    };

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password are required" });
    }

    if (password.length < 8) {
      return reply.status(400).send({ error: "Password must be at least 8 characters" });
    }

    // Check if user exists
    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Email already registered" });
    }

    const passwordHash = await hashPassword(password);

    const [user] = await db
      .insert(schema.users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
      });

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
    };
  });

  // ──────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────
  app.post("/api/v1/auth/login", async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password are required" });
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid email or password" });
    }

    // Update last login
    await db
      .update(schema.users)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.users.id, user.id));

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });
    await storeRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        preferredLanguage: user.preferredLanguage,
        preferredNetwork: user.preferredNetwork,
      },
      accessToken,
      refreshToken,
    };
  });

  // ──────────────────────────────────────────
  // REFRESH TOKEN
  // ──────────────────────────────────────────
  app.post("/api/v1/auth/refresh", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };

    if (!refreshToken) {
      return reply.status(400).send({ error: "Refresh token required" });
    }

    const valid = await validateStoredRefreshToken(refreshToken);
    if (!valid) {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }

    try {
      const payload = verifyRefreshToken(refreshToken);

      // Revoke old token, issue new pair
      await revokeRefreshToken(refreshToken);

      const newAccessToken = generateAccessToken({ userId: payload.userId, email: payload.email });
      const newRefreshToken = generateRefreshToken({ userId: payload.userId, email: payload.email });
      await storeRefreshToken(payload.userId, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      return reply.status(401).send({ error: "Invalid refresh token" });
    }
  });

  // ──────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────
  app.post("/api/v1/auth/logout", async (request, reply) => {
    const { refreshToken } = request.body as { refreshToken: string };
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    return { ok: true };
  });

  // ──────────────────────────────────────────
  // GET CURRENT USER (protected)
  // ──────────────────────────────────────────
  app.get("/api/v1/auth/me", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;

    const [user] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        avatar: schema.users.avatar,
        preferredLanguage: schema.users.preferredLanguage,
        preferredNetwork: schema.users.preferredNetwork,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    // Get user's wallets
    const wallets = await db
      .select({
        id: schema.userWallets.id,
        name: schema.userWallets.name,
        publicKey: schema.userWallets.publicKey,
        network: schema.userWallets.network,
        isActive: schema.userWallets.isActive,
        createdAt: schema.userWallets.createdAt,
      })
      .from(schema.userWallets)
      .where(eq(schema.userWallets.userId, userId));

    return { ...user, wallets };
  });

  // ──────────────────────────────────────────
  // UPDATE PROFILE (protected)
  // ──────────────────────────────────────────
  app.patch("/api/v1/auth/profile", { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;
    const { firstName, lastName, avatar, preferredLanguage, preferredNetwork } = request.body as any;

    const updates: any = { updatedAt: new Date() };
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (avatar !== undefined) updates.avatar = avatar;
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
    if (preferredNetwork !== undefined) updates.preferredNetwork = preferredNetwork;

    const [updated] = await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        avatar: schema.users.avatar,
        preferredLanguage: schema.users.preferredLanguage,
        preferredNetwork: schema.users.preferredNetwork,
      });

    return updated;
  });

  // ──────────────────────────────────────────
  // CHANGE PASSWORD (protected)
  // ──────────────────────────────────────────
  app.post("/api/v1/auth/change-password", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { currentPassword, newPassword } = request.body as { currentPassword: string; newPassword: string };

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return reply.status(400).send({ error: "Invalid passwords" });
    }

    const [user] = await db
      .select({ passwordHash: schema.users.passwordHash })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    const valid = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return reply.status(401).send({ error: "Current password is incorrect" });
    }

    const newHash = await hashPassword(newPassword);
    await db.update(schema.users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(schema.users.id, userId));

    // Revoke all refresh tokens (force re-login everywhere)
    await revokeAllUserTokens(userId);

    return { ok: true };
  });
}
