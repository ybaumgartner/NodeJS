export const defaultCompany = {
  companyName: 'Optimus SA',
  sector: 'Commerce et distribution',
  fiscalYear: '2025',
  currency: 'CHF',
  accountingFramework: 'CO / Swiss GAAP RPC',
};

export const defaultInputs = {
  revenue: 345,
  purchases: 167,
  personnelExpenses: 78,
  otherOperatingExpenses: 48,
  depreciation: 26,
  financialResult: -3,
  taxExpense: 0,
  nonRecurringItems: 9,
  inventory: 148,
  receivables: 126,
  cash: 10,
  fixedAssets: 117,
  equity: 111,
  longTermDebt: 124,
  shortTermFinancialDebt: 72,
  suppliers: 39,
  otherOperatingLiabilities: 55,
  previousBfr: 56,
  openingCash: 7,
  capex: 103,
  assetDisposals: 0,
  newLongTermDebt: 119,
  debtRepayment: 0,
  capitalIncrease: 0,
  dividends: 0,
  latentReserves: 0,
  otherNonCashAdjustments: 0,
};

const daysBase = 365;

const ratio = (numerator, denominator) =>
  denominator === 0 ? 0 : numerator / denominator;

const round = (value) => Math.round((Number(value) || 0) * 100) / 100;

const formatPercentValue = (value) => round(value * 100);

const getLiquidityComment = (currentRatio) => {
  if (currentRatio >= 1.5) {
    return 'La liquidite generale est confortable et offre un coussin de securite a court terme.';
  }

  if (currentRatio >= 1.1) {
    return "La liquidite generale reste correcte, mais elle merite un suivi fin des echeances d'exploitation.";
  }

  return "La liquidite generale est tendue. L'entreprise depend fortement de la rotation rapide du cycle d'exploitation.";
};

const getTreasuryComment = (structuralTreasury, reconciliationGap) => {
  if (Math.abs(reconciliationGap) > 1) {
    return "La relation fondamentale FDR - BFR - tresorerie n'est pas parfaitement reconciliee. Il faut verifier les reclassements et la qualite des donnees.";
  }

  if (structuralTreasury > 0) {
    return 'Le FDR couvre le BFR et degage une tresorerie structurelle positive.';
  }

  if (structuralTreasury === 0) {
    return "Le FDR couvre exactement le BFR. La structure est equilibree mais sans marge de securite.";
  }

  return "Le BFR absorbe plus de ressources que le FDR n'en fournit. La tension de tresorerie doit etre surveillee.";
};

const getCashFlowComment = (operatingCashFlow, freeCashFlow) => {
  if (operatingCashFlow > 0 && freeCashFlow > 0) {
    return "L'exploitation genere du cash et finance egalement une partie des investissements sans recours excessif au financement externe.";
  }

  if (operatingCashFlow > 0 && freeCashFlow <= 0) {
    return "L'exploitation genere du cash, mais les investissements ou les sorties de cash absorbent l'essentiel de cette capacite.";
  }

  return "Le cash-flow d'exploitation est insuffisant. Il faut analyser le resultat, le BFR et les charges non recurrentes.";
};

export function analyzeFinancials(values) {
  const revenue = Number(values.revenue) || 0;
  const purchases = Number(values.purchases) || 0;
  const personnelExpenses = Number(values.personnelExpenses) || 0;
  const otherOperatingExpenses = Number(values.otherOperatingExpenses) || 0;
  const depreciation = Number(values.depreciation) || 0;
  const financialResult = Number(values.financialResult) || 0;
  const taxExpense = Number(values.taxExpense) || 0;
  const nonRecurringItems = Number(values.nonRecurringItems) || 0;
  const inventory = Number(values.inventory) || 0;
  const receivables = Number(values.receivables) || 0;
  const cash = Number(values.cash) || 0;
  const fixedAssets = Number(values.fixedAssets) || 0;
  const equity = Number(values.equity) || 0;
  const longTermDebt = Number(values.longTermDebt) || 0;
  const shortTermFinancialDebt = Number(values.shortTermFinancialDebt) || 0;
  const suppliers = Number(values.suppliers) || 0;
  const otherOperatingLiabilities = Number(values.otherOperatingLiabilities) || 0;
  const previousBfr = Number(values.previousBfr) || 0;
  const openingCash = Number(values.openingCash) || 0;
  const capex = Number(values.capex) || 0;
  const assetDisposals = Number(values.assetDisposals) || 0;
  const newLongTermDebt = Number(values.newLongTermDebt) || 0;
  const debtRepayment = Number(values.debtRepayment) || 0;
  const capitalIncrease = Number(values.capitalIncrease) || 0;
  const dividends = Number(values.dividends) || 0;
  const latentReserves = Number(values.latentReserves) || 0;
  const otherNonCashAdjustments = Number(values.otherNonCashAdjustments) || 0;

  const grossMargin = revenue - purchases;
  const ebitda = grossMargin - personnelExpenses - otherOperatingExpenses;
  const ebit = ebitda - depreciation;
  const recurringOperatingProfit = ebit - nonRecurringItems;
  const profitBeforeTax = recurringOperatingProfit + financialResult;
  const netIncome = profitBeforeTax - taxExpense;
  const caf =
    netIncome +
    depreciation +
    latentReserves +
    otherNonCashAdjustments;

  const bfRe = inventory + receivables - suppliers - otherOperatingLiabilities;
  const bfr = bfRe;
  const deltaBfr = bfr - previousBfr;
  const fdr = equity + longTermDebt - fixedAssets;
  const structuralTreasury = fdr - bfr;
  const netCash = cash - shortTermFinancialDebt;

  const operatingCashFlow = caf - deltaBfr;
  const investingCashFlow = assetDisposals - capex;
  const financingCashFlow =
    newLongTermDebt +
    capitalIncrease -
    debtRepayment -
    dividends;
  const netCashVariation =
    operatingCashFlow + investingCashFlow + financingCashFlow;
  const projectedClosingCash = openingCash + netCashVariation;
  const freeCashFlow = operatingCashFlow - capex;
  const reconciliationGap = structuralTreasury - netCash;

  const currentAssets = inventory + receivables + cash;
  const currentLiabilities =
    suppliers + otherOperatingLiabilities + shortTermFinancialDebt;
  const currentRatio = ratio(currentAssets, currentLiabilities);
  const quickRatio = ratio(receivables + cash, currentLiabilities);
  const equityRatio = ratio(equity, fixedAssets + currentAssets);
  const gearing = ratio(longTermDebt + shortTermFinancialDebt, equity);
  const dso = ratio(receivables, revenue) * daysBase;
  const dio = ratio(inventory, purchases) * daysBase;
  const dpo = ratio(suppliers, purchases) * daysBase;

  return {
    metrics: {
      grossMargin: round(grossMargin),
      ebitda: round(ebitda),
      ebit: round(ebit),
      recurringOperatingProfit: round(recurringOperatingProfit),
      profitBeforeTax: round(profitBeforeTax),
      netIncome: round(netIncome),
      caf: round(caf),
      bfRe: round(bfRe),
      bfr: round(bfr),
      deltaBfr: round(deltaBfr),
      fdr: round(fdr),
      structuralTreasury: round(structuralTreasury),
      netCash: round(netCash),
      operatingCashFlow: round(operatingCashFlow),
      investingCashFlow: round(investingCashFlow),
      financingCashFlow: round(financingCashFlow),
      netCashVariation: round(netCashVariation),
      projectedClosingCash: round(projectedClosingCash),
      freeCashFlow: round(freeCashFlow),
      reconciliationGap: round(reconciliationGap),
    },
    ratios: {
      grossMarginRate: formatPercentValue(ratio(grossMargin, revenue)),
      ebitdaMargin: formatPercentValue(ratio(ebitda, revenue)),
      netMargin: formatPercentValue(ratio(netIncome, revenue)),
      currentRatio: round(currentRatio),
      quickRatio: round(quickRatio),
      equityRatio: formatPercentValue(equityRatio),
      gearing: round(gearing),
      dso: round(dso),
      dio: round(dio),
      dpo: round(dpo),
    },
    diagnostics: [
      {
        title: 'Structure financiere',
        content: getTreasuryComment(round(structuralTreasury), round(reconciliationGap)),
      },
      {
        title: 'Liquidite',
        content: getLiquidityComment(round(currentRatio)),
      },
      {
        title: 'Cash-flow',
        content: getCashFlowComment(round(operatingCashFlow), round(freeCashFlow)),
      },
    ],
  };
}
