const getProfitZonesForCall = (
  premiums: string[],
  strikePrice: number,
  amount: string
) => {
  const profitZones: Array<number> = [];
  for (const premium of premiums) {
    // Formula for Call
    const zone = strikePrice + Number(premium) + Number(amount);
    profitZones.push(zone);
  }

  return profitZones;
};

const getProfitZonesForPut = (
  premiums: string[],
  strikePrice: number,
  amount: string
) => {
  const profitZones: Array<number> = [];
  for (const premium of premiums) {
    const zone = strikePrice - (Number(premium) + Number(amount));
    profitZones.push(zone);
  }
  return profitZones;
};

const getProfitZonesForStrap = (
  premiums: string[],
  strikePrice: number,
  amount: string
) => {
  const profitZones: Array<number> = [];
  for (const premium of premiums) {
    const zone = strikePrice + (Number(premium) + Number(amount));
    profitZones.push(zone);
  }
  return profitZones;
};
// async function getProfitZonesForStrip(
//   premiums: string[],
//   strikePrice: number,
//   amount: string
// ): Promise<number[]> {}
// async function getProfitZonesForStrangle(
//   premiums: string[],
//   strikePrice: number,
//   amount: string
// ): Promise<number[]> {}
// async function getProfitZonesForCondor(
//   premiums: string[],
//   strikePrice: number,
//   amount: string
// ): Promise<number[]> {}
// async function getProfitZonesForButterfly(
//   premiums: string[],
//   strikePrice: number,
//   amount: string
// ): Promise<number[]> {}
// async function getProfitZonesForBearPut(
//   premiums: string[],
//   strikePrice: number,
//   amount: string
// ): Promise<number[]> {}
// async function getProfitZonesForBearCall(
//   premiums: string[],
//   strikePrice: number,
//   amount: string
// ): Promise<number[]> {}
// async function getProfitZonesForBullCall(
//   premiums: string[],
//   strikePrice: number,
//   amount: string
// ): Promise<number[]> {}
// async function getProfitZonesForBullPut(
//   premiums: string[],
//   strikePrice: number,
//   amount: string
// ): Promise<number[]> {}

export const getProfitZones = (
  premiums: string[],
  strategy: string,
  strikePrice: number,
  amount: string
): number[] => {
  // console.log(
  //   "input for profit zone calculator",
  //   premiums,
  //   strategy,
  //   strikePrice
  // );
  let profitZones: number[] = [];
  switch (strategy.toUpperCase()) {
    case "CALL":
      profitZones = getProfitZonesForCall(premiums, strikePrice, amount);
      break;
    case "PUT":
      profitZones = getProfitZonesForPut(premiums, strikePrice, amount);
      break;
    case "STRAP":
      profitZones = getProfitZonesForStrap(premiums, strikePrice, amount);
      break;
    case "STRIP":
      // fix this please
      profitZones = getProfitZonesForStrap(premiums, strikePrice, amount);
      break;
    // return await getProfitZonesForStrip(premiums, strikePrice, amount);
    // case "STRANGLE":
    //   return await getProfitZonesForStrangle(premiums, strikePrice, amount);
    // case "CONDOR":
    //   return await getProfitZonesForCondor(premiums, strikePrice, amount);
    // case "BUTTERFLY":
    //   return await getProfitZonesForButterfly(premiums, strikePrice, amount);
    // case "BULL CALL":
    //   return await getProfitZonesForBullCall(premiums, strikePrice, amount);
    // case "BULL PUT":
    //   return await getProfitZonesForBullPut(premiums, strikePrice, amount);
    // case "BEAR CALL":
    //   return await getProfitZonesForBearCall(premiums, strikePrice, amount);
    // case "BEAR PUT":
    //   return await getProfitZonesForBearPut(premiums, strikePrice, amount);
    default:
      profitZones = [];
  }
  return profitZones;
};
