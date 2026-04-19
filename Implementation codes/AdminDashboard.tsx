import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { mockStudents, mockClassSessions, weeklyTrendData, departmentStats, predictiveInsights } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const statusColors = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const pieData = [
  { name: 'Present', value: 185, color: 'hsl(142, 76%, 36%)' },
  { name: 'Late', value: 24, color: 'hsl(38, 92%, 50%)' },
  { name: 'Absent', value: 31, color: 'hsl(0, 84%, 60%)' },
];

const AdminDashboard: React.FC = () => {
  const totalStudents = 930;
  const todayAttendance = 83;
  const atRiskCount = predictiveInsights.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Students" value={totalStudents} icon={Users} gradient="primary" trend={{ value: 3.2, label: 'vs last sem' }} />
          <StatCard title="Today's Attendance" value={`${todayAttendance}%`} icon={UserCheck} gradient="success" trend={{ value: 1.5, label: 'vs yesterday' }} />
          <StatCard title="At-Risk Students" value={atRiskCount} icon={AlertTriangle} gradient="danger" subtitle="Below 65% attendance" />
          <StatCard title="Classes Today" value={mockClassSessions.length} icon={Clock} gradient="warning" subtitle="All departments" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weekly Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey="attendance" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
                  <Line dataKey="target" stroke="hsl(0, 84%, 60%)" strokeDasharray="5 5" dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Today's Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* At-risk students & departments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                AI-Flagged At-Risk Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictiveInsights.slice(0, 4).map((s) => (
                  <div key={s.studentId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.rollNo} • Current: {s.currentAttendance}%</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={s.riskScore > 0.8 ? 'destructive' : 'secondary'} className="text-xs">
                        Risk: {(s.riskScore * 100).toFixed(0)}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Predicted: {s.predictedAttendance}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Department Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {departmentStats.map((d) => (
                  <div key={d.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{d.name}</span>
                      <span className="text-muted-foreground">{d.avgAttendance}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${d.avgAttendance}%`,
                          background: d.avgAttendance >= 85 ? 'hsl(142, 76%, 36%)' : d.avgAttendance >= 75 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)',
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{d.students} students • {d.atRisk} at risk</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live classes */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Today's Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {mockClassSessions.map((cls) => (
                <div key={cls.id} className="p-4 rounded-xl border border-border bg-muted/30">
                  <p className="font-medium text-sm">{cls.subject}</p>
                  <p className="text-xs text-muted-foreground">{cls.code} • {cls.room}</p>
                  <p className="text-xs text-muted-foreground mt-1">{cls.time}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-success">{cls.presentStudents}/{cls.totalStudents}</span>
                    <Badge variant="secondary" className="text-xs">
                      {Math.round((cls.presentStudents / cls.totalStudents) * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
