import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingDown, TrendingUp, Loader2, Target, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SubjectPrediction {
  subject: string;
  predicted: number;
  risk: 'low' | 'moderate' | 'high' | 'critical';
}

interface StudentPrediction {
  predictedAttendance: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  willReach75: boolean;
  recommendation: string;
  subjectPredictions: SubjectPrediction[];
  trend: 'improving' | 'declining' | 'stable';
}

const riskColors: Record<string, string> = {
  low: 'bg-success/15 text-success border-success/30',
  moderate: 'bg-warning/15 text-warning border-warning/30',
  high: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  critical: 'bg-destructive/15 text-destructive border-destructive/30',
};

const subjectData = [
  { subject: 'Data Structures', attended: 28, total: 30 },
  { subject: 'Machine Learning', attended: 25, total: 28 },
  { subject: 'Database Systems', attended: 22, total: 26 },
  { subject: 'Computer Networks', attended: 24, total: 28 },
];

const StudentPredictions: React.FC = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<StudentPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const totalAttended = subjectData.reduce((s, c) => s + c.attended, 0);
  const totalClasses = subjectData.reduce((s, c) => s + c.total, 0);
  const currentPct = Math.round((totalAttended / totalClasses) * 100);

  const runPrediction = async () => {
    setLoading(true);
    try {
      const studentPayload = {
        name: user?.name || 'Student',
        currentAttendance: currentPct,
        attended: totalAttended,
        total: totalClasses,
        subjects: subjectData,
        remainingClasses: 40,
      };

      const { data, error } = await supabase.functions.invoke('predict-attendance', {
        body: { students: [studentPayload], mode: 'student' },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast.success('Your attendance prediction is ready!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate prediction');
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
              <h3 className="font-bold text-primary-foreground">My Attendance Prediction</h3>
              <p className="text-sm text-primary-foreground/80">AI-powered prediction of your end-of-semester attendance</p>
            </div>
          </div>
          <Button onClick={runPrediction} disabled={loading} size="lg" className="gradient-primary text-primary-foreground">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Predicting...</> : <><Brain className="w-4 h-4 mr-2" /> Predict My Attendance</>}
          </Button>
        </div>

        {result && (
          <>
            {/* Main prediction card */}
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-3xl font-bold">{currentPct}%</p>
                    <p className="text-sm text-muted-foreground mt-1">Current Attendance</p>
                  </div>
                  <div className={`p-4 rounded-xl ${result.predictedAttendance >= currentPct ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <p className={`text-3xl font-bold flex items-center justify-center gap-2 ${result.predictedAttendance >= currentPct ? 'text-success' : 'text-destructive'}`}>
                      {result.predictedAttendance >= currentPct ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                      {result.predictedAttendance}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Predicted End-of-Semester</p>
                  </div>
                  <div className={`p-4 rounded-xl ${result.willReach75 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    <div className="flex items-center justify-center gap-2">
                      {result.willReach75 ? <CheckCircle2 className="w-8 h-8 text-success" /> : <AlertTriangle className="w-8 h-8 text-destructive" />}
                    </div>
                    <p className={`text-sm font-semibold mt-2 ${result.willReach75 ? 'text-success' : 'text-destructive'}`}>
                      {result.willReach75 ? 'On track for 75%!' : 'May not reach 75%'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <span className="text-sm text-muted-foreground">Risk Level:</span>
                  <Badge className={riskColors[result.riskLevel]}>
                    {result.riskLevel.charAt(0).toUpperCase() + result.riskLevel.slice(1)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">Trend:</span>
                  <Badge variant="outline" className="capitalize">{result.trend}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendation */}
            <Card className="glass-card">
              <CardContent className="pt-5">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10">
                  <Brain className="w-6 h-6 text-accent mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm mb-1">AI Recommendation</p>
                    <p className="text-sm text-muted-foreground">{result.recommendation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject-wise predictions */}
            {result.subjectPredictions && result.subjectPredictions.length > 0 && (
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Subject-wise Predictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.subjectPredictions.map((sp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{sp.subject}</p>
                          <p className="text-xs text-muted-foreground">Predicted: {sp.predicted}%</p>
                        </div>
                      </div>
                      <Badge className={riskColors[sp.risk]}>
                        {sp.risk.charAt(0).toUpperCase() + sp.risk.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!result && !loading && (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold mb-2">See Your Future Attendance</h3>
              <p className="text-sm text-muted-foreground mb-4">Click the button above to get an AI-powered prediction of your end-of-semester attendance</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentPredictions;
