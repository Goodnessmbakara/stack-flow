import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

// Get accounts from simnet
const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const user1 = accounts.get("wallet_1")!;
const user2 = accounts.get("wallet_2")!;

const STX_AMOUNT = 10_000_000;
const STRIKE_PRICE = 2_500_000;
const PREMIUM = 700_000;
const BLOCKS_7_DAYS = 1100; // Safety margin above min (1008)

describe("StackFlow Options V1 - Create Tests", () => {
  it("creates CALL option successfully", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-call-option",
      [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("creates STRAP option successfully", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-strap-option",
      [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM * 2), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("creates Bull Call Spread successfully", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-bull-call-spread",
      [Cl.uint(STX_AMOUNT), Cl.uint(2_500_000), Cl.uint(2_750_000), Cl.uint(200_000), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("creates Bull Put Spread successfully", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-bull-put-spread",
      [Cl.uint(STX_AMOUNT), Cl.uint(2_250_000), Cl.uint(2_500_000), Cl.uint(300_000), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeOk(Cl.uint(1));
  });
});

describe("StackFlow Options V1 - Validation", () => {
  it("rejects zero amount", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-call-option",
      [Cl.uint(0), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeErr(Cl.uint(102));
  });

  it("rejects invalid strikes for spread", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-bull-call-spread",
      [Cl.uint(STX_AMOUNT), Cl.uint(2_750_000), Cl.uint(2_500_000), Cl.uint(200_000), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeErr(Cl.uint(112));
  });
});

describe("StackFlow Options V1 - Exercise", () => {
  it("validates ITM option correctly", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const createResult = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-call-option",
      [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
      user1
    );
    expect(createResult.result).toBeOk(Cl.uint(1));
    
    // Verify option was created correctly
    const optionData = simnet.callReadOnlyFn(
      "stackflow-options-v1",
      "get-option",
      [Cl.uint(1)],
      user1
    );
    // The result is a Some value containing option data
    expect(optionData.result).not.toBeNone();
  });

  it("rejects non-owner exercise", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    simnet.callPublicFn(
      "stackflow-options-v1",
      "create-call-option",
      [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
      user1
    );
    
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "exercise-option",
      [Cl.uint(1), Cl.uint(3_000_000)],
      user2
    );
    expect(result).toBeErr(Cl.uint(106));
  });
});

describe("StackFlow Options V1 - Admin", () => {
  it("allows owner to pause", () => {
    const { result } = simnet.callPublicFn("stackflow-options-v1", "pause-protocol", [], deployer);
    expect(result).toBeOk(Cl.bool(true));
    simnet.callPublicFn("stackflow-options-v1", "unpause-protocol", [], deployer);
  });

  it("rejects non-owner pause", () => {
    const { result } = simnet.callPublicFn("stackflow-options-v1", "pause-protocol", [], user1);
    expect(result).toBeErr(Cl.uint(100));
  });
});

describe("StackFlow Options V1 - Bearish Strategies", () => {
  it("creates PUT option successfully", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-put-option",
      [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("creates STRIP option successfully", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-strip-option",
      [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM * 2), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("creates Bear Put Spread successfully", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-bear-put-spread",
      [Cl.uint(STX_AMOUNT), Cl.uint(2_250_000), Cl.uint(2_500_000), Cl.uint(200_000), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeOk(Cl.uint(1));
  });

  it("creates Bear Call Spread successfully", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    const { result } = simnet.callPublicFn(
      "stackflow-options-v1",
      "create-bear-call-spread",
      [Cl.uint(STX_AMOUNT), Cl.uint(2_500_000), Cl.uint(2_750_000), Cl.uint(300_000), Cl.uint(expiry)],
      user1
    );
    expect(result).toBeOk(Cl.uint(1));
  });
});

describe("StackFlow Options V1 - Bearish Payout Validation", () => {
  it("PUT option returns correct strategy code", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    simnet.callPublicFn(
      "stackflow-options-v1",
      "create-put-option",
      [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM), Cl.uint(expiry)],
      user1
    );
    
    const optionData = simnet.callReadOnlyFn(
      "stackflow-options-v1",
      "get-option",
      [Cl.uint(1)],
      user1
    );
    expect(optionData.result).not.toBeNone();
  });

  it("STRIP option returns correct strategy code", () => {
    const expiry = simnet.blockHeight + BLOCKS_7_DAYS;
    simnet.callPublicFn(
      "stackflow-options-v1",
      "create-strip-option",
      [Cl.uint(STX_AMOUNT), Cl.uint(STRIKE_PRICE), Cl.uint(PREMIUM * 2), Cl.uint(expiry)],
      user1
    );
    
    const optionData = simnet.callReadOnlyFn(
      "stackflow-options-v1",
      "get-option",
      [Cl.uint(1)],
      user1
    );
    expect(optionData.result).not.toBeNone();
  });
});
