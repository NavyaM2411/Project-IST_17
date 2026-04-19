import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, AlertTriangle, TrendingDown, TrendingUp, Minus, Loader2, Users, Target, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { mockStudents } from '@/lib/mock-data';

interface Prediction {
  name: string;
  rollNo: string;
  currentAttendance: number;
  predictedAttendance: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  willReach75: boolean;
  recommendation: string;
}

interface PredictionResult {
  predictions: Prediction[];
  summary: {
    totalStudents: number;
    atRisk: number;
    willReach75: number;
    avgPredicted: number;
  };
}

const riskColors: Record<string, string> = {
  low: 'bg-success/15 text-success border-success/30',
  moderate: 'bg-warning/15 text-warning border-warning/30',
  high: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
};

const FacultyPredictions: React.FC = () => {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const csStudents = mockStudents.filter(s => s.department === 'Computer Science');
      const studentsData = csStudents.map(s => ({
        name: s.name,
        rollNo: s.rollNo,
        currentAttendance: s.attendance,
        attended: Math.round(s.attendance * 30 / 100),
        total: 30,
        remainingClasses: 40,
      }));

      const { data, error } = await supabase.functions.invoke('predict-attendance', {
        body: { students: studentsData, mode: 'faculty' },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast.success('AI predictions generated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate predictions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 p-4 rounded-xl gradient-primary flex-1">
            <Brain className="w-8 h-8 text-primary-foreground" />
            <div>
              <h3 className="font-bold text-primary-foreground">AI Attendance Predictor</h3>
              <p className="text-sm text-primary-foreground/80">Predict which students will reach the 75% attendance target</p>
            </div>
          </div>
          <Button onClick={runPrediction} disabled={loading} size="lg" className="gradient-primary text-primary-foreground">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Brain className="w-4 h-4 mr-2" /> Run AI Prediction</>}
          </Button>
        </div>

        {result && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{result.summary.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <ShieldAlert className="w-5 h-5 mx-auto mb-1 text-destructive" />
                  <p className="text-2xl font-bold text-destructive">{result.summary.atRisk}</p>
                  <p className="text-xs text-muted-foreground">At Risk</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <Target className="w-5 h-5 mx-auto mb-1 text-success" />
                  <p className="text-2xl font-bold text-success">{result.summary.willReach75}</p>
                  <p className="text-xs text-muted-foreground">Will Reach 75%</p>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="text-2xl font-bold">{result.summary.avgPredicted?.toFixed(0)}%</p>
                  <p className="text-xs text-muted-foreground">Avg Predicted</p>
                </CardContent>
              </Card>
            </div>

            {/* Individual predictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.predictions.map((p, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.rollNo}</p>
                      </div>
                      <Badge className={riskColors[p.riskLevel]}>
                        {p.riskLevel.charAt(0).toUpperCase() + p.riskLevel.slice(1)} Risk
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <p className="text-lg font-bold">{p.currentAttendance}%</p>
                        <p className="text-[10px] text-muted-foreground">Current</p>
                      </div>
                      <div className={`p-2 rounded-lg text-center ${p.predictedAttendance < p.currentAttendance ? 'bg-destructive/10' : 'bg-success/10'}`}>
                        <p className={`text-lg font-bold flex items-center justify-center gap-1 ${p.predictedAttendance < p.currentAttendance ? 'text-destructive' : 'text-success'}`}>
                          {p.predictedAttendance < p.currentAttendance ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                          {p.predictedAttendance}%
                        </p>
                        <p className="text-[10px] text-muted-foreground">Predicted</p>
                      </div>
                      <div className={`p-2 rounded-lg text-center ${p.willReach75 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                        <p className={`text-lg font-bold ${p.willReach75 ? 'text-success' : 'text-destructive'}`}>
                          {p.willReach75 ? <CheckCircle2 className="w-5 h-5 mx-auto" /> : <AlertTriangle className="w-5 h-5 mx-auto" />}
                        </p>
                        <p className="text-[10px] text-muted-foreground">75% Target</p>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/50">
                      <p className="text-xs font-medium mb-0.5 flex items-center gap-1">
                        <Brain className="w-3 h-3 text-accent" /> AI Recommendation
                      </p>
                      <p className="text-xs text-muted-foreground">{p.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {!result && !loading && (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">No Predictions Yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Click "Run AI Prediction" to analyze student attendance patterns</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FacultyPredictions;
