import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  analyzeFinancials,
  defaultCompany,
  defaultHistoricalInputs,
  defaultInputs,
} from './financeModel';

const MIN_YEARS = 2;
const MAX_YEARS = 5;

const companyFields = [
  { key: 'companyName', label: 'Entreprise', type: 'text' },
  { key: 'sector', label: 'Secteur', type: 'text' },
  { key: 'currency', label: 'Devise', type: 'text' },
  { key: 'accountingFramework', label: 'Referentiel', type: 'text' },
];

const statementSections = [
  {
    title: 'Compte de resultat',
    subtitle: 'Performance economique de chaque exercice compare.',
    fields: [
      { key: 'revenue', label: "Chiffre d'affaires" },
      { key: 'purchases', label: 'Achats / couts directs' },
      { key: 'personnelExpenses', label: 'Charges de personnel' },
      { key: 'otherOperatingExpenses', label: "Autres charges d'exploitation" },
      { key: 'depreciation', label: 'Amortissements' },
      { key: 'financialResult', label: 'Resultat financier' },
      { key: 'taxExpense', label: 'Charge fiscale' },
      { key: 'nonRecurringItems', label: 'Elements non recurrents' },
    ],
  },
  {
    title: 'Bilan et cycle',
    subtitle: "Structure, liquidite et donnees d'exploitation.",
    fields: [
      { key: 'inventory', label: 'Stocks' },
      { key: 'receivables', label: 'Creances et comptes transitoires' },
      { key: 'cash', label: 'Liquidites' },
      { key: 'fixedAssets', label: 'Immobilisations' },
      { key: 'equity', label: 'Capitaux propres' },
      { key: 'longTermDebt', label: 'Dettes financieres long terme' },
      { key: 'shortTermFinancialDebt', label: 'Dettes financieres court terme' },
      { key: 'suppliers', label: 'Dettes fournisseurs' },
      { key: 'otherOperatingLiabilities', label: "Autres dettes d'exploitation" },
      { key: 'previousBfr', label: 'BFR periode precedente' },
      { key: 'openingCash', label: "Tresorerie d'ouverture" },
    ],
  },
  {
    title: 'Flux et retraitements',
    subtitle: 'Investissements, financement et ajustements non cash.',
    fields: [
      { key: 'capex', label: 'Investissements (CAPEX)' },
      { key: 'assetDisposals', label: "Cessions d'actifs" },
      { key: 'newLongTermDebt', label: 'Nouveaux emprunts LT' },
      { key: 'debtRepayment', label: "Remboursements d'emprunts" },
      { key: 'capitalIncrease', label: 'Augmentation de capital' },
      { key: 'dividends', label: 'Dividendes verses' },
      { key: 'latentReserves', label: 'Variation reserves latentes' },
      { key: 'otherNonCashAdjustments', label: 'Autres ajustements non cash' },
    ],
  },
];

const tabs = [
  { id: 'input', label: 'Saisie comparee' },
  { id: 'overview', label: 'Cockpit' },
  { id: 'standardized', label: 'Etats standardises' },
  { id: 'flows', label: 'Flux & ratios' },
  { id: 'diagnostics', label: 'Diagnostic' },
];

const cloneYearInputs = (values = defaultInputs) =>
  Object.fromEntries(
    Object.keys(defaultInputs).map((key) => [key, Number(values[key]) || 0])
  );

const buildVisibleYears = (latestYear, yearCount) =>
  Array.from({ length: yearCount }, (_, index) => String(latestYear - index));

const ensureYearSet = (current, years) =>
  years.reduce((accumulator, year, index) => {
    const seededYear = defaultHistoricalInputs[year];
    const fallbackYear = years[index + 1];
    const fallbackSeed = fallbackYear ? current[fallbackYear] : defaultInputs;

    accumulator[year] = cloneYearInputs(
      current[year] || seededYear || fallbackSeed || defaultInputs
    );

    return accumulator;
  }, {});

const formatCurrency = (value, currency) =>
  new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value) => `${value.toFixed(1)} %`;

const formatDays = (value) => `${value.toFixed(0)} j`;

function MetricCard({ label, value, tone = 'default' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function ComparativeTable({ title, years, rows, currency, note }) {
  return (
    <article className="table-card">
      <h3>{title}</h3>
      <div className="table-scroll">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Libelle</th>
              {years.map((year) => (
                <th key={year}>{year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className={row.emphasis ? `row--${row.emphasis}` : ''}>
                <td>{row.label}</td>
                {years.map((year) => (
                  <td key={`${row.label}-${year}`}>
                    {formatCurrency(row.values[year] || 0, currency)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? <p className="table-card__note">{note}</p> : null}
    </article>
  );
}

function App() {
  const [company, setCompany] = useState(defaultCompany);
  const [latestYear, setLatestYear] = useState(2025);
  const [yearCount, setYearCount] = useState(2);
  const [activeTab, setActiveTab] = useState('input');
  const [inputsByYear, setInputsByYear] = useState(() =>
    ensureYearSet(defaultHistoricalInputs, buildVisibleYears(2025, 2))
  );

  const years = useMemo(
    () => buildVisibleYears(latestYear, yearCount),
    [latestYear, yearCount]
  );

  useEffect(() => {
    setInputsByYear((current) => ensureYearSet(current, years));
  }, [years]);

  const analysesByYear = useMemo(
    () =>
      years.reduce((accumulator, year) => {
        accumulator[year] = analyzeFinancials(inputsByYear[year] || defaultInputs);
        return accumulator;
      }, {}),
    [inputsByYear, years]
  );

  const latestAnalysis = analysesByYear[years[0]];
  const latestInputs = inputsByYear[years[0]] || defaultInputs;

  const balanceRows = useMemo(
    () => [
      {
        label: 'Liquidites',
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).cash])
        ),
      },
      {
        label: 'Creances et comptes transitoires',
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).receivables])
        ),
      },
      {
        label: 'Stocks',
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).inventory])
        ),
      },
      {
        label: 'Total actifs circulants',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year] || defaultInputs).cash +
              (inputsByYear[year] || defaultInputs).receivables +
              (inputsByYear[year] || defaultInputs).inventory,
          ])
        ),
        emphasis: 'total',
      },
      {
        label: 'Immobilisations',
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).fixedAssets])
        ),
      },
      {
        label: "Total de l'actif",
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year] || defaultInputs).cash +
              (inputsByYear[year] || defaultInputs).receivables +
              (inputsByYear[year] || defaultInputs).inventory +
              (inputsByYear[year] || defaultInputs).fixedAssets,
          ])
        ),
        emphasis: 'grand-total',
      },
      {
        label: 'Dettes financieres court terme',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year] || defaultInputs).shortTermFinancialDebt,
          ])
        ),
      },
      {
        label: 'Fournisseurs',
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).suppliers])
        ),
      },
      {
        label: "Autres dettes d'exploitation",
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year] || defaultInputs).otherOperatingLiabilities,
          ])
        ),
      },
      {
        label: 'Total dettes court terme',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year] || defaultInputs).shortTermFinancialDebt +
              (inputsByYear[year] || defaultInputs).suppliers +
              (inputsByYear[year] || defaultInputs).otherOperatingLiabilities,
          ])
        ),
        emphasis: 'total',
      },
      {
        label: 'Dettes financieres long terme',
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).longTermDebt])
        ),
      },
      {
        label: 'Capitaux propres',
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).equity])
        ),
      },
      {
        label: 'Total du passif',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year] || defaultInputs).shortTermFinancialDebt +
              (inputsByYear[year] || defaultInputs).suppliers +
              (inputsByYear[year] || defaultInputs).otherOperatingLiabilities +
              (inputsByYear[year] || defaultInputs).longTermDebt +
              (inputsByYear[year] || defaultInputs).equity,
          ])
        ),
        emphasis: 'grand-total',
      },
    ],
    [inputsByYear, years]
  );

  const incomeStatementRows = useMemo(
    () => [
      {
        label: "Chiffre d'affaires",
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).revenue])
        ),
      },
      {
        label: 'Achats / couts directs',
        values: Object.fromEntries(
          years.map((year) => [year, -(inputsByYear[year] || defaultInputs).purchases])
        ),
      },
      {
        label: 'Marge brute',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.grossMargin])
        ),
        emphasis: 'total',
      },
      {
        label: 'Charges de personnel',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            -(inputsByYear[year] || defaultInputs).personnelExpenses,
          ])
        ),
      },
      {
        label: "Autres charges d'exploitation",
        values: Object.fromEntries(
          years.map((year) => [
            year,
            -(inputsByYear[year] || defaultInputs).otherOperatingExpenses,
          ])
        ),
      },
      {
        label: 'EBITDA',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.ebitda])
        ),
        emphasis: 'total',
      },
      {
        label: 'Amortissements',
        values: Object.fromEntries(
          years.map((year) => [year, -(inputsByYear[year] || defaultInputs).depreciation])
        ),
      },
      {
        label: 'Resultat operationnel courant',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.ebit])
        ),
      },
      {
        label: 'Elements non recurrents',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            -(inputsByYear[year] || defaultInputs).nonRecurringItems,
          ])
        ),
      },
      {
        label: 'Resultat financier',
        values: Object.fromEntries(
          years.map((year) => [year, (inputsByYear[year] || defaultInputs).financialResult])
        ),
      },
      {
        label: 'Resultat avant impots',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.profitBeforeTax])
        ),
      },
      {
        label: 'Charge fiscale',
        values: Object.fromEntries(
          years.map((year) => [year, -(inputsByYear[year] || defaultInputs).taxExpense])
        ),
      },
      {
        label: "Benefice de l'exercice",
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.netIncome])
        ),
        emphasis: 'grand-total',
      },
    ],
    [analysesByYear, inputsByYear, years]
  );

  const ratioRows = useMemo(
    () => [
      {
        label: 'Taux de marge brute',
        formatter: formatPercent,
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.grossMarginRate])
        ),
      },
      {
        label: 'Marge EBITDA',
        formatter: formatPercent,
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.ebitdaMargin])
        ),
      },
      {
        label: 'Marge nette',
        formatter: formatPercent,
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.netMargin])
        ),
      },
      {
        label: 'Liquidite generale',
        formatter: (value) => value.toFixed(2),
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.currentRatio])
        ),
      },
      {
        label: 'Liquidite reduite',
        formatter: (value) => value.toFixed(2),
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.quickRatio])
        ),
      },
      {
        label: 'Autonomie financiere',
        formatter: formatPercent,
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.equityRatio])
        ),
      },
      {
        label: 'Gearing',
        formatter: (value) => value.toFixed(2),
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.gearing])
        ),
      },
      {
        label: 'DSO',
        formatter: formatDays,
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.dso])
        ),
      },
      {
        label: 'DIO',
        formatter: formatDays,
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.dio])
        ),
      },
      {
        label: 'DPO',
        formatter: formatDays,
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.dpo])
        ),
      },
    ],
    [analysesByYear, years]
  );

  const flowRows = useMemo(
    () => [
      {
        label: "Cash-flow d'exploitation",
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.operatingCashFlow])
        ),
      },
      {
        label: "Flux d'investissement",
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.investingCashFlow])
        ),
      },
      {
        label: 'Flux de financement',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.financingCashFlow])
        ),
      },
      {
        label: 'Variation nette de tresorerie',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.netCashVariation])
        ),
        emphasis: 'total',
      },
      {
        label: 'Free cash flow',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.freeCashFlow])
        ),
      },
      {
        label: 'Tresorerie de cloture projetee',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].metrics.projectedClosingCash])
        ),
        emphasis: 'grand-total',
      },
    ],
    [analysesByYear, years]
  );

  const handleCompanyChange = (key, value) => {
    setCompany((current) => ({ ...current, [key]: value }));
  };

  const handleInputChange = (year, key, value) => {
    const numericValue = Number(value);

    setInputsByYear((current) => ({
      ...current,
      [year]: {
        ...(current[year] || cloneYearInputs()),
        [key]: Number.isNaN(numericValue) ? 0 : numericValue,
      },
    }));
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Finance d'entreprise</span>
          <h1>Analyse financiere multi-exercices</h1>
          <p>
            Saisissez les donnees cles sur au moins 2 ans et jusqu'a 5 ans pour
            comparer la performance, la structure financiere et les flux de
            tresorerie dans des vues distinctes.
          </p>
          <p className="hero__note">
            Les montants sont saisis en kCHF. L'onglet des etats standardises
            reprend automatiquement les donnees dans une presentation de bilan
            et compte de resultat adaptee au referentiel selectionne.
          </p>
        </div>

        <div className="hero__panel">
          <div>
            <span className="pill">Comparatif 2 a 5 ans</span>
            <span className="pill pill--accent">{company.accountingFramework}</span>
          </div>
          <h2>Lecture separee par onglets</h2>
          <p>
            La saisie, le cockpit, les etats standardises, les flux et le
            diagnostic sont maintenant dissocies pour fluidifier la lecture.
          </p>
        </div>
      </header>

      <main className="workspace">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Parametrage</span>
              <h2>Entreprise et horizon d'analyse</h2>
            </div>
            <p>Choisissez l'exercice le plus recent et le nombre d'annees comparees.</p>
          </div>

          <div className="grid-form grid-form--company">
            {companyFields.map((field) => (
              <label key={field.key} className="field">
                <span>{field.label}</span>
                <input
                  type={field.type}
                  value={company[field.key]}
                  onChange={(event) =>
                    handleCompanyChange(field.key, event.target.value)
                  }
                />
              </label>
            ))}

            <label className="field">
              <span>Exercice le plus recent</span>
              <input
                type="number"
                value={latestYear}
                onChange={(event) => setLatestYear(Number(event.target.value) || 2025)}
              />
            </label>

            <label className="field">
              <span>Nombre d'annees</span>
              <select
                value={yearCount}
                onChange={(event) =>
                  setYearCount(
                    Math.min(
                      MAX_YEARS,
                      Math.max(MIN_YEARS, Number(event.target.value) || MIN_YEARS)
                    )
                  )
                }
              >
                {[2, 3, 4, 5].map((count) => (
                  <option key={count} value={count}>
                    {count} ans
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <nav className="tabs" aria-label="Analyses financieres">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeTab === tab.id ? 'tab-button--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'input' ? (
          <section className="tab-panel">
            {statementSections.map((section) => (
              <section key={section.title} className="panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Saisie</span>
                    <h2>{section.title}</h2>
                  </div>
                  <p>{section.subtitle}</p>
                </div>

                <div className="table-scroll">
                  <table className="input-table">
                    <thead>
                      <tr>
                        <th>Libelle</th>
                        {years.map((year) => (
                          <th key={year}>{year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.fields.map((field) => (
                        <tr key={field.key}>
                          <td>{field.label}</td>
                          {years.map((year) => (
                            <td key={`${field.key}-${year}`}>
                              <input
                                type="number"
                                value={inputsByYear[year]?.[field.key] ?? 0}
                                onChange={(event) =>
                                  handleInputChange(year, field.key, event.target.value)
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
          </section>
        ) : null}

        {activeTab === 'overview' ? (
          <section className="tab-panel tab-panel--stack">
            <section className="panel panel--summary">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Cockpit</span>
                  <h2>Synthese de {years[0]}</h2>
                </div>
                <p>
                  {company.companyName} - {company.sector} - {company.accountingFramework}
                </p>
              </div>

              <div className="metric-grid">
                <MetricCard
                  label="Resultat net"
                  value={formatCurrency(latestAnalysis.metrics.netIncome, company.currency)}
                  tone={latestAnalysis.metrics.netIncome >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  label="CAF"
                  value={formatCurrency(latestAnalysis.metrics.caf, company.currency)}
                  tone={latestAnalysis.metrics.caf >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  label="FDR"
                  value={formatCurrency(latestAnalysis.metrics.fdr, company.currency)}
                  tone={latestAnalysis.metrics.fdr >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  label="BFR"
                  value={formatCurrency(latestAnalysis.metrics.bfr, company.currency)}
                  tone={
                    latestAnalysis.metrics.bfr <= latestAnalysis.metrics.fdr
                      ? 'positive'
                      : 'negative'
                  }
                />
                <MetricCard
                  label="Tresorerie structurelle"
                  value={formatCurrency(
                    latestAnalysis.metrics.structuralTreasury,
                    company.currency
                  )}
                  tone={
                    latestAnalysis.metrics.structuralTreasury >= 0
                      ? 'positive'
                      : 'negative'
                  }
                />
                <MetricCard
                  label="Free cash flow"
                  value={formatCurrency(
                    latestAnalysis.metrics.freeCashFlow,
                    company.currency
                  )}
                  tone={
                    latestAnalysis.metrics.freeCashFlow >= 0 ? 'positive' : 'negative'
                  }
                />
              </div>
            </section>

            <ComparativeTable
              title="Principaux indicateurs compares"
              years={years}
              currency={company.currency}
              rows={[
                {
                  label: "Chiffre d'affaires",
                  values: Object.fromEntries(
                    years.map((year) => [year, (inputsByYear[year] || defaultInputs).revenue])
                  ),
                },
                {
                  label: 'EBITDA',
                  values: Object.fromEntries(
                    years.map((year) => [year, analysesByYear[year].metrics.ebitda])
                  ),
                },
                {
                  label: 'Resultat net',
                  values: Object.fromEntries(
                    years.map((year) => [year, analysesByYear[year].metrics.netIncome])
                  ),
                  emphasis: 'total',
                },
                {
                  label: 'BFR',
                  values: Object.fromEntries(
                    years.map((year) => [year, analysesByYear[year].metrics.bfr])
                  ),
                },
                {
                  label: 'FDR',
                  values: Object.fromEntries(
                    years.map((year) => [year, analysesByYear[year].metrics.fdr])
                  ),
                },
                {
                  label: 'Tresorerie nette',
                  values: Object.fromEntries(
                    years.map((year) => [year, analysesByYear[year].metrics.netCash])
                  ),
                },
              ]}
            />
          </section>
        ) : null}

        {activeTab === 'standardized' ? (
          <section className="tab-panel tab-panel--stack">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Presentation normalisee</span>
                  <h2>Bilan standardise selon {company.accountingFramework}</h2>
                </div>
                <p>
                  Restitution comparative des informations renseignees pour {years.length}{' '}
                  exercices.
                </p>
              </div>

              <ComparativeTable
                title="Bilan apres retraitements"
                years={years}
                rows={balanceRows}
                currency={company.currency}
                note="Le format ventile les actifs circulants, les immobilisations, les dettes a court et long terme ainsi que les capitaux propres en reprenant le referentiel renseigne."
              />
            </section>

            <ComparativeTable
              title="Compte de resultat standardise"
              years={years}
              rows={incomeStatementRows}
              currency={company.currency}
            />
          </section>
        ) : null}

        {activeTab === 'flows' ? (
          <section className="tab-panel tab-panel--split">
            <ComparativeTable
              title="Tableau de flux compare"
              years={years}
              rows={flowRows}
              currency={company.currency}
            />

            <article className="table-card">
              <h3>Ratios d'analyse</h3>
              <div className="table-scroll">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Ratio</th>
                      {years.map((year) => (
                        <th key={year}>{year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ratioRows.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label}</td>
                        {years.map((year) => (
                          <td key={`${row.label}-${year}`}>
                            {row.formatter(row.values[year] || 0)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        ) : null}

        {activeTab === 'diagnostics' ? (
          <section className="tab-panel tab-panel--split">
            <section className="panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Diagnostic</span>
                  <h2>Commentaires par exercice</h2>
                </div>
              </div>

              <div className="year-diagnostics">
                {years.map((year) => (
                  <article key={year} className="diagnostic-year">
                    <div className="diagnostic-year__header">
                      <h3>{year}</h3>
                      <span className="pill pill--soft">
                        {formatCurrency(
                          analysesByYear[year].metrics.netIncome,
                          company.currency
                        )}
                      </span>
                    </div>

                    <div className="diagnostic-list">
                      {analysesByYear[year].diagnostics.map((item) => (
                        <article key={`${year}-${item.title}`} className="diagnostic-card">
                          <h4>{item.title}</h4>
                          <p>{item.content}</p>
                        </article>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="panel">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">Controle</span>
                  <h2>Coherence {years[0]}</h2>
                </div>
              </div>

              <div className="checkpoint">
                <h3>Reconciliation de tresorerie</h3>
                <p>
                  Ecart entre tresorerie structurelle et tresorerie nette:
                  <strong>
                    {' '}
                    {formatCurrency(
                      latestAnalysis.metrics.reconciliationGap,
                      company.currency
                    )}
                  </strong>
                </p>
                <p>
                  Tresorerie de cloture projetee par le TFT:
                  <strong>
                    {' '}
                    {formatCurrency(
                      latestAnalysis.metrics.projectedClosingCash,
                      company.currency
                    )}
                  </strong>
                </p>
                <p>
                  Tresorerie de bilan:
                  <strong> {formatCurrency(latestInputs.cash, company.currency)}</strong>
                </p>
              </div>
            </aside>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default App;
