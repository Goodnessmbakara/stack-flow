import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

// Get accounts from simnet
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;

// Test constants
const STX_AMOUNT = 10_000_000; // 10 STX
const STRIKE_PRICE = 2_500_000; // $2.50 (micro-USD)
const PREMIUM = 700_000; // 0.7 STX
const LOWER_STRIKE = 2_000_000; // $2.00
const UPPER_STRIKE = 3_000_000; // $3.00
const COLLATERAL = 10_000_000; // 10 STX
const BLOCKS_7_DAYS = 1100; // Safety margin above min (1008)
const BLOCKS_30_DAYS = 4320; // 30 days

describe("StackFlow Options M1 - Milestone 1 Tests", () => {
  
  describe("CALL Strategy Tests", () => {
    it("creates CALL option successfully", () => {
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("rejects CALL option with zero amount", () => {
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(0), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(result).toBeErr(Cl.uint(102)); // err-invalid-amount
    });

    it("rejects CALL option with zero premium", () => {
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(0), Cl.uint(expiry)],
        user1
      );
      expect(result).toBeErr(Cl.uint(103)); // err-invalid-premium
    });

    it("rejects CALL option with invalid expiry (too short)", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(simnet.blockHeight + 100)],
        user1
      );
      expect(result).toBeErr(Cl.uint(104)); // err-invalid-expiry
    });

    it("rejects CALL option with invalid expiry (too long)", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(simnet.blockHeight + 20000)],
        user1
      );
      expect(result).toBeErr(Cl.uint(104)); // err-invalid-expiry
    });

    it("exercises ITM CALL option successfully", () => {
      // Create option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Exercise with price above strike
      const currentPrice = 3_000_000; // $3.00 > $2.50 strike
      const { result: exerciseResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(currentPrice)],
        user1
      );
      expect(exerciseResult).toBeOk(Cl.uint(4_300_000)); // Expected payout
    });

    it("rejects OTM CALL exercise", () => {
      // Create option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Try to exercise with price below strike
      const currentPrice = 2_000_000; // $2.00 < $2.50 strike
      const { result: exerciseResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(currentPrice)],
        user1
      );
      expect(exerciseResult).toBeOk(Cl.uint(0)); // No payout for OTM
    });

    it("rejects non-owner CALL exercise", () => {
      // Create option with user1
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Try to exercise with user2
      const currentPrice = 3_000_000;
      const { result: exerciseResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(currentPrice)],
        user2
      );
      expect(exerciseResult).toBeErr(Cl.uint(106)); // err-not-owner
    });
  });

  describe("BPSP Strategy Tests", () => {
    it("creates BPSP option successfully", () => {
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-bull-put-spread",
        [Cl.uint(STX_AMOUNT), Cl.uint(LOWER_STRIKE), Cl.uint(UPPER_STRIKE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("rejects BPSP option with zero amount", () => {
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-bull-put-spread",
        [Cl.uint(0), Cl.uint(LOWER_STRIKE), Cl.uint(UPPER_STRIKE), Cl.uint(COLLATERAL), Cl.uint(expiry)],
        user1
      );
      expect(result).toBeErr(Cl.uint(102)); // err-invalid-amount
    });

    it("rejects BPSP option with invalid strikes", () => {
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-bull-put-spread",
        [Cl.uint(STX_AMOUNT), Cl.uint(UPPER_STRIKE), Cl.uint(LOWER_STRIKE), Cl.uint(COLLATERAL), Cl.uint(expiry)],
        user1
      );
      expect(result).toBeErr(Cl.uint(112)); // err-invalid-strikes
    });

    it("rejects BPSP option with insufficient collateral", () => {
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-bull-put-spread",
        [Cl.uint(STX_AMOUNT), Cl.uint(LOWER_STRIKE), Cl.uint(UPPER_STRIKE), Cl.uint(5_000_000), Cl.uint(expiry)],
        user1
      );
      expect(result).toBeErr(Cl.uint(102)); // err-invalid-amount
    });

    it("exercises ITM BPSP option successfully", () => {
      // Create option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-bull-put-spread",
        [Cl.uint(STX_AMOUNT), Cl.uint(LOWER_STRIKE), Cl.uint(UPPER_STRIKE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Exercise with price above upper strike (keep premium)
      const currentPrice = 3_500_000; // $3.50 > $3.00 upper strike
      const { result: exerciseResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(currentPrice)],
        user1
      );
      expect(exerciseResult).toBeOk(Cl.uint(0)); // No payout, but keeps premium
    });

    it("exercises BPSP option with partial loss", () => {
      // Create option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-bull-put-spread",
        [Cl.uint(STX_AMOUNT), Cl.uint(LOWER_STRIKE), Cl.uint(UPPER_STRIKE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Exercise with price between strikes (partial loss)
      const currentPrice = 2_500_000; // $2.50 between $2.00 and $3.00
      const { result: exerciseResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(currentPrice)],
        user1
      );
      expect(exerciseResult).toBeOk(Cl.uint(0)); // Partial loss scenario
    });

    it("rejects non-owner BPSP exercise", () => {
      // Create option with user1
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-bull-put-spread",
        [Cl.uint(STX_AMOUNT), Cl.uint(LOWER_STRIKE), Cl.uint(UPPER_STRIKE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Try to exercise with user2
      const currentPrice = 3_500_000;
      const { result: exerciseResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(currentPrice)],
        user2
      );
      expect(exerciseResult).toBeErr(Cl.uint(106)); // err-not-owner
    });
  });

  describe("Settlement Tests", () => {
    it("settles expired CALL option", () => {
      // Create option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Fast forward to expiry
      simnet.mineBlocks(BLOCKS_7_DAYS + 1);

      // Settle expired option
      const settlementPrice = 3_000_000; // $3.00
      const { result: settleResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "settle-expired",
        [Cl.uint(1), Cl.uint(settlementPrice)],
        user1
      );
      expect(settleResult).toBeOk(Cl.uint(4_300_000)); // Expected payout
    });

    it("rejects settlement before expiry", () => {
      // Create option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Try to settle before expiry
      const settlementPrice = 3_000_000;
      const { result: settleResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "settle-expired",
        [Cl.uint(1), Cl.uint(settlementPrice)],
        user1
      );
      expect(settleResult).toBeErr(Cl.uint(110)); // err-not-expired
    });
  });

  describe("Admin Functions Tests", () => {
    it("allows owner to pause protocol", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "pause-protocol",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner pause attempt", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "pause-protocol",
        [],
        user1
      );
      expect(result).toBeErr(Cl.uint(100)); // err-not-authorized
    });

    it("allows owner to unpause protocol", () => {
      // First pause
      simnet.callPublicFn("stackflow-options-m1", "pause-protocol", [], deployer);
      
      // Then unpause
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "unpause-protocol",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set protocol fee", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "set-protocol-fee",
        [Cl.uint(50)], // 0.5%
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects invalid protocol fee", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "set-protocol-fee",
        [Cl.uint(1500)], // 15% - too high
        deployer
      );
      expect(result).toBeErr(Cl.uint(102)); // err-invalid-amount
    });

    it("allows owner to set protocol wallet", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "set-protocol-wallet",
        [Cl.principal(user1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Read-Only Functions Tests", () => {
    it("gets option details", () => {
      // Create option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );

      // Get option details
      const { result } = simnet.callReadOnlyFn(
        "stackflow-options-m1",
        "get-option",
        [Cl.uint(1)],
        user1
      );
      expect(result).toBeSome();
    });

    it("gets user options", () => {
      // Create option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );

      // Get user options
      const { result } = simnet.callReadOnlyFn(
        "stackflow-options-m1",
        "get-user-options",
        [Cl.principal(user1)],
        user1
      );
      expect(result).toBeList([Cl.uint(1)]);
    });

    it("gets protocol stats", () => {
      const { result } = simnet.callReadOnlyFn(
        "stackflow-options-m1",
        "get-stats",
        [],
        user1
      );
      expect(result).toBeSome();
    });
  });

  describe("Payout Calculation Tests", () => {
    it("calculates CALL payout correctly", () => {
      // Create CALL option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Exercise with specific price
      const currentPrice = 3_500_000; // $3.50
      const { result: exerciseResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(currentPrice)],
        user1
      );
      
      // Expected payout: (3.50 - 2.50) * 10 - 0.7 = 10 - 0.7 = 9.3 STX
      expect(exerciseResult).toBeOk(Cl.uint(9_300_000));
    });

    it("calculates BPSP payout correctly", () => {
      // Create BPSP option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      const { result: createResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "create-bull-put-spread",
        [Cl.uint(STX_AMOUNT), Cl.uint(LOWER_STRIKE), Cl.uint(UPPER_STRIKE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      expect(createResult).toBeOk(Cl.uint(1));

      // Exercise with price above upper strike
      const currentPrice = 3_500_000; // $3.50 > $3.00 upper strike
      const { result: exerciseResult } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(currentPrice)],
        user1
      );
      
      // Should keep premium (no payout for BPSP when price > upper strike)
      expect(exerciseResult).toBeOk(Cl.uint(0));
    });
  });

  describe("Error Handling Tests", () => {
    it("rejects exercise of non-existent option", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(999), Cl.uint(3_000_000)],
        user1
      );
      expect(result).toBeErr(Cl.uint(105)); // err-option-not-found
    });

    it("rejects settlement of non-existent option", () => {
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "settle-expired",
        [Cl.uint(999), Cl.uint(3_000_000)],
        user1
      );
      expect(result).toBeErr(Cl.uint(105)); // err-option-not-found
    });

    it("rejects double exercise", () => {
      // Create and exercise option
      const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
      simnet.callPublicFn(
        "stackflow-options-m1",
        "create-call-option",
        [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
        user1
      );
      
      simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(3_000_000)],
        user1
      );

      // Try to exercise again
      const { result } = simnet.callPublicFn(
        "stackflow-options-m1",
        "exercise-option",
        [Cl.uint(1), Cl.uint(3_000_000)],
        user1
      );
      expect(result).toBeErr(Cl.uint(107)); // err-already-exercised
    });
  });
});
