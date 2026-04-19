import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen, UserCheck, Users, Clock, QrCode, CheckCircle2, XCircle, AlertCircle,
  Download, Monitor, User
} from 'lucide-react';
import { mockStudents, mockClassSessions, mockAttendanceRecords, weeklyTrendData } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const FacultyDashboard: React.FC = () => {
  const location = useLocation();
  const [selectedClass, setSelectedClass] = useState(mockClassSessions[0].id);
  const [manualAttendance, setManualAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [qrValue, setQrValue] = useState('');
  const [qrTimer, setQrTimer] = useState(50);
  const [qrActive, setQrActive] = useState(false);
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<{ name: string; time: string }[]>([]);

  const csStudents = mockStudents.filter(s => s.department === 'Computer Science');
  const selectedSession = mockClassSessions.find(c => c.id === selectedClass)!;

  useEffect(() => {
    const initial: Record<string, 'present' | 'absent' | 'late'> = {};
    csStudents.forEach(s => {
      const rec = mockAttendanceRecords.find(r => r.studentId === s.id && r.subject === selectedSession.subject);
      initial[s.id] = rec?.status || 'absent';
    });
    setManualAttendance(initial);
  }, [selectedClass]);

  // Simulate students scanning QR when active
  useEffect(() => {
    if (!qrActive) return;
    setScannedStudents([]);
    const studentNames = csStudents.map(s => s.name);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < studentNames.length) {
        setScannedStudents(prev => [
          ...prev,
          { name: studentNames[idx], time: new Date().toLocaleTimeString() }
        ]);
        idx++;
      }
    }, Math.random() * 3000 + 2000);
    return () => clearInterval(interval);
  }, [qrActive]);

  const generateQR = useCallback(() => {
    const token = `ATTENDAI-${selectedSession.code}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setQrValue(token);
    setQrTimer(50);
  }, [selectedSession]);

  useEffect(() => {
    if (!qrActive) return;
    generateQR();
    const interval = setInterval(generateQR, 50000);
    return () => clearInterval(interval);
  }, [qrActive, generateQR]);

  useEffect(() => {
    if (!qrActive) return;
    const tick = setInterval(() => setQrTimer(t => (t <= 1 ? 50 : t - 1)), 1000);
    return () => clearInterval(tick);
  }, [qrActive]);

  const toggleAttendance = (studentId: string) => {
    setManualAttendance(prev => {
      const current = prev[studentId];
      const next = current === 'absent' ? 'present' : current === 'present' ? 'late' : 'absent';
      return { ...prev, [studentId]: next };
    });
  };

  const markAllPresent = () => {
    const updated: Record<string, 'present' | 'absent' | 'late'> = {};
    csStudents.forEach(s => { updated[s.id] = 'present'; });
    setManualAttendance(updated);
    toast.success('All students marked present');
  };

  const submitAttendance = () => {
    const present = Object.values(manualAttendance).filter(s => s === 'present').length;
    const late = Object.values(manualAttendance).filter(s => s === 'late').length;
    toast.success(`Attendance submitted: ${present} present, ${late} late, ${csStudents.length - present - late} absent`);
  };

  const exportCSV = () => {
    const rows = [['Roll No', 'Name', 'Status']];
    csStudents.forEach(s => rows.push([s.rollNo, s.name, manualAttendance[s.id] || 'absent']));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_${selectedSession.code}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Report exported as CSV');
  };

  const presentCount = Object.values(manualAttendance).filter(s => s === 'present').length;
  const lateCount = Object.values(manualAttendance).filter(s => s === 'late').length;
  const absentCount = csStudents.length - presentCount - lateCount;
  const pieData = [
    { name: 'Present', value: presentCount },
    { name: 'Late', value: lateCount },
    { name: 'Absent', value: absentCount },
  ].filter(d => d.value > 0);

  const totalClasses = mockClassSessions.length;
  const totalAttendance = mockClassSessions.reduce((sum, c) => sum + c.presentStudents, 0);
  const totalCapacity = mockClassSessions.reduce((sum, c) => sum + c.totalStudents, 0);

  const currentPath = location.pathname;

  const renderContent = () => {
    // Mark Attendance
    if (currentPath === '/faculty/mark') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {mockClassSessions.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.subject} ({c.code}) — {c.time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { setQrActive(true); setQrFullscreen(true); }} className="gradient-primary text-primary-foreground">
              <Monitor className="w-4 h-4 mr-2" /> Show QR to Class
            </Button>
          </div>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Mark Attendance — {selectedSession.subject}</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={markAllPresent}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Mark All Present
                  </Button>
                  <Button size="sm" onClick={submitAttendance} className="gradient-primary text-primary-foreground">Submit</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4 text-sm">
                <Badge className="bg-success/20 text-success border-success/30">Present: {presentCount}</Badge>
                <Badge className="bg-warning/20 text-warning border-warning/30">Late: {lateCount}</Badge>
                <Badge className="bg-destructive/20 text-destructive border-destructive/30">Absent: {absentCount}</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-3 px-2 font-medium">Roll No</th>
                      <th className="text-left py-3 px-2 font-medium">Name</th>
                      <th className="text-center py-3 px-2 font-medium">Overall %</th>
                      <th className="text-center py-3 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csStudents.map(s => {
                      const status = manualAttendance[s.id] || 'absent';
                      return (
                        <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-2 text-muted-foreground">{s.rollNo}</td>
                          <td className="py-2.5 px-2 font-medium">{s.name}</td>
                          <td className="py-2.5 px-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-muted">
                                <div className="h-1.5 rounded-full" style={{
                                  width: `${s.attendance}%`,
                                  background: s.attendance >= 85 ? 'hsl(142, 76%, 36%)' : s.attendance >= 75 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)',
                                }} />
                              </div>
                              <span className="text-xs">{s.attendance}%</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <Button size="sm" variant="ghost" onClick={() => toggleAttendance(s.id)}
                              className={`text-xs capitalize px-3 ${
                                status === 'present' ? 'bg-success/15 text-success hover:bg-success/25' :
                                status === 'late' ? 'bg-warning/15 text-warning hover:bg-warning/25' :
                                'bg-destructive/15 text-destructive hover:bg-destructive/25'
                              }`}
                            >
                              {status === 'present' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                               status === 'late' ? <AlertCircle className="w-3 h-3 mr-1" /> :
                               <XCircle className="w-3 h-3 mr-1" />}
                              {status}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // My Classes
    if (currentPath === '/faculty/classes') {
      return (
        <div className="space-y-4">
          {mockClassSessions.map(c => (
            <Card key={c.id} className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{c.subject}</h3>
                    <p className="text-sm text-muted-foreground">{c.code} • {c.time}</p>
                    <p className="text-xs text-muted-foreground mt-1">Room: {c.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{c.presentStudents}/{c.totalStudents}</p>
                    <p className="text-xs text-muted-foreground">students present</p>
                    <Badge className={`mt-1 ${c.presentStudents / c.totalStudents >= 0.75 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                      {((c.presentStudents / c.totalStudents) * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Analytics
    if (currentPath === '/faculty/analytics') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">Today's Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend /><Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">Weekly Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Bar dataKey="attendance" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="target" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Export Report</CardTitle>
                <Button size="sm" variant="outline" onClick={exportCSV}><Download className="w-3 h-3 mr-1" /> Export CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground text-xs">Total Classes Today</p>
                  <p className="text-xl font-bold mt-1">{totalClasses}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground text-xs">Avg Attendance</p>
                  <p className="text-xl font-bold mt-1">{((totalAttendance / totalCapacity) * 100).toFixed(0)}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground text-xs">Students at Risk</p>
                  <p className="text-xl font-bold mt-1 text-destructive">{csStudents.filter(s => s.status === 'at-risk').length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground text-xs">Below 75%</p>
                  <p className="text-xl font-bold mt-1 text-warning">{csStudents.filter(s => s.attendance < 75).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Face Scanner
    if (currentPath === '/faculty/scanner') {
      return null; // handled by FaceScanner page
    }

    // Default: Dashboard overview
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Classes" value={totalClasses} icon={BookOpen} gradient="primary" />
          <StatCard title="Total Attendance" value={`${((totalAttendance / totalCapacity) * 100).toFixed(0)}%`} icon={UserCheck} gradient="success" trend={{ value: 2.1, label: 'vs last week' }} />
          <StatCard title="Total Students" value={csStudents.length} icon={Users} gradient="warning" />
          <StatCard title="Next Class" value={mockClassSessions[1]?.time?.split(' - ')[0] || '—'} icon={Clock} gradient="danger" subtitle={mockClassSessions[1]?.subject} />
        </div>

        {/* QR session with scanned students */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4" /> Quick QR Session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {qrActive ? (
                  <>
                    <div className="p-4 bg-white rounded-2xl shadow-lg">
                      <QRCodeSVG value={qrValue} size={180} level="H" />
                    </div>
                    <p className="text-sm text-muted-foreground">Refreshes in <span className="font-bold">{qrTimer}s</span></p>
                    <div className="flex gap-2">
                      <Button onClick={() => setQrFullscreen(true)} size="sm" className="gradient-primary text-primary-foreground">
                        <Monitor className="w-3 h-3 mr-2" /> Fullscreen
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setQrActive(false)}>Stop</Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <QrCode className="w-12 h-12 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Start a QR session for students</p>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {mockClassSessions.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.subject} ({c.code})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => setQrActive(true)} className="gradient-primary text-primary-foreground">
                      <QrCode className="w-4 h-4 mr-2" /> Start QR Session
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scanned students list */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> Students Scanned</CardTitle>
                <Badge variant="outline">{scannedStudents.length} scanned</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {scannedStudents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {qrActive ? 'Waiting for students to scan...' : 'Start a QR session to see scans here'}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scannedStudents.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-success/10 border border-success/20">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-success/20 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-success" />
                        </div>
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{s.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's classes overview */}
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Today's Classes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockClassSessions.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">{c.code} • {c.time} • {c.room}</p>
                  </div>
                  <Badge className={c.presentStudents / c.totalStudents >= 0.75 ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}>
                    {c.presentStudents}/{c.totalStudents}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {renderContent()}

        {/* Fullscreen QR Dialog */}
        <Dialog open={qrFullscreen} onOpenChange={setQrFullscreen}>
          <DialogContent className="max-w-2xl sm:max-w-3xl flex flex-col items-center gap-6 py-10">
            <DialogTitle className="text-2xl font-bold text-center">Scan to Mark Attendance</DialogTitle>
            <p className="text-muted-foreground text-center">{selectedSession.subject} ({selectedSession.code}) — {selectedSession.time}</p>
            {qrValue && (
              <div className="p-6 bg-white rounded-3xl shadow-xl">
                <QRCodeSVG value={qrValue} size={320} level="H" />
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Code refreshes in</p>
              <p className="text-5xl font-bold tabular-nums">{qrTimer}s</p>
              <div className="w-64 h-2 rounded-full bg-muted mx-auto">
                <div className="h-2 rounded-full bg-primary transition-all duration-1000" style={{ width: `${(qrTimer / 50) * 100}%` }} />
              </div>
            </div>
            {scannedStudents.length > 0 && (
              <div className="w-full max-w-sm">
                <p className="text-sm font-medium mb-2 text-center">{scannedStudents.length} students scanned</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {scannedStudents.map((s, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded bg-success/10 text-sm">
                      <span>{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button variant="outline" onClick={() => { setQrActive(false); setQrFullscreen(false); }}>End Session</Button>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default FacultyDashboard;
