import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Brain, ArrowDown } from 'lucide-react';
import { predictiveInsights } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const riskDistribution = [
  { label: 'Critical (>80%)', count: 2, color: 'hsl(0, 84%, 60%)' },
  { label: 'High (60-80%)', count: 2, color: 'hsl(38, 92%, 50%)' },
  { label: 'Moderate (40-60%)', count: 1, color: 'hsl(199, 89%, 48%)' },
  { label: 'Low (<40%)', count: 0, color: 'hsl(142, 76%, 36%)' },
];

const PredictiveAnalytics: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 p-4 rounded-xl gradient-primary">
          <Brain className="w-8 h-8 text-primary-foreground" />
          <div>
            <h3 className="font-bold text-primary-foreground">AI Predictive Analytics Engine</h3>
            <p className="text-sm text-primary-foreground/80">ML model analyzed 12,000+ attendance records to identify at-risk students</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Risk Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={predictiveInsights} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} formatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                  <Bar dataKey="riskScore" radius={[0, 6, 6, 0]}>
                    {predictiveInsights.map((entry, i) => (
                      <Cell key={i} fill={entry.riskScore > 0.8 ? 'hsl(0, 84%, 60%)' : entry.riskScore > 0.6 ? 'hsl(38, 92%, 50%)' : 'hsl(199, 89%, 48%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Risk Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {riskDistribution.map((r) => (
                <div key={r.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: r.color }} />
                    <span className="text-sm">{r.label}</span>
                  </div>
                  <span className="text-lg font-bold">{r.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Detailed cards */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Flagged Students — Detailed Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictiveInsights.map((s) => (
              <Card key={s.studentId} className="glass-card">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.rollNo}</p>
                    </div>
                    <Badge variant={s.riskScore > 0.8 ? 'destructive' : 'secondary'}>
                      Risk: {(s.riskScore * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-muted/50 text-center">
                      <p className="text-lg font-bold">{s.currentAttendance}%</p>
                      <p className="text-[10px] text-muted-foreground">Current</p>
                    </div>
                    <div className="p-2 rounded-lg bg-destructive/10 text-center">
                      <p className="text-lg font-bold text-destructive flex items-center justify-center gap-1">
                        <ArrowDown className="w-3 h-3" />{s.predictedAttendance}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">Predicted</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-xs font-medium mb-0.5 flex items-center gap-1">
                      <Brain className="w-3 h-3 text-accent" /> AI Recommendation
                    </p>
                    <p className="text-xs text-muted-foreground">{s.recommendation}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PredictiveAnalytics;
