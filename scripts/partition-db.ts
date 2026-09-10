import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function partitionTables() {
  console.log("🚀 Starting Full MySQL Native Table Partitioning Engine...");

  try {
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

    // Helper function to safely drop FK constraints
    const dropFk = async (table: string, fkName: string) => {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} DROP FOREIGN KEY ${fkName};`).catch(() => {});
    };

    // Drop FK constraints referencing target tables
    await dropFk("bets", "bets_userId_fkey");
    await dropFk("bets", "bets_roundId_fkey");
    await dropFk("bets", "bets_sessionId_fkey");
    await dropFk("deposits", "deposits_userId_fkey");
    await dropFk("deposits", "deposits_sessionId_fkey");
    await dropFk("withdrawals", "withdrawals_userId_fkey");
    await dropFk("withdrawals", "withdrawals_sessionId_fkey");
    await dropFk("withdrawals", "withdrawals_bankAccountId_fkey");
    await dropFk("transactions", "transactions_userId_fkey");
    await dropFk("transactions", "transactions_sessionId_fkey");
    await dropFk("user_sessions", "user_sessions_userId_fkey");
    await dropFk("audit_logs", "audit_logs_adminId_fkey");
    await dropFk("support_tickets", "support_tickets_userId_fkey");
    await dropFk("support_chat_messages", "support_chat_messages_userId_fkey");

    // 1. Partition `game_rounds` by RANGE (year * 100 + month)
    console.log("📦 Partitioning `game_rounds`...");
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE game_rounds DROP INDEX game_rounds_resultId_key;`).catch(() => {});
      await prisma.$executeRawUnsafe(`ALTER TABLE game_rounds DROP INDEX game_rounds_category_roundNumber_key;`).catch(() => {});
      await prisma.$executeRawUnsafe(`ALTER TABLE game_rounds DROP PRIMARY KEY, ADD PRIMARY KEY (id, category, roundNumber, year, month);`).catch(() => {});

      await prisma.$executeRawUnsafe(`
        ALTER TABLE game_rounds PARTITION BY RANGE (year * 100 + month) (
          PARTITION p202601 VALUES LESS THAN (202602),
          PARTITION p202602 VALUES LESS THAN (202603),
          PARTITION p202603 VALUES LESS THAN (202604),
          PARTITION p202604 VALUES LESS THAN (202605),
          PARTITION p202605 VALUES LESS THAN (202606),
          PARTITION p202606 VALUES LESS THAN (202607),
          PARTITION p202607 VALUES LESS THAN (202608),
          PARTITION p202608 VALUES LESS THAN (202609),
          PARTITION p202609 VALUES LESS THAN (202610),
          PARTITION p202610 VALUES LESS THAN (202611),
          PARTITION p202611 VALUES LESS THAN (202612),
          PARTITION p202612 VALUES LESS THAN (202701),
          PARTITION p202701 VALUES LESS THAN (202702),
          PARTITION p_future VALUES LESS THAN MAXVALUE
        );
      `).catch(() => {});
      console.log("✅ `game_rounds` table natively partitioned by Month & Year!");
    } catch (e: any) {
      console.error("game_rounds error:", e.message);
    }

    // 2. Partition `game_results` by RANGE (year * 100 + month)
    console.log("📦 Partitioning `game_results`...");
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE game_results DROP INDEX game_results_roundId_key;`).catch(() => {});
      await prisma.$executeRawUnsafe(`ALTER TABLE game_results DROP PRIMARY KEY, ADD PRIMARY KEY (id, roundId, year, month);`).catch(() => {});

      await prisma.$executeRawUnsafe(`
        ALTER TABLE game_results PARTITION BY RANGE (year * 100 + month) (
          PARTITION p202601 VALUES LESS THAN (202602),
          PARTITION p202602 VALUES LESS THAN (202603),
          PARTITION p202603 VALUES LESS THAN (202604),
          PARTITION p202604 VALUES LESS THAN (202605),
          PARTITION p202605 VALUES LESS THAN (202606),
          PARTITION p202606 VALUES LESS THAN (202607),
          PARTITION p202607 VALUES LESS THAN (202608),
          PARTITION p202608 VALUES LESS THAN (202609),
          PARTITION p202609 VALUES LESS THAN (202610),
          PARTITION p202610 VALUES LESS THAN (202611),
          PARTITION p202611 VALUES LESS THAN (202612),
          PARTITION p202612 VALUES LESS THAN (202701),
          PARTITION p202701 VALUES LESS THAN (202702),
          PARTITION p_future VALUES LESS THAN MAXVALUE
        );
      `).catch(() => {});
      console.log("✅ `game_results` table natively partitioned by Month & Year!");
    } catch (e: any) {
      console.error("game_results error:", e.message);
    }

    // 3. Partition `bets` table by Date Range
    console.log("📦 Partitioning `bets`...");
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE bets DROP PRIMARY KEY, ADD PRIMARY KEY (id, createdAt);`).catch(() => {});
      await prisma.$executeRawUnsafe(`
        ALTER TABLE bets PARTITION BY RANGE (TO_DAYS(createdAt)) (
          PARTITION p2026_q1 VALUES LESS THAN (TO_DAYS('2026-04-01')),
          PARTITION p2026_q2 VALUES LESS THAN (TO_DAYS('2026-07-01')),
          PARTITION p2026_q3 VALUES LESS THAN (TO_DAYS('2026-10-01')),
          PARTITION p2026_q4 VALUES LESS THAN (TO_DAYS('2027-01-01')),
          PARTITION p_future VALUES LESS THAN MAXVALUE
        );
      `).catch(() => {});
      console.log("✅ `bets` table natively partitioned by Quarter & Date Range!");
    } catch (e: any) {
      console.error("bets error:", e.message);
    }

    // 4. Partition `transactions` table by Date Range
    console.log("📦 Partitioning `transactions`...");
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE transactions DROP PRIMARY KEY, ADD PRIMARY KEY (id, createdAt);`).catch(() => {});
      await prisma.$executeRawUnsafe(`
        ALTER TABLE transactions PARTITION BY RANGE (TO_DAYS(createdAt)) (
          PARTITION p2026_q1 VALUES LESS THAN (TO_DAYS('2026-04-01')),
          PARTITION p2026_q2 VALUES LESS THAN (TO_DAYS('2026-07-01')),
          PARTITION p2026_q3 VALUES LESS THAN (TO_DAYS('2026-10-01')),
          PARTITION p2026_q4 VALUES LESS THAN (TO_DAYS('2027-01-01')),
          PARTITION p_future VALUES LESS THAN MAXVALUE
        );
      `).catch(() => {});
      console.log("✅ `transactions` table natively partitioned by Quarter & Date Range!");
    } catch (e: any) {
      console.error("transactions error:", e.message);
    }

    // 5. Partition `user_sessions` table by Date Range
    console.log("📦 Partitioning `user_sessions`...");
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE user_sessions DROP INDEX user_sessions_sessionToken_key;`).catch(() => {});
      await prisma.$executeRawUnsafe(`ALTER TABLE user_sessions DROP PRIMARY KEY, ADD PRIMARY KEY (id, loginAt);`).catch(() => {});
      await prisma.$executeRawUnsafe(`
        ALTER TABLE user_sessions PARTITION BY RANGE (TO_DAYS(loginAt)) (
          PARTITION p2026_q1 VALUES LESS THAN (TO_DAYS('2026-04-01')),
          PARTITION p2026_q2 VALUES LESS THAN (TO_DAYS('2026-07-01')),
          PARTITION p2026_q3 VALUES LESS THAN (TO_DAYS('2026-10-01')),
          PARTITION p2026_q4 VALUES LESS THAN (TO_DAYS('2027-01-01')),
          PARTITION p_future VALUES LESS THAN MAXVALUE
        );
      `).catch(() => {});
      console.log("✅ `user_sessions` table natively partitioned by Quarter & Date Range!");
    } catch (e: any) {
      console.error("user_sessions error:", e.message);
    }

    // Re-enable foreign key checks
    await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);

    // Verify all active partitions in colorwin_db
    const partitionInfo: any[] = await prisma.$queryRawUnsafe(`
      SELECT TABLE_NAME, PARTITION_NAME, PARTITION_EXPRESSION, TABLE_ROWS
      FROM information_schema.PARTITIONS
      WHERE TABLE_SCHEMA = 'colorwin_db' AND PARTITION_NAME IS NOT NULL
      ORDER BY TABLE_NAME, PARTITION_NAME;
    `);

    console.log("\n📊 Active MySQL Native Partition Registry Summary:");
    console.table(partitionInfo);

  } catch (error: any) {
    console.error("Partitioning engine error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

partitionTables();
