import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download, Zap, AlertTriangle, TrendingUp, Users, MapPin, Layers, RefreshCw, Droplet, Wind, CloudRain, Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import DistrictRiskMap from '../../components/DistrictRiskMap';
import RiskTrendChart, { type RiskTrendDatum } from '../../components/charts/RiskTrendChart';
import * as predictionsService from '../../services/predictionsService';
import type { DistrictPriorityItem } from '../../services/predictionsService';
import { downloadCsv } from '../../lib/format';

function riskColor(score: number) {
  if (score >= 76) return 'var(--color-risk-critical)';
  if (score >= 51) return 'var(--color-risk-high)';
  if (score >= 26) return 'var(--color-risk-moderate)';
  return 'var(--color-risk-low)';
}

function hazardIcon(hazard: string) {
  switch (hazard) {
    case 'Floods':
      return <CloudRain size={14} />;
    case 'Heatwave':
      return <Wind size={14} />;
    case 'Malaria':
    default:
      return <Droplet size={14} />;
  }
}

export default function NationalDashboard() {
  const queryClient = useQueryClient();
  const [showHazardLayers, setShowHazardLayers] = useState(true);

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['national-summary'],
    queryFn: () => predictionsService.getNationalSummary(),
  });

  const { data: aiSummary, isLoading: aiLoading } = useQuery({
    queryKey: ['ai-situation-summary'],
    queryFn: () => predictionsService.getAiSituationSummary(),
  });

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['risk-trends'],
    queryFn: () => predictionsService.getRiskTrends(6),
  });

  const runPredictionMut = useMutation({
    mutationFn: () => predictionsService.runPrediction('Rwanda'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['national-summary'] });
      queryClient.invalidateQueries({ queryKey: ['ai-situation-summary'] });
      queryClient.invalidateQueries({ queryKey: ['risk-trends'] });
    },
  });

  const syncing = runPredictionMut.isPending;
  const syncSatelliteData = () => runPredictionMut.mutate();

  const displayDistricts: DistrictPriorityItem[] = summary?.district_priority_ranking?.slice(0, 5) ?? [];

  const exportReport = () => {
    if (!summary) return;
    downloadCsv(`zero-bite-national-risk-${new Date().toISOString().slice(0, 10)}.csv`, [
      ['District', 'Risk score (0-100)', 'Risk level'],
      ...[...summary.district_heatmap]
        .sort((x, y) => y.risk_score - x.risk_score)
        .map((d) => [d.district, d.risk_score, d.risk_level]),
    ]);
  };

  const trendsData: RiskTrendDatum[] | undefined =
    trends?.trends?.map((t) => ({
      week: t.week,
      historical: t.historical,
      predicted: t.predicted,
    }));

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>National Climate Intelligence</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Strategic oversight and AI-driven predictive modeling for Rwandan Districts.
          </p>
        </div>
        <div className="flex gap-md">
          <button
            className="btn-outline"
            onClick={exportReport}
            disabled={!summary}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={16} /> Export CSV
          </button>
          <Link
            to="/reports"
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Zap size={16} /> Build Report
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-lg" style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div className="card">
          <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--color-risk-critical)', display: 'flex', alignItems: 'center' }}>
              <AlertTriangle size={20} />
            </span>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>High-Risk Districts</h3>
          </div>
          <div className="flex items-baseline gap-sm">
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>
              {summaryLoading ? (
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', opacity: 0.4 }} />
              ) : (
                summary?.high_risk_districts ?? '—'
              )}
            </span>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>/ 30 districts</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}><Zap size={20} /></span>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Active Warnings</h3>
          </div>
          <div className="flex items-baseline gap-sm">
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>
              {summaryLoading ? (
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', opacity: 0.4 }} />
              ) : (
                summary?.active_warnings ?? '—'
              )}
            </span>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>Disaster alerts active</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}><TrendingUp size={20} /></span>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Avg. National Risk</h3>
          </div>
          <div className="flex items-baseline gap-sm">
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>
              {summaryLoading ? (
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', opacity: 0.4 }} />
              ) : (
                summary?.avg_national_risk ?? '—'
              )}
            </span>
            {summary?.avg_risk_change_pts != null && (
              <span
                style={{
                  color: summary.avg_risk_change_pts > 0 ? 'var(--color-risk-critical)' : 'var(--color-risk-low)',
                  fontSize: '0.875rem',
                }}
              >
                {summary.avg_risk_change_pts > 0 ? '+' : ''}
                {summary.avg_risk_change_pts} pts vs last week
              </span>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-sm" style={{ marginBottom: '0.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}><Users size={20} /></span>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>Rising Districts</h3>
          </div>
          <div className="flex items-baseline gap-sm">
            <span style={{ fontSize: '2rem', fontWeight: 700 }}>
              {summaryLoading ? (
                <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', opacity: 0.4 }} />
              ) : (
                summary?.rising_districts ?? '—'
              )}
            </span>
            <span style={{ color: 'var(--color-text-tertiary)', fontSize: '0.875rem' }}>risk up over 7 days</span>
          </div>
        </div>
      </div>

      <div className="split-2-1">
        {/* Heatmap Area */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            className="flex justify-between items-center"
            style={{ marginBottom: 'var(--spacing-md)' }}
          >
            <h3 className="flex items-center gap-sm">
              <span
                style={{ color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}
              >
                <MapPin size={20} />
              </span>{' '}
              District Risk Heatmap
            </h3>
            <span className="badge" style={{ backgroundColor: '#F3F4F6', color: 'var(--color-text-primary)' }}>
              Risk Score
            </span>
          </div>

          <div
            style={{
              flex: 1,
              backgroundColor: '#F0F4F8',
              borderRadius: 'var(--radius-md)',
              minHeight: '400px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <DistrictRiskMap showHazardLayers={showHazardLayers} />
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                zIndex: 400,
              }}
            >
              <button
                className="btn-outline"
                onClick={() => setShowHazardLayers((v) => !v)}
                style={{
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Layers size={16} /> {showHazardLayers ? 'Hide' : 'Show'} Hazard Layers
              </button>
              <button
                className="btn-outline"
                onClick={syncSatelliteData}
                disabled={syncing}
                style={{
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: syncing ? 0.6 : 1,
                }}
              >
                <RefreshCw
                  size={16}
                  style={syncing ? { animation: 'spin 0.8s linear infinite' } : undefined}
                />{' '}
                {syncing ? 'Refreshing...' : 'Refresh Live Data'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Situation Summary */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>AI Situation Summary</h3>
            <span className="badge" style={{ backgroundColor: '#F3F4F6' }}>
              {aiLoading ? '...' : aiSummary?.model_version?.split('-')[0] ?? '—'}
            </span>
          </div>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            Generated from live weather and the deployed risk model
          </p>

          <div
            style={{
              backgroundColor: '#F9FAFB',
              padding: 'var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              marginBottom: 'var(--spacing-lg)',
            }}
          >
            {aiLoading ? (
              <p style={{ color: 'var(--color-text-tertiary)' }}>Loading AI summary...</p>
            ) : aiSummary ? (
              <p>
                <strong>Summary:</strong> {aiSummary.summary}
              </p>
            ) : (
              <p style={{ color: 'var(--color-text-tertiary)' }}>Summary unavailable.</p>
            )}
          </div>

          <h4
            style={{
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              color: 'var(--color-text-tertiary)',
              letterSpacing: '0.05em',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Recommended Actions
          </h4>
          <ul
            style={{
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-md)',
            }}
          >
            {(aiSummary?.recommended_actions ?? []).map((action, idx) => (
              <li key={idx} style={{ position: 'relative', paddingLeft: 'var(--spacing-lg)' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor:
                      idx === 0 ? 'var(--color-primary)' : 'var(--color-border)',
                  }}
                ></span>
                <div>
                  <strong>
                    {action.length > 50 ? action.split('—')[0]?.trim() || action : action}
                  </strong>
                  {action.length > 50 && action.includes('—') && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                      {action.split('—').slice(1).join('—').trim()}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <Link
            to="/reports"
            className="btn-primary"
            style={{ width: '100%', marginTop: 'var(--spacing-xl)', display: 'block', textAlign: 'center' }}
          >
            Generate Full Report
          </Link>
        </div>
      </div>

      <div className="split-2-1" style={{ marginTop: 'var(--spacing-xl)' }}>
        {/* Risk Probability Trends */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0 }}>Risk Probability Trends</h3>
            <div
              className="flex items-center gap-md"
              style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}
            >
              <span className="flex items-center gap-sm">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-text-primary)',
                  }}
                  />{' '}
                Historical
              </span>
              <span className="flex items-center gap-sm">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-text-tertiary)',
                  }}
                  />{' '}
                Predicted
              </span>
            </div>
          </div>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Comparing historical norms vs. predicted intelligence
            {trendsLoading && (
              <Loader2
                size={14}
                style={{
                  display: 'inline-block',
                  marginLeft: '0.5rem',
                  animation: 'spin 0.8s linear infinite',
                  opacity: 0.4,
                }}
              />
            )}
          </p>
          <RiskTrendChart data={trendsData} />
        </div>

        {/* District Priority Ranking */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
            <h3 style={{ margin: 0 }}>District Priority Ranking</h3>
            <Link to="/districts" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
              View All Districts &gt;
            </Link>
          </div>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-md)',
            }}
          >
            Top districts requiring immediate attention
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-tertiary)',
                  textTransform: 'uppercase',
                  textAlign: 'left',
                }}
              >
                <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>District</th>
                <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Risk Score</th>
                <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Hazard Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayDistricts.map((d) => (
                <tr
                  key={d.district}
                  style={{ borderTop: '1px solid var(--color-divider)' }}
                >
                  <td
                    style={{
                      padding: '0.6rem 0',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    }}
                  >
                    {d.district}
                  </td>
                  <td style={{ padding: '0.6rem 0' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 28,
                        padding: '0 6px',
                        height: 22,
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: riskColor(d.risk_score),
                        backgroundColor: `${riskColor(d.risk_score)}1A`,
                      }}
                    >
                      {d.risk_score}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '0.6rem 0',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span className="flex items-center gap-sm">
                      {hazardIcon(d.hazard_type)} {d.hazard_type}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '0.6rem 0',
                      textAlign: 'right',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    &gt;
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
