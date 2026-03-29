import { useEffect, useMemo, useState } from 'react';
import './App.css';
import {
  analyzeFinancials,
  analyzeMarketOpportunity,
  analyzeProjectScenario,
  analyzeRiskRegister,
  buildExecutiveMemo,
  buildVisibleYears,
  cloneYearInputs,
  ensureYearSet,
  MAX_YEARS,
  MIN_YEARS,
  defaultInputs,
} from './financeModel';
import {
  companyFields,
  historicalSections,
  mandateCatalog,
  marketFields,
  projectFields,
  scenarioFields,
  yearlyProjectFieldGroups,
} from './mandateCatalog';

const tabs = [
  { id: 'brief', label: 'Mandat' },
  { id: 'group', label: 'Groupe' },
  { id: 'project', label: 'Projet USA' },
  { id: 'market', label: 'Marche & risques' },
  { id: 'memo', label: 'Memo executif' },
];

const formatCurrency = (value, currency) =>
  new Intl.NumberFormat('fr-CH', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value) => `${Number(value || 0).toFixed(1)} %`;
const formatMultiple = (value) => `${Number(value || 0).toFixed(2)}x`;
const formatDays = (value) => `${Number(value || 0).toFixed(0)} j`;

function MetricCard({ label, value, tone = 'default', caption }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {caption ? <span>{caption}</span> : null}
    </article>
  );
}

function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {text ? <p>{text}</p> : null}
    </div>
  );
}

function ComparativeTable({ title, years, rows, currency, note, formatters = {} }) {
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
                {years.map((year) => {
                  const formatter = formatters[row.label];
                  const value = row.values[year] || 0;
                  return (
                    <td key={`${row.label}-${year}`}>
                      {formatter ? formatter(value) : formatCurrency(value, currency)}
                    </td>
                  );
                })}
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
  const [selectedMandateId, setSelectedMandateId] = useState(mandateCatalog[0].id);
  const selectedMandate = useMemo(
    () => mandateCatalog.find((mandate) => mandate.id === selectedMandateId) || mandateCatalog[0],
    [selectedMandateId]
  );

  const [company, setCompany] = useState(selectedMandate.company);
  const [latestYear, setLatestYear] = useState(selectedMandate.latestYear);
  const [yearCount, setYearCount] = useState(selectedMandate.yearCount);
  const [marketInputs, setMarketInputs] = useState(selectedMandate.marketInputs);
  const [projectInputs, setProjectInputs] = useState(selectedMandate.projectInputs);
  const [scenarioInputs, setScenarioInputs] = useState(selectedMandate.scenarios);
  const [riskRegister, setRiskRegister] = useState(selectedMandate.riskRegister);
  const [checklist, setChecklist] = useState(selectedMandate.checklist);
  const [activeTab, setActiveTab] = useState('brief');
  const [inputsByYear, setInputsByYear] = useState(() =>
    ensureYearSet(
      selectedMandate.historicalInputs,
      buildVisibleYears(selectedMandate.latestYear, selectedMandate.yearCount)
    )
  );

  useEffect(() => {
    setCompany(selectedMandate.company);
    setLatestYear(selectedMandate.latestYear);
    setYearCount(selectedMandate.yearCount);
    setMarketInputs(selectedMandate.marketInputs);
    setProjectInputs(selectedMandate.projectInputs);
    setScenarioInputs(selectedMandate.scenarios);
    setRiskRegister(selectedMandate.riskRegister);
    setChecklist(selectedMandate.checklist);
    setInputsByYear(
      ensureYearSet(
        selectedMandate.historicalInputs,
        buildVisibleYears(selectedMandate.latestYear, selectedMandate.yearCount)
      )
    );
    setActiveTab('brief');
  }, [selectedMandate]);

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

  const groupLatestAnalysis = analysesByYear[years[0]];
  const riskAnalysis = useMemo(() => analyzeRiskRegister(riskRegister), [riskRegister]);

  const projectAnalyses = useMemo(
    () =>
      Object.entries(scenarioInputs).reduce((accumulator, [scenarioId, scenario]) => {
        accumulator[scenarioId] = analyzeProjectScenario(projectInputs, scenario);
        return accumulator;
      }, {}),
    [projectInputs, scenarioInputs]
  );

  const marketAnalyses = useMemo(
    () =>
      Object.entries(scenarioInputs).reduce((accumulator, [scenarioId, scenario]) => {
        accumulator[scenarioId] = analyzeMarketOpportunity(
          marketInputs,
          projectInputs,
          scenario
        );
        return accumulator;
      }, {}),
    [marketInputs, projectInputs, scenarioInputs]
  );

  const executiveMemo = useMemo(
    () =>
      buildExecutiveMemo({
        marketAnalysis: marketAnalyses.base,
        baseScenario: projectAnalyses.base,
        downsideScenario: projectAnalyses.downside,
        riskAnalysis,
      }),
    [marketAnalyses, projectAnalyses, riskAnalysis]
  );

  const balanceRows = useMemo(
    () => [
      {
        label: 'Liquidites',
        values: Object.fromEntries(years.map((year) => [year, inputsByYear[year]?.cash || 0])),
      },
      {
        label: 'Creances et comptes transitoires',
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.receivables || 0])
        ),
      },
      {
        label: 'Stocks',
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.inventory || 0])
        ),
      },
      {
        label: 'Total actifs circulants',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year]?.cash || 0) +
              (inputsByYear[year]?.receivables || 0) +
              (inputsByYear[year]?.inventory || 0),
          ])
        ),
        emphasis: 'total',
      },
      {
        label: 'Immobilisations',
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.fixedAssets || 0])
        ),
      },
      {
        label: "Total de l'actif",
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year]?.cash || 0) +
              (inputsByYear[year]?.receivables || 0) +
              (inputsByYear[year]?.inventory || 0) +
              (inputsByYear[year]?.fixedAssets || 0),
          ])
        ),
        emphasis: 'grand-total',
      },
      {
        label: 'Dettes financieres court terme',
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.shortTermFinancialDebt || 0])
        ),
      },
      {
        label: 'Fournisseurs',
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.suppliers || 0])
        ),
      },
      {
        label: "Autres dettes d'exploitation",
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.otherOperatingLiabilities || 0])
        ),
      },
      {
        label: 'Total dettes court terme',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year]?.shortTermFinancialDebt || 0) +
              (inputsByYear[year]?.suppliers || 0) +
              (inputsByYear[year]?.otherOperatingLiabilities || 0),
          ])
        ),
        emphasis: 'total',
      },
      {
        label: 'Dettes financieres long terme',
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.longTermDebt || 0])
        ),
      },
      {
        label: 'Capitaux propres',
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.equity || 0])
        ),
      },
      {
        label: 'Total du passif',
        values: Object.fromEntries(
          years.map((year) => [
            year,
            (inputsByYear[year]?.shortTermFinancialDebt || 0) +
              (inputsByYear[year]?.suppliers || 0) +
              (inputsByYear[year]?.otherOperatingLiabilities || 0) +
              (inputsByYear[year]?.longTermDebt || 0) +
              (inputsByYear[year]?.equity || 0),
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
        values: Object.fromEntries(years.map((year) => [year, inputsByYear[year]?.revenue || 0])),
      },
      {
        label: 'Achats / couts directs',
        values: Object.fromEntries(
          years.map((year) => [year, -(inputsByYear[year]?.purchases || 0)])
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
          years.map((year) => [year, -(inputsByYear[year]?.personnelExpenses || 0)])
        ),
      },
      {
        label: "Autres charges d'exploitation",
        values: Object.fromEntries(
          years.map((year) => [year, -(inputsByYear[year]?.otherOperatingExpenses || 0)])
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
          years.map((year) => [year, -(inputsByYear[year]?.depreciation || 0)])
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
          years.map((year) => [year, -(inputsByYear[year]?.nonRecurringItems || 0)])
        ),
      },
      {
        label: 'Resultat financier',
        values: Object.fromEntries(
          years.map((year) => [year, inputsByYear[year]?.financialResult || 0])
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
          years.map((year) => [year, -(inputsByYear[year]?.taxExpense || 0)])
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
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.grossMarginRate])
        ),
      },
      {
        label: 'Marge EBITDA',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.ebitdaMargin])
        ),
      },
      {
        label: 'Marge nette',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.netMargin])
        ),
      },
      {
        label: 'Liquidite generale',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.currentRatio])
        ),
      },
      {
        label: 'Liquidite reduite',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.quickRatio])
        ),
      },
      {
        label: 'Autonomie financiere',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.equityRatio])
        ),
      },
      {
        label: 'Gearing',
        values: Object.fromEntries(
          years.map((year) => [year, analysesByYear[year].ratios.gearing])
        ),
      },
      {
        label: 'DSO',
        values: Object.fromEntries(years.map((year) => [year, analysesByYear[year].ratios.dso])),
      },
      {
        label: 'DIO',
        values: Object.fromEntries(years.map((year) => [year, analysesByYear[year].ratios.dio])),
      },
      {
        label: 'DPO',
        values: Object.fromEntries(years.map((year) => [year, analysesByYear[year].ratios.dpo])),
      },
    ],
    [analysesByYear, years]
  );

  const handleCompanyChange = (key, value) => {
    setCompany((current) => ({ ...current, [key]: value }));
  };

  const handleHistoricalInputChange = (year, key, value) => {
    const numericValue = Number(value);

    setInputsByYear((current) => ({
      ...current,
      [year]: {
        ...(current[year] || cloneYearInputs()),
        [key]: Number.isNaN(numericValue) ? 0 : numericValue,
      },
    }));
  };

  const handleMarketInputChange = (key, value) => {
    const nextValue = marketFields.find((field) => field.key === key)?.type === 'number'
      ? Number(value) || 0
      : value;
    setMarketInputs((current) => ({ ...current, [key]: nextValue }));
  };

  const handleProjectInputChange = (key, value) => {
    const nextValue = projectFields.find((field) => field.key === key)?.type === 'number'
      ? Number(value) || 0
      : value;
    setProjectInputs((current) => ({ ...current, [key]: nextValue }));
  };

  const handleProjectYearValueChange = (groupKey, year, value) => {
    setProjectInputs((current) => ({
      ...current,
      [groupKey]: {
        ...current[groupKey],
        [year]: Number(value) || 0,
      },
    }));
  };

  const handleScenarioChange = (scenarioId, key, value) => {
    setScenarioInputs((current) => ({
      ...current,
      [scenarioId]: {
        ...current[scenarioId],
        [key]: Number(value) || 0,
      },
    }));
  };

  const toggleChecklist = (itemId) => {
    setChecklist((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      )
    );
  };

  const updateRisk = (riskId, key, value) => {
    setRiskRegister((current) =>
      current.map((risk) =>
        risk.id === riskId
          ? {
              ...risk,
              [key]: key === 'probability' || key === 'impact' ? Number(value) || 0 : value,
            }
          : risk
      )
    );
  };

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Mandat finance</span>
          <h1>Studio de traitement des mandats financiers</h1>
          <p>{selectedMandate.context}</p>
          <p className="hero__note">
            Cette structure combine data room, analyse du groupe, modelisation projet,
            registre des risques et memo executif afin de pouvoir reutiliser l application
            sur d autres mandats sans repartir de zero.
          </p>
        </div>

        <div className="hero__panel">
          <div>
            <span className="pill">Mandat standardisable</span>
            <span className="pill pill--accent">{selectedMandate.label}</span>
          </div>
          <h2>Vue integrale d un mandat</h2>
          <p>
            Le mandat 2 du cas Generation Holding SA sert ici de preset de depart:
            marche dermatologique, projet USA, scenarios financiers, risques et
            recommandation.
          </p>
          <label className="field">
            <span>Mandat actif</span>
            <select
              value={selectedMandateId}
              onChange={(event) => setSelectedMandateId(event.target.value)}
            >
              {mandateCatalog.map((mandate) => (
                <option key={mandate.id} value={mandate.id}>
                  {mandate.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <main className="workspace">
        <section className="panel">
          <SectionTitle
            eyebrow="Parametrage"
            title="Contexte general"
            text="Les donnees se modifient directement dans l interface. La structure reste la meme pour d autres mandats, seuls les presets changent."
          />

          <div className="grid-form grid-form--company">
            {companyFields.map((field) => (
              <label key={field.key} className="field">
                <span>{field.label}</span>
                <input
                  type={field.type}
                  value={company[field.key]}
                  onChange={(event) => handleCompanyChange(field.key, event.target.value)}
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
              <span>Nombre d annees comparees</span>
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

        <nav className="tabs" aria-label="Onglets du mandat">
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

        {activeTab === 'brief' ? (
          <section className="tab-panel tab-panel--stack">
            <section className="panel">
              <SectionTitle
                eyebrow="Mandat"
                title="Objectifs et livrables"
                text="Le mandat 2 demande une lecture conjointe du marche, du projet USA et des risques. Cette page sert de feuille de route."
              />

              <div className="content-grid">
                <article className="info-card">
                  <h3>Objectifs</h3>
                  <ul className="plain-list">
                    {selectedMandate.objectives.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>

                <article className="info-card">
                  <h3>Livrables attendus</h3>
                  <ul className="plain-list">
                    {selectedMandate.deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              </div>
            </section>

            <section className="panel">
              <SectionTitle
                eyebrow="Pilotage"
                title="Checklist de traitement"
                text="Les cases permettent de suivre la progression du mandat et restent adaptables a d autres contextes."
              />

              <div className="checklist-grid">
                {checklist.map((item) => (
                  <label key={item.id} className={`check-card ${item.done ? 'check-card--done' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklist(item.id)}
                    />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.owner}</span>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            <section className="panel panel--summary">
              <SectionTitle
                eyebrow="Synthese rapide"
                title="Vue instantanee du mandat"
                text="Indicateurs clefs du groupe, du projet et du risque pour orienter la lecture."
              />

              <div className="metric-grid metric-grid--four">
                <MetricCard
                  label="Resultat net groupe"
                  value={formatCurrency(groupLatestAnalysis.metrics.netIncome, company.currency)}
                  tone={groupLatestAnalysis.metrics.netIncome >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  label="NPV scenario base"
                  value={formatCurrency(projectAnalyses.base.headline.npv, projectInputs.currency)}
                  tone={projectAnalyses.base.headline.npv >= 0 ? 'positive' : 'negative'}
                />
                <MetricCard
                  label="Peak funding"
                  value={formatCurrency(
                    projectAnalyses.base.headline.peakFundingNeed,
                    projectInputs.currency
                  )}
                  tone="warning"
                />
                <MetricCard
                  label="Recommandation"
                  value={executiveMemo.recommendation}
                  tone={executiveMemo.recommendation.includes('Go') ? 'positive' : 'negative'}
                />
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'group' ? (
          <section className="tab-panel tab-panel--stack">
            {historicalSections.map((section) => (
              <section key={section.title} className="panel">
                <SectionTitle
                  eyebrow="Donnees groupe"
                  title={section.title}
                  text={section.subtitle}
                />

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
                                  handleHistoricalInputChange(
                                    year,
                                    field.key,
                                    event.target.value
                                  )
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

            <section className="tab-panel tab-panel--split">
              <ComparativeTable
                title="Bilan standardise"
                years={years}
                rows={balanceRows}
                currency={company.currency}
              />
              <ComparativeTable
                title="Compte de resultat standardise"
                years={years}
                rows={incomeStatementRows}
                currency={company.currency}
              />
            </section>

            <ComparativeTable
              title="Ratios groupe"
              years={years}
              rows={ratioRows}
              currency={company.currency}
              formatters={{
                'Taux de marge brute': formatPercent,
                'Marge EBITDA': formatPercent,
                'Marge nette': formatPercent,
                'Liquidite generale': (value) => Number(value).toFixed(2),
                'Liquidite reduite': (value) => Number(value).toFixed(2),
                'Autonomie financiere': formatPercent,
                Gearing: (value) => Number(value).toFixed(2),
                DSO: formatDays,
                DIO: formatDays,
                DPO: formatDays,
              }}
            />
          </section>
        ) : null}

        {activeTab === 'project' ? (
          <section className="tab-panel tab-panel--stack">
            <section className="panel">
              <SectionTitle
                eyebrow="Projet"
                title="Cadrage du projet USA"
                text="Le projet est modele avec des drivers standards: horizon, revenus, marges, capex, depreciation, frais fixes et scenarios."
              />

              <div className="grid-form">
                {projectFields.map((field) => (
                  <label key={field.key} className="field">
                    <span>{field.label}</span>
                    <input
                      type={field.type}
                      value={projectInputs[field.key]}
                      onChange={(event) =>
                        handleProjectInputChange(field.key, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="panel">
              <SectionTitle
                eyebrow="Drivers"
                title="Hypotheses annuelles"
                text="Chaque bloc represente une table standardisee que vous pourrez reutiliser sur d autres mandats d investissement."
              />

              <div className="table-stack">
                {yearlyProjectFieldGroups.map((group) => (
                  <article key={group.key} className="table-card">
                    <h3>{group.title}</h3>
                    <div className="table-scroll">
                      <table className="input-table">
                        <thead>
                          <tr>
                            {projectInputs.years.map((year) => (
                              <th key={year}>{year}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            {projectInputs.years.map((year) => (
                              <td key={`${group.key}-${year}`}>
                                <label className="field">
                                  <span>
                                    {group.prefix}
                                    {year}
                                    {group.suffix || ''}
                                  </span>
                                  <input
                                    type="number"
                                    value={projectInputs[group.key][year]}
                                    onChange={(event) =>
                                      handleProjectYearValueChange(
                                        group.key,
                                        year,
                                        event.target.value
                                      )
                                    }
                                  />
                                </label>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <SectionTitle
                eyebrow="Scenarios"
                title="Sensibilites standardisees"
                text="Les scenarios jouent sur le chiffre d affaires, la marge, les opex, le capex et le BFR."
              />

              <div className="scenario-grid">
                {Object.entries(scenarioInputs).map(([scenarioId, scenario]) => (
                  <article key={scenarioId} className="info-card">
                    <h3>{scenario.label}</h3>
                    <div className="field-stack">
                      {scenarioFields.map((field) => (
                        <label key={`${scenarioId}-${field.key}`} className="field">
                          <span>{field.label}</span>
                          <input
                            type={field.type}
                            step={field.step}
                            value={scenario[field.key]}
                            onChange={(event) =>
                              handleScenarioChange(scenarioId, field.key, event.target.value)
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <SectionTitle
                eyebrow="Valorisation"
                title="Lecture comparative des scenarios"
                text="Le tableau et les cartes ci-dessous suffisent pour traiter un mandat d investissement similaire."
              />

              <div className="metric-grid metric-grid--three">
                {Object.entries(projectAnalyses).map(([scenarioId, analysis]) => (
                  <MetricCard
                    key={scenarioId}
                    label={`NPV ${scenarioInputs[scenarioId].label}`}
                    value={formatCurrency(analysis.headline.npv, projectInputs.currency)}
                    tone={analysis.headline.npv >= 0 ? 'positive' : 'negative'}
                    caption={`Payback: ${analysis.headline.paybackYear}`}
                  />
                ))}
              </div>

              <div className="table-scroll">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Scenario</th>
                      <th>NPV</th>
                      <th>IRR</th>
                      <th>Payback</th>
                      <th>Break-even</th>
                      <th>Peak funding</th>
                      <th>PI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(projectAnalyses).map(([scenarioId, analysis]) => (
                      <tr key={scenarioId}>
                        <td>{scenarioInputs[scenarioId].label}</td>
                        <td>{formatCurrency(analysis.headline.npv, projectInputs.currency)}</td>
                        <td>
                          {analysis.headline.irr === null
                            ? 'n/a'
                            : formatPercent(analysis.headline.irr)}
                        </td>
                        <td>{analysis.headline.paybackYear}</td>
                        <td>{analysis.headline.breakEvenYear}</td>
                        <td>
                          {formatCurrency(
                            analysis.headline.peakFundingNeed,
                            projectInputs.currency
                          )}
                        </td>
                        <td>{formatMultiple(analysis.headline.profitabilityIndex)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <ComparativeTable
              title="Free cash-flow du scenario base"
              years={projectInputs.years}
              currency={projectInputs.currency}
              rows={[
                {
                  label: 'Revenus',
                  values: Object.fromEntries(
                    projectAnalyses.base.yearly.map((row) => [row.year, row.revenue])
                  ),
                },
                {
                  label: 'EBITDA',
                  values: Object.fromEntries(
                    projectAnalyses.base.yearly.map((row) => [row.year, row.ebitda])
                  ),
                },
                {
                  label: 'CAPEX',
                  values: Object.fromEntries(
                    projectAnalyses.base.yearly.map((row) => [row.year, -row.capex])
                  ),
                },
                {
                  label: 'Delta BFR',
                  values: Object.fromEntries(
                    projectAnalyses.base.yearly.map((row) => [row.year, -row.deltaWorkingCapital])
                  ),
                },
                {
                  label: 'Free cash-flow',
                  values: Object.fromEntries(
                    projectAnalyses.base.yearly.map((row) => [row.year, row.freeCashFlow])
                  ),
                  emphasis: 'grand-total',
                },
              ]}
            />
          </section>
        ) : null}

        {activeTab === 'market' ? (
          <section className="tab-panel tab-panel--stack">
            <section className="panel">
              <SectionTitle
                eyebrow="Marche"
                title="Hypotheses de marche"
                text="Bloc reutilisable pour les mandats de croissance externe, lancement geographique ou nouvelle ligne de produits."
              />

              <div className="grid-form">
                {marketFields.map((field) => (
                  <label key={field.key} className="field">
                    <span>{field.label}</span>
                    <input
                      type={field.type}
                      value={marketInputs[field.key]}
                      onChange={(event) =>
                        handleMarketInputChange(field.key, event.target.value)
                      }
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="tab-panel tab-panel--split">
              <section className="panel panel--summary">
                <SectionTitle
                  eyebrow="Opportunite"
                  title="Synthese de marche"
                  text="Lecture TAM / SAM / SOM pour le scenario central."
                />

                <div className="metric-grid metric-grid--four">
                  <MetricCard
                    label="TAM aujourd hui"
                    value={formatCurrency(marketAnalyses.base.tamToday, projectInputs.currency)}
                    tone="default"
                  />
                  <MetricCard
                    label="TAM a l horizon"
                    value={formatCurrency(
                      marketAnalyses.base.tamAtHorizon,
                      projectInputs.currency
                    )}
                    tone="default"
                  />
                  <MetricCard
                    label="SAM"
                    value={formatCurrency(marketAnalyses.base.sam, projectInputs.currency)}
                    tone="positive"
                  />
                  <MetricCard
                    label="SOM vise"
                    value={formatCurrency(marketAnalyses.base.som, projectInputs.currency)}
                    tone="positive"
                    caption={`${marketAnalyses.base.yearlyUnits.toFixed(0)} traitements / an`}
                  />
                </div>
              </section>

              <section className="panel">
                <SectionTitle
                  eyebrow="Risque"
                  title="Heatmap du registre"
                  text="Chaque risque est note de 1 a 5 en probabilite et en impact."
                />

                <div className="metric-grid metric-grid--three">
                  <MetricCard
                    label="Score moyen"
                    value={riskAnalysis.averageScore.toFixed(1)}
                    tone="warning"
                  />
                  <MetricCard
                    label="Risques critiques"
                    value={String(riskAnalysis.criticalCount)}
                    tone={riskAnalysis.criticalCount > 0 ? 'negative' : 'positive'}
                  />
                  <MetricCard
                    label="Risques eleves"
                    value={String(riskAnalysis.highCount)}
                    tone={riskAnalysis.highCount > 0 ? 'warning' : 'positive'}
                  />
                </div>
              </section>
            </section>

            <section className="panel">
              <SectionTitle
                eyebrow="Registre"
                title="Risques et mitigations"
                text="Le tableau reste modifiable et peut etre adapte a n importe quel mandat."
              />

              <div className="table-scroll">
                <table className="comparison-table risk-table">
                  <thead>
                    <tr>
                      <th>Risque</th>
                      <th>Categorie</th>
                      <th>Prob.</th>
                      <th>Impact</th>
                      <th>Score</th>
                      <th>Owner</th>
                      <th>Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskAnalysis.scoredRisks.map((risk) => (
                      <tr key={risk.id} className={`risk-row risk-row--${risk.level}`}>
                        <td>{risk.title}</td>
                        <td>{risk.category}</td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={risk.probability}
                            onChange={(event) =>
                              updateRisk(risk.id, 'probability', event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={risk.impact}
                            onChange={(event) =>
                              updateRisk(risk.id, 'impact', event.target.value)
                            }
                          />
                        </td>
                        <td>{risk.score}</td>
                        <td>
                          <input
                            type="text"
                            value={risk.owner}
                            onChange={(event) =>
                              updateRisk(risk.id, 'owner', event.target.value)
                            }
                          />
                        </td>
                        <td>
                          <textarea
                            value={risk.mitigation}
                            onChange={(event) =>
                              updateRisk(risk.id, 'mitigation', event.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'memo' ? (
          <section className="tab-panel tab-panel--stack">
            <section className="panel panel--summary">
              <SectionTitle
                eyebrow="Memo"
                title="Recommandation executif"
                text="Restitution standardisee pour comite de direction ou comite d investissement."
              />

              <div className="memo-header">
                <MetricCard
                  label="Conclusion"
                  value={executiveMemo.recommendation}
                  tone={executiveMemo.recommendation.includes('Go') ? 'positive' : 'negative'}
                />
                <div className="info-card info-card--highlight">
                  <h3>Position de synthese</h3>
                  <p>
                    Projet {projectInputs.projectName} en {projectInputs.currency}, sponsorise
                    par {projectInputs.sponsor}. Le scenario base affiche une NPV de{' '}
                    {formatCurrency(projectAnalyses.base.headline.npv, projectInputs.currency)} et
                    un payback {projectAnalyses.base.headline.paybackYear}.
                  </p>
                </div>
              </div>
            </section>

            <section className="content-grid">
              <article className="info-card">
                <h3>Messages clefs</h3>
                <ul className="plain-list">
                  {executiveMemo.summary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="info-card">
                <h3>Conditions de decision</h3>
                <ul className="plain-list">
                  {executiveMemo.conditions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </section>

            <section className="tab-panel tab-panel--split">
              <article className="table-card">
                <h3>Base case</h3>
                <div className="kv-list">
                  <div>
                    <span>NPV</span>
                    <strong>{formatCurrency(projectAnalyses.base.headline.npv, projectInputs.currency)}</strong>
                  </div>
                  <div>
                    <span>IRR</span>
                    <strong>
                      {projectAnalyses.base.headline.irr === null
                        ? 'n/a'
                        : formatPercent(projectAnalyses.base.headline.irr)}
                    </strong>
                  </div>
                  <div>
                    <span>Peak funding</span>
                    <strong>
                      {formatCurrency(
                        projectAnalyses.base.headline.peakFundingNeed,
                        projectInputs.currency
                      )}
                    </strong>
                  </div>
                  <div>
                    <span>Break-even</span>
                    <strong>{projectAnalyses.base.headline.breakEvenYear}</strong>
                  </div>
                </div>
              </article>

              <article className="table-card">
                <h3>Points d attention</h3>
                <div className="kv-list">
                  <div>
                    <span>Lead time reglementaire</span>
                    <strong>{marketInputs.regulatoryLeadMonths} mois</strong>
                  </div>
                  <div>
                    <span>Concurrents clefs</span>
                    <strong>{marketInputs.competitorCount}</strong>
                  </div>
                  <div>
                    <span>Risques critiques</span>
                    <strong>{riskAnalysis.criticalCount}</strong>
                  </div>
                  <div>
                    <span>BFR cible</span>
                    <strong>{projectInputs.workingCapitalRate} % du CA</strong>
                  </div>
                </div>
              </article>
            </section>
          </section>
        ) : null}
      </main>
    </div>
  );
}

export default App;
