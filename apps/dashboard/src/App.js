import { useMemo, useState } from 'react';
import './App.css';
import {
  analyzeFinancials,
  defaultCompany,
  defaultInputs,
} from './financeModel';

const companyFields = [
  { key: 'companyName', label: 'Entreprise', type: 'text' },
  { key: 'sector', label: 'Secteur', type: 'text' },
  { key: 'fiscalYear', label: 'Exercice', type: 'text' },
  { key: 'currency', label: 'Devise', type: 'text' },
  { key: 'accountingFramework', label: 'Referentiel', type: 'text' },
];

const statementSections = [
  {
    title: 'Compte de resultat',
    subtitle: 'Performance, CAF et lecture economique de la periode.',
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
    subtitle: 'Structure des emplois et ressources et analyse du BFR.',
    fields: [
      { key: 'inventory', label: 'Stocks' },
      { key: 'receivables', label: 'Creances clients' },
      { key: 'cash', label: 'Tresorerie active' },
      { key: 'fixedAssets', label: 'Actif immobilise' },
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
    subtitle: 'TFT/TFF, reserves latentes et pont de cash.',
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

function App() {
  const [company, setCompany] = useState(defaultCompany);
  const [inputs, setInputs] = useState(defaultInputs);
  const analysis = useMemo(() => analyzeFinancials(inputs), [inputs]);

  const handleCompanyChange = (key, value) => {
    setCompany((current) => ({ ...current, [key]: value }));
  };

  const handleInputChange = (key, value) => {
    const numericValue = Number(value);

    setInputs((current) => ({
      ...current,
      [key]: Number.isNaN(numericValue) ? 0 : numericValue,
    }));
  };

  const { metrics, ratios, diagnostics } = analysis;

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Finance d'entreprise</span>
          <h1>Studio professionnel d'analyse financiere</h1>
          <p>
            Saisissez les donnees cles d'une entreprise et obtenez un
            diagnostic structure, liquidite, cash-flow et TFT aligne sur les
            notions du cours: Bilan, CDR, FDR, BFR, BFRE, CAF, TFT/TFF et free
            cash flow.
          </p>
          <p className="hero__note">
            Exemple precharge: compte 2025 d'Optimus SA. Tous les montants sont
            saisis en kCHF et les valeurs d'ouverture reprennent 2024.
          </p>
        </div>

        <div className="hero__panel">
          <div>
            <span className="pill">MVP exploitable</span>
            <span className="pill pill--accent">CO / Swiss GAAP</span>
          </div>
          <h2>Diagnostic instantane</h2>
          <p>
            Le moteur recalcule chaque indicateur a la vollee et fournit des
            commentaires de lecture pour faciliter l'analyse financiere.
          </p>
        </div>
      </header>

      <main className="workspace">
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">1. Referentiel</span>
              <h2>Fiche entreprise</h2>
            </div>
            <p>Montants d'exemple saisis en kCHF.</p>
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
          </div>
        </section>

        <section className="panel panel--summary">
          <div className="section-heading">
            <div>
              <span className="eyebrow">2. Cockpit</span>
              <h2>Synthese executif</h2>
            </div>
            <p>
              {company.companyName} - {company.fiscalYear} - {company.sector}
            </p>
          </div>

          <div className="metric-grid">
            <MetricCard
              label="Resultat net"
              value={formatCurrency(metrics.netIncome, company.currency)}
              tone={metrics.netIncome >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="CAF"
              value={formatCurrency(metrics.caf, company.currency)}
              tone={metrics.caf >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="FDR"
              value={formatCurrency(metrics.fdr, company.currency)}
              tone={metrics.fdr >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="BFR"
              value={formatCurrency(metrics.bfr, company.currency)}
              tone={metrics.bfr <= metrics.fdr ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Tresorerie structurelle"
              value={formatCurrency(metrics.structuralTreasury, company.currency)}
              tone={metrics.structuralTreasury >= 0 ? 'positive' : 'negative'}
            />
            <MetricCard
              label="Free cash flow"
              value={formatCurrency(metrics.freeCashFlow, company.currency)}
              tone={metrics.freeCashFlow >= 0 ? 'positive' : 'negative'}
            />
          </div>
        </section>

        <section className="data-layout">
          <div className="data-layout__forms">
            {statementSections.map((section) => (
              <section key={section.title} className="panel">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">Saisie</span>
                    <h2>{section.title}</h2>
                  </div>
                  <p>{section.subtitle}</p>
                </div>

                <div className="grid-form">
                  {section.fields.map((field) => (
                    <label key={field.key} className="field">
                      <span>{field.label}</span>
                      <input
                        type="number"
                        value={inputs[field.key]}
                        onChange={(event) =>
                          handleInputChange(field.key, event.target.value)
                        }
                      />
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="panel panel--sticky">
            <div className="section-heading">
              <div>
                <span className="eyebrow">3. Lecture</span>
                <h2>Commentaires de diagnostic</h2>
              </div>
            </div>

            <div className="diagnostic-list">
              {diagnostics.map((item) => (
                <article key={item.title} className="diagnostic-card">
                  <h3>{item.title}</h3>
                  <p>{item.content}</p>
                </article>
              ))}
            </div>

            <div className="checkpoint">
              <h3>Controle de coherence</h3>
              <p>
                Ecart entre tresorerie structurelle et tresorerie nette:
                <strong>
                  {' '}
                  {formatCurrency(metrics.reconciliationGap, company.currency)}
                </strong>
              </p>
              <p>
                Tresorerie de cloture projetee par le TFT:
                <strong>
                  {' '}
                  {formatCurrency(metrics.projectedClosingCash, company.currency)}
                </strong>
              </p>
            </div>
          </aside>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">4. Etats de synthese</span>
              <h2>Compte de resultat et structure financiere</h2>
            </div>
          </div>

          <div className="table-grid">
            <article className="table-card">
              <h3>Compte de resultat analytique</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Chiffre d'affaires</td>
                    <td>{formatCurrency(inputs.revenue, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>Marge brute</td>
                    <td>{formatCurrency(metrics.grossMargin, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>EBITDA</td>
                    <td>{formatCurrency(metrics.ebitda, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>EBIT</td>
                    <td>{formatCurrency(metrics.ebit, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>Resultat operationnel recurrent</td>
                    <td>
                      {formatCurrency(
                        metrics.recurringOperatingProfit,
                        company.currency
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Resultat avant impots</td>
                    <td>
                      {formatCurrency(metrics.profitBeforeTax, company.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td>Resultat net</td>
                    <td>{formatCurrency(metrics.netIncome, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>CAF</td>
                    <td>{formatCurrency(metrics.caf, company.currency)}</td>
                  </tr>
                </tbody>
              </table>
              <p className="table-card__note">
                Reprise de l'exemple fourni: les provisions 2025 sont
                injectees dans le champ "Elements non recurrents" pour
                retrouver un resultat net de 14 kCHF.
              </p>
            </article>

            <article className="table-card">
              <h3>Equilibre financier</h3>
              <table>
                <tbody>
                  <tr>
                    <td>FDR</td>
                    <td>{formatCurrency(metrics.fdr, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>BFRE</td>
                    <td>{formatCurrency(metrics.bfRe, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>BFR</td>
                    <td>{formatCurrency(metrics.bfr, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>Variation de BFR</td>
                    <td>{formatCurrency(metrics.deltaBfr, company.currency)}</td>
                  </tr>
                  <tr>
                    <td>Tresorerie structurelle</td>
                    <td>
                      {formatCurrency(metrics.structuralTreasury, company.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td>Tresorerie nette</td>
                    <td>{formatCurrency(metrics.netCash, company.currency)}</td>
                  </tr>
                </tbody>
              </table>
            </article>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">5. Tableau de flux</span>
              <h2>TFT / TFF et free cash flow</h2>
            </div>
          </div>

          <div className="table-grid">
            <article className="table-card">
              <h3>Flux de tresorerie</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Cash-flow d'exploitation</td>
                    <td>
                      {formatCurrency(metrics.operatingCashFlow, company.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td>Flux d'investissement</td>
                    <td>
                      {formatCurrency(metrics.investingCashFlow, company.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td>Flux de financement</td>
                    <td>
                      {formatCurrency(metrics.financingCashFlow, company.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td>Variation nette de tresorerie</td>
                    <td>
                      {formatCurrency(metrics.netCashVariation, company.currency)}
                    </td>
                  </tr>
                  <tr>
                    <td>Free cash flow</td>
                    <td>{formatCurrency(metrics.freeCashFlow, company.currency)}</td>
                  </tr>
                </tbody>
              </table>
            </article>

            <article className="table-card">
              <h3>Ratios d'analyse</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Taux de marge brute</td>
                    <td>{formatPercent(ratios.grossMarginRate)}</td>
                  </tr>
                  <tr>
                    <td>Marge EBITDA</td>
                    <td>{formatPercent(ratios.ebitdaMargin)}</td>
                  </tr>
                  <tr>
                    <td>Marge nette</td>
                    <td>{formatPercent(ratios.netMargin)}</td>
                  </tr>
                  <tr>
                    <td>Liquidite generale</td>
                    <td>{ratios.currentRatio.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Liquidite reduite</td>
                    <td>{ratios.quickRatio.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Autonomie financiere</td>
                    <td>{formatPercent(ratios.equityRatio)}</td>
                  </tr>
                  <tr>
                    <td>Gearing</td>
                    <td>{ratios.gearing.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>DSO / DIO / DPO</td>
                    <td>
                      {formatDays(ratios.dso)} / {formatDays(ratios.dio)} /{' '}
                      {formatDays(ratios.dpo)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
