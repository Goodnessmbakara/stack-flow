import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;

/*
  Week 1 - Day 1: Initial Test Scaffolding
  Testing pool creation and deposit functionality
*/

describe("Whale Pool Vault - Day 1 Tests", () => {
  beforeEach(() => {
    // Reset simnet state before each test
    simnet.setEpoch("3.0");
  });

  describe("Pool Creation", () => {
    it("should allow anyone to create a new pool", () => {
      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "create-pool",
        [Cl.stringAscii("DeFi Whale Index")],
        user1
      );

      expect(result).toBeOk(Cl.uint(1)); // First pool ID = 1
    });

    it("should initialize pool with correct metadata", () => {
      // Create pool
      simnet.callPublicFn(
        "whale-pool-vault",
        "create-pool",
        [Cl.stringAscii("Test Pool")],
        user1
      );

      // Check pool data
      const poolData = simnet.callReadOnlyFn(
        "whale-pool-vault",
        "get-pool",
        [Cl.uint(1)],
        user1
      );

      expect(poolData.result).toBeSome(
        Cl.tuple({
          name: Cl.stringAscii("Test Pool"),
          creator: Cl.principal(user1),
          paused: Cl.bool(false),
          "total-shares": Cl.uint(0),
          "total-value-locked": Cl.uint(0),
        })
      );
    });

    it("should reject empty pool names", () => {
      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "create-pool",
        [Cl.stringAscii("")],
        user1
      );

      expect(result).toBeErr(Cl.uint(102)); // ERR-INVALID-AMOUNT
    });
  });

  describe("Deposits", () => {
    beforeEach(() => {
      // Create a test pool before each deposit test
      simnet.callPublicFn(
        "whale-pool-vault",
        "create-pool",
        [Cl.stringAscii("Test Pool")],
        deployer
      );
    });

    it("should allow user to deposit STX and receive shares", () => {
      const depositAmount = 1000000000; // 1000 STX (6 decimals)

      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "deposit",
        [Cl.uint(1), Cl.uint(depositAmount)],
        user1
      );

      expect(result).toBeOk(
        Cl.tuple({
          shares: Cl.uint(depositAmount), // 1:1 on first deposit
          price: Cl.uint(1000000), // 1 STX per share initially
        })
      );
    });

    it("should correctly calculate share price for second deposit", () => {
      // First deposit: 1000 STX
      simnet.callPublicFn(
        "whale-pool-vault",
        "deposit",
        [Cl.uint(1), Cl.uint(1000000000)],
        user1
      );

      // Second deposit: 500 STX (should get fewer shares at same price)
      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "deposit",
        [Cl.uint(1), Cl.uint(500000000)],
        user2
      );

      expect(result).toBeOk();
      
      // Verify user2 received correct shares
      const user2Shares = simnet.callReadOnlyFn(
        "whale-pool-vault",
        "get-user-shares",
        [Cl.principal(user2), Cl.uint(1)],
        user2
      );

      expect(user2Shares.result).toBe(Cl.uint(500000000));
    });

    it("should reject zero amount deposits", () => {
      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "deposit",
        [Cl.uint(1), Cl.uint(0)],
        user1
      );

      expect(result).toBeErr(Cl.uint(102)); // ERR-INVALID-AMOUNT
    });

    it("should reject deposits to non-existent pools", () => {
      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "deposit",
        [Cl.uint(999), Cl.uint(1000000)],
        user1
      );

      expect(result).toBeErr(Cl.uint(101)); // ERR-POOL-NOT-FOUND
    });
  });

  describe("Emergency Controls", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "whale-pool-vault",
        "create-pool",
        [Cl.stringAscii("Test Pool")],
        deployer
      );
    });

    it("should allow contract owner to emergency pause", () => {
      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "emergency-pause",
        [],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify paused state
      const isPaused = simnet.callReadOnlyFn(
        "whale-pool-vault",
        "is-emergency-paused",
        [],
        deployer
      );

      expect(isPaused.result).toBe(Cl.bool(true));
    });

    it("should reject deposits when emergency paused", () => {
      // Pause
      simnet.callPublicFn(
        "whale-pool-vault",
        "emergency-pause",
        [],
        deployer
      );

      // Try to deposit
      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "deposit",
        [Cl.uint(1), Cl.uint(1000000)],
        user1
      );

      expect(result).toBeErr(Cl.uint(103)); // ERR-PAUSED
    });

    it("should reject emergency pause from non-owner", () => {
      const { result } = simnet.callPublicFn(
        "whale-pool-vault",
        "emergency-pause",
        [],
        user1 // Not the owner
      );

      expect(result).toBeErr(Cl.uint(100)); // ERR-NOT-AUTHORIZED
    });

    it("should allow pool creator to pause specific pool", () => {
      const { result } =simnet.callPublicFn(
        "whale-pool-vault",
        "pause-pool",
        [Cl.uint(1)],
        deployer // Pool creator
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify pool is paused
      const poolData = simnet.callReadOnlyFn(
        "whale-pool-vault",
        "get-pool",
        [Cl.uint(1)],
        deployer
      );

      expect(poolData.result).toBeSome(
        Cl.tuple({
          paused: Cl.bool(true),
        })
      );
    });
  });

  describe("Read-Only Functions", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "whale-pool-vault",
        "create-pool",
        [Cl.stringAscii("Test Pool")],
        deployer
      );
      
      simnet.callPublicFn(
        "whale-pool-vault",
        "deposit",
        [Cl.uint(1), Cl.uint(1000000000)],
        user1
      );
    });

    it("should correctly report share price", () => {
      const sharePrice = simnet.callReadOnlyFn(
        "whale-pool-vault",
        "get-share-price",
        [Cl.uint(1)],
        user1
      );

      expect(sharePrice.result).toBe(Cl.uint(1000000)); // 1 STX = 1 share
    });

    it("should correctly report user shares", () => {
      const userShares = simnet.callReadOnlyFn(
        "whale-pool-vault",
        "get-user-shares",
        [Cl.principal(user1), Cl.uint(1)],
        user1
      );

      expect(userShares.result).toBe(Cl.uint(1000000000)); // 1000 shares
    });

    it("should return 0 for non-existent user shares", () => {
      const userShares = simnet.callReadOnlyFn(
        "whale-pool-vault",
        "get-user-shares",
        [Cl.principal(user2), Cl.uint(1)],
        user2
      );

      expect(userShares.result).toBe(Cl.uint(0));
    });
  });
});
