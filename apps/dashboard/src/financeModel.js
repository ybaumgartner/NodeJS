const DAYS_BASE = 365;

export const MIN_YEARS = 2;
export const MAX_YEARS = 5;

export const defaultCompany = {
  companyName: 'Generation Holding SA',
  sector: 'Dermatologie et produits generiques',
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

export const defaultHistoricalInputs = {
  2025: { ...defaultInputs },
  2024: {
    revenue: 204,
    purchases: 91,
    personnelExpenses: 48,
    otherOperatingExpenses: 25,
    depreciation: 10,
    financialResult: -1,
    taxExpense: 0,
    nonRecurringItems: 0,
    inventory: 57,
    receivables: 74,
    cash: 7,
    fixedAssets: 40,
    equity: 103,
    longTermDebt: 5,
    shortTermFinancialDebt: 10,
    suppliers: 39,
    otherOperatingLiabilities: 21,
    previousBfr: 40,
    openingCash: 0,
    capex: 0,
    assetDisposals: 0,
    newLongTermDebt: 0,
    debtRepayment: 0,
    capitalIncrease: 0,
    dividends: 0,
    latentReserves: 0,
    otherNonCashAdjustments: 0,
  },
};

const ratio = (numerator, denominator) =>
  denominator === 0 ? 0 : numerator / denominator;

const round = (value, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
};

const formatPercentValue = (value) => round(value * 100, 1);

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

export const cloneYearInputs = (values = defaultInputs) =>
  Object.fromEntries(
    Object.keys(defaultInputs).map((key) => [key, Number(values[key]) || 0])
  );

export const buildVisibleYears = (latestYear, yearCount) =>
  Array.from({ length: yearCount }, (_, index) => String(latestYear - index));

export const ensureYearSet = (current, years) =>
  years.reduce((accumulator, year, index) => {
    const seededYear = defaultHistoricalInputs[year];
    const fallbackYear = years[index + 1];
    const fallbackSeed = fallbackYear ? current[fallbackYear] : defaultInputs;

    accumulator[year] = cloneYearInputs(
      current[year] || seededYear || fallbackSeed || defaultInputs
    );

    return accumulator;
  }, {});

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
  const dso = ratio(receivables, revenue) * DAYS_BASE;
  const dio = ratio(inventory, purchases) * DAYS_BASE;
  const dpo = ratio(suppliers, purchases) * DAYS_BASE;

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

const computeNpv = (discountRate, cashFlows) =>
  cashFlows.reduce(
    (total, cashFlow, index) => total + cashFlow / (1 + discountRate) ** (index + 1),
    0
  );

const computeIrr = (cashFlows) => {
  const hasPositive = cashFlows.some((value) => value > 0);
  const hasNegative = cashFlows.some((value) => value < 0);

  if (!hasPositive || !hasNegative) {
    return null;
  }

  let lower = -0.95;
  let upper = 2.5;

  const npvAt = (rate) =>
    cashFlows.reduce(
      (total, cashFlow, index) => total + cashFlow / (1 + rate) ** (index + 1),
      0
    );

  let lowerValue = npvAt(lower);
  let upperValue = npvAt(upper);

  if (lowerValue * upperValue > 0) {
    return null;
  }

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (lower + upper) / 2;
    const midValue = npvAt(mid);

    if (Math.abs(midValue) < 0.0001) {
      return mid;
    }

    if (lowerValue * midValue <= 0) {
      upper = mid;
      upperValue = midValue;
    } else {
      lower = mid;
      lowerValue = midValue;
    }
  }

  return (lower + upper) / 2;
};

const getRiskLevel = (score) => {
  if (score >= 16) {
    return 'critical';
  }

  if (score >= 10) {
    return 'high';
  }

  if (score >= 6) {
    return 'moderate';
  }

  return 'low';
};

export function analyzeMarketOpportunity(marketInputs, projectInputs, scenario) {
  const totalMarketSize = Number(marketInputs.totalMarketSize) || 0;
  const dermatologyShare = (Number(marketInputs.dermatologyShare) || 0) / 100;
  const genericShare = (Number(marketInputs.genericShare) || 0) / 100;
  const marketGrowthRate = (Number(marketInputs.marketGrowthRate) || 0) / 100;
  const addressableShare = (Number(marketInputs.addressableShare) || 0) / 100;
  const targetShare = (Number(marketInputs.targetShare) || 0) / 100;
  const averagePrice = Number(marketInputs.averagePricePerTreatment) || 0;
  const years = projectInputs.years;
  const horizon = Math.max(years.length - 1, 0);
  const revenueMultiplier = Number(scenario.revenueMultiplier) || 1;

  const todayTam = totalMarketSize * dermatologyShare * genericShare;
  const futureTam = todayTam * (1 + marketGrowthRate) ** horizon;
  const sam = futureTam * addressableShare;
  const som = sam * targetShare * revenueMultiplier;
  const yearlyUnits = averagePrice === 0 ? 0 : som / averagePrice;

  return {
    tamToday: round(todayTam),
    tamAtHorizon: round(futureTam),
    sam: round(sam),
    som: round(som),
    yearlyUnits: round(yearlyUnits),
    competitorCount: Number(marketInputs.competitorCount) || 0,
    regulatoryLeadMonths: Number(marketInputs.regulatoryLeadMonths) || 0,
  };
}

export function analyzeRiskRegister(riskRegister) {
  const scoredRisks = riskRegister.map((item) => {
    const probability = Number(item.probability) || 0;
    const impact = Number(item.impact) || 0;
    const score = probability * impact;

    return {
      ...item,
      probability,
      impact,
      score,
      level: getRiskLevel(score),
    };
  });

  const totalScore = scoredRisks.reduce((sum, risk) => sum + risk.score, 0);
  const averageScore = scoredRisks.length === 0 ? 0 : totalScore / scoredRisks.length;
  const criticalCount = scoredRisks.filter((risk) => risk.level === 'critical').length;
  const highCount = scoredRisks.filter((risk) => risk.level === 'high').length;

  return {
    scoredRisks,
    totalScore: round(totalScore),
    averageScore: round(averageScore),
    criticalCount,
    highCount,
  };
}

export function analyzeProjectScenario(projectInputs, scenario) {
  const discountRate = (Number(projectInputs.discountRate) || 0) / 100;
  const taxRate = (Number(projectInputs.taxRate) || 0) / 100;
  const workingCapitalRate =
    ((Number(projectInputs.workingCapitalRate) || 0) / 100) *
    (Number(scenario.workingCapitalMultiplier) || 1);

  let previousWorkingCapital = Number(projectInputs.initialWorkingCapital) || 0;
  let cumulativeCashFlow = 0;
  let paybackYear = null;
  let peakFundingNeed = 0;

  const yearly = projectInputs.years.map((year) => {
    const baseRevenue = Number(projectInputs.revenueByYear[year]) || 0;
    const baseMargin = (Number(projectInputs.ebitdaMarginByYear[year]) || 0) / 100;
    const capex = (Number(projectInputs.capexByYear[year]) || 0) *
      (Number(scenario.capexMultiplier) || 1);
    const depreciation = Number(projectInputs.depreciationByYear[year]) || 0;
    const fixedCosts = (Number(projectInputs.fixedCostsByYear[year]) || 0) *
      (Number(scenario.opexMultiplier) || 1);
    const revenue = baseRevenue * (Number(scenario.revenueMultiplier) || 1);
    const ebitda =
      revenue * baseMargin * (Number(scenario.marginMultiplier) || 1) - fixedCosts;
    const ebit = ebitda - depreciation;
    const taxes = ebit > 0 ? ebit * taxRate : 0;
    const operatingProfitAfterTax = ebit - taxes;
    const workingCapital = revenue * workingCapitalRate;
    const deltaWorkingCapital = workingCapital - previousWorkingCapital;
    const freeCashFlow =
      operatingProfitAfterTax + depreciation - capex - deltaWorkingCapital;

    previousWorkingCapital = workingCapital;
    cumulativeCashFlow += freeCashFlow;

    if (paybackYear === null && cumulativeCashFlow >= 0) {
      paybackYear = year;
    }

    peakFundingNeed = Math.min(peakFundingNeed, cumulativeCashFlow);

    return {
      year,
      revenue: round(revenue),
      ebitda: round(ebitda),
      ebit: round(ebit),
      capex: round(capex),
      workingCapital: round(workingCapital),
      deltaWorkingCapital: round(deltaWorkingCapital),
      taxes: round(taxes),
      freeCashFlow: round(freeCashFlow),
      cumulativeCashFlow: round(cumulativeCashFlow),
    };
  });

  const cashFlows = yearly.map((row) => row.freeCashFlow);
  const npv = computeNpv(discountRate, cashFlows);
  const irr = computeIrr(cashFlows);
  const totalCapex = yearly.reduce((sum, row) => sum + row.capex, 0);
  const totalRevenue = yearly.reduce((sum, row) => sum + row.revenue, 0);
  const totalFreeCashFlow = yearly.reduce((sum, row) => sum + row.freeCashFlow, 0);
  const profitabilityIndex = totalCapex === 0 ? 0 : npv / totalCapex;
  const breakEvenYear =
    yearly.find((row) => row.freeCashFlow > 0 && row.ebitda > 0)?.year || 'Non atteint';

  return {
    yearly,
    headline: {
      npv: round(npv),
      irr: irr === null ? null : round(irr * 100, 1),
      paybackYear: paybackYear || 'Hors horizon',
      breakEvenYear,
      peakFundingNeed: round(Math.abs(peakFundingNeed)),
      totalCapex: round(totalCapex),
      totalRevenue: round(totalRevenue),
      totalFreeCashFlow: round(totalFreeCashFlow),
      profitabilityIndex: round(profitabilityIndex, 2),
    },
  };
}

export function buildExecutiveMemo({
  marketAnalysis,
  baseScenario,
  downsideScenario,
  riskAnalysis,
}) {
  const signals = [];

  if (baseScenario.headline.npv > 0) {
    signals.push('Le scenario central cree de la valeur economique.');
  } else {
    signals.push("Le scenario central ne cree pas encore suffisamment de valeur.");
  }

  if (downsideScenario.headline.npv > 0) {
    signals.push('La downside reste defendable sur l horizon analyse.');
  } else {
    signals.push('La downside detruit de la valeur et justifie des garde-fous de go/no-go.');
  }

  if (riskAnalysis.criticalCount > 0) {
    signals.push('Au moins un risque critique doit etre mitige avant engagement ferme.');
  } else if (riskAnalysis.highCount > 0) {
    signals.push('Le profil de risque reste eleve mais pilotable avec un plan de mitigation.');
  } else {
    signals.push('Le portefeuille de risques reste sous controle.');
  }

  if (marketAnalysis.som >= baseScenario.headline.totalRevenue / 2) {
    signals.push('La taille de marche accessible couvre convenablement les ambitions commerciales.');
  } else {
    signals.push('Les hypotheses commerciales paraissent exigeantes au regard du marche accessible.');
  }

  const go =
    baseScenario.headline.npv > 0 &&
    riskAnalysis.criticalCount === 0 &&
    downsideScenario.headline.npv > -0.15 * Math.abs(baseScenario.headline.npv || 1);

  return {
    recommendation: go ? 'Go sous conditions' : 'Revoir avant go',
    summary: signals,
    conditions: go
      ? [
          'Valider les hypotheses d acces au marche americain et le calendrier reglementaire.',
          'Encadrer le financement maximal via un seuil de peak funding.',
          'Suivre mensuellement les indicateurs commerciaux et le delta de BFR.',
        ]
      : [
          'Rebaser les hypotheses de revenus et de marge avant presentation au comite.',
          'Renforcer la mitigation des risques reglementaires et supply chain.',
          'Construire un plan de sortie si le break-even glisse au-dela de l horizon cible.',
        ],
  };
}
