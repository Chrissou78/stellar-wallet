import { FastifyInstance } from "fastify";
import { db, schema } from "../db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

export async function walletRoutes(app: FastifyInstance) {
  // ──────────────────────────────────────────
  // GET USER WALLETS
  // ──────────────────────────────────────────
  app.get("/api/v1/wallets", { preHandler: authMiddleware }, async (request) => {
    const userId = request.user!.userId;

    const wallets = await db
      .select()
      .from(schema.userWallets)
      .where(eq(schema.userWallets.userId, userId));

    return wallets;
  });

  // ──────────────────────────────────────────
  // ADD WALLET
  // ──────────────────────────────────────────
  app.post("/api/v1/wallets", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { name, publicKey, encryptedSecret, network } = request.body as {
      name: string;
      publicKey: string;
      encryptedSecret?: string;
      network?: string;
    };

    if (!name || !publicKey) {
      return reply.status(400).send({ error: "Name and publicKey are required" });
    }

    // Check if wallet already exists for this user
    const existing = await db
      .select({ id: schema.userWallets.id })
      .from(schema.userWallets)
      .where(
        and(
          eq(schema.userWallets.userId, userId),
          eq(schema.userWallets.publicKey, publicKey)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return reply.status(409).send({ error: "Wallet already exists" });
    }

    // Deactivate other wallets
    await db
      .update(schema.userWallets)
      .set({ isActive: false })
      .where(eq(schema.userWallets.userId, userId));

    const [wallet] = await db
      .insert(schema.userWallets)
      .values({
        userId,
        name,
        publicKey,
        encryptedSecret: encryptedSecret || null,
        network: network || "testnet",
        isActive: true,
      })
      .returning();

    return wallet;
  });

  // ──────────────────────────────────────────
  // SET ACTIVE WALLET
  // ──────────────────────────────────────────
  app.patch("/api/v1/wallets/:id/activate", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    // Deactivate all
    await db
      .update(schema.userWallets)
      .set({ isActive: false })
      .where(eq(schema.userWallets.userId, userId));

    // Activate selected
    const [wallet] = await db
      .update(schema.userWallets)
      .set({ isActive: true })
      .where(
        and(
          eq(schema.userWallets.id, parseInt(id)),
          eq(schema.userWallets.userId, userId)
        )
      )
      .returning();

    if (!wallet) {
      return reply.status(404).send({ error: "Wallet not found" });
    }

    return wallet;
  });

  // ──────────────────────────────────────────
  // RENAME WALLET
  // ──────────────────────────────────────────
  app.patch("/api/v1/wallets/:id", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };

    const [wallet] = await db
      .update(schema.userWallets)
      .set({ name })
      .where(
        and(
          eq(schema.userWallets.id, parseInt(id)),
          eq(schema.userWallets.userId, userId)
        )
      )
      .returning();

    if (!wallet) {
      return reply.status(404).send({ error: "Wallet not found" });
    }

    return wallet;
  });

  // ──────────────────────────────────────────
  // DELETE WALLET
  // ──────────────────────────────────────────
  app.delete("/api/v1/wallets/:id", { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.user!.userId;
    const { id } = request.params as { id: string };

    const [deleted] = await db
      .delete(schema.userWallets)
      .where(
        and(
          eq(schema.userWallets.id, parseInt(id)),
          eq(schema.userWallets.userId, userId)
        )
      )
      .returning();

    if (!deleted) {
      return reply.status(404).send({ error: "Wallet not found" });
    }

    // If we deleted the active wallet, activate another one
    const remaining = await db
      .select()
      .from(schema.userWallets)
      .where(eq(schema.userWallets.userId, userId))
      .limit(1);

    if (remaining.length > 0) {
      await db
        .update(schema.userWallets)
        .set({ isActive: true })
        .where(eq(schema.userWallets.id, remaining[0].id));
    }

    return { ok: true };
  });
}
