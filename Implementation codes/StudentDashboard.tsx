import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  UserCheck, TrendingUp, Calendar, AlertTriangle, CheckCircle2, XCircle, AlertCircle,
  QrCode, Camera, CameraOff, Download, Scan, BookOpen, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

const COLORS = ['hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const studentMonthly = [
  { month: 'Jan', attendance: 94 },
  { month: 'Feb', attendance: 91 },
  { month: 'Mar', attendance: 88 },
  { month: 'Apr', attendance: 92 },
];

const subjectWise = [
  { subject: 'Data Structures', attended: 28, total: 30, pct: 93 },
  { subject: 'Machine Learning', attended: 25, total: 28, pct: 89 },
  { subject: 'Database Systems', attended: 22, total: 26, pct: 85 },
  { subject: 'Computer Networks', attended: 24, total: 28, pct: 86 },
];

const classesAttended = [
  { date: '2026-04-06', subject: 'Data Structures', time: '09:00 - 10:00', method: 'qr', status: 'present' as const },
  { date: '2026-04-06', subject: 'Machine Learning', time: '11:00 - 12:00', method: 'qr', status: 'present' as const },
  { date: '2026-04-05', subject: 'Database Systems', time: '14:00 - 15:00', method: 'face', status: 'present' as const },
  { date: '2026-04-05', subject: 'Computer Networks', time: '15:00 - 16:00', method: 'manual', status: 'late' as const },
  { date: '2026-04-04', subject: 'Data Structures', time: '09:00 - 10:00', method: 'face', status: 'present' as const },
  { date: '2026-04-04', subject: 'Machine Learning', time: '11:00 - 12:00', method: 'qr', status: 'absent' as const },
];

const timetable = [
  { day: 'Monday', classes: [{ subject: 'Data Structures', time: '09:00 - 10:00', room: 'CS-101' }, { subject: 'Machine Learning', time: '11:00 - 12:00', room: 'CS-201' }] },
  { day: 'Tuesday', classes: [{ subject: 'Database Systems', time: '14:00 - 15:00', room: 'CS-102' }, { subject: 'Computer Networks', time: '15:00 - 16:00', room: 'CS-301' }] },
  { day: 'Wednesday', classes: [{ subject: 'Data Structures', time: '09:00 - 10:00', room: 'CS-101' }, { subject: 'Machine Learning', time: '11:00 - 12:00', room: 'CS-201' }] },
  { day: 'Thursday', classes: [{ subject: 'Database Systems', time: '14:00 - 15:00', room: 'CS-102' }] },
  { day: 'Friday', classes: [{ subject: 'Computer Networks', time: '10:00 - 11:00', room: 'CS-301' }, { subject: 'Data Structures', time: '14:00 - 15:00', room: 'CS-101' }] },
];

const StudentDashboard: React.FC = () => {
  const location = useLocation();
  const [qrInput, setQrInput] = useState('');
  const [qrScanning, setQrScanning] = useState(false);
  const [qrCameraActive, setQrCameraActive] = useState(false);
  const [qrScanSuccess, setQrScanSuccess] = useState(false);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);

  const totalAttended = subjectWise.reduce((s, c) => s + c.attended, 0);
  const totalClasses = subjectWise.reduce((s, c) => s + c.total, 0);
  const overallPct = ((totalAttended / totalClasses) * 100).toFixed(0);

  const startQrCamera = useCallback(() => {
    setQrScanSuccess(false);
    setQrCameraActive(true);
  }, []);

  useEffect(() => {
    if (!qrCameraActive) return;
    const el = document.getElementById('qr-reader');
    if (!el) return;

    const scanner = new Html5Qrcode('qr-reader');
    qrScannerRef.current = scanner;
    let stopped = false;

    (async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (decodedText) => {
            if (stopped) return;
            stopped = true;
            scanner.stop().then(() => {
              toast.success('✅ QR scanned! Attendance marked successfully');
              setQrScanSuccess(true);
              setQrCameraActive(false);
              qrScannerRef.current = null;
            }).catch(() => {});
          },
          () => {}
        );
      } catch (err: any) {
        if (stopped) return;
        if (err?.name === 'NotAllowedError' || (typeof err === 'string' && err.includes('Permission'))) {
          toast.error('Camera access denied. Please allow camera in browser settings.');
        } else if (err?.name === 'NotFoundError' || (typeof err === 'string' && err.includes('NotFound'))) {
          toast.error('No camera found on this device.');
        } else {
          toast.error('Could not start QR scanner. Try entering the code manually.');
        }
        setQrCameraActive(false);
      }
    })();

    return () => {
      if (!stopped) { stopped = true; scanner.stop().catch(() => {}); }
      qrScannerRef.current = null;
    };
  }, [qrCameraActive]);

  const stopQrCamera = useCallback(() => {
    if (qrScannerRef.current) { qrScannerRef.current.stop().catch(() => {}); qrScannerRef.current = null; }
    setQrCameraActive(false);
  }, []);

  const handleQrManual = () => {
    setQrScanning(true);
    setTimeout(() => { setQrScanning(false); toast.success('✅ Attendance marked via code'); setQrInput(''); }, 1500);
  };

  const exportReport = () => {
    const rows = [['Date', 'Subject', 'Time', 'Method', 'Status']];
    classesAttended.forEach(c => rows.push([c.date, c.subject, c.time, c.method, c.status]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `my_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Report downloaded');
  };

  const presentCount = classesAttended.filter(c => c.status === 'present').length;
  const lateCount = classesAttended.filter(c => c.status === 'late').length;
  const absentCount = classesAttended.filter(c => c.status === 'absent').length;
  const pieData = [
    { name: 'Present', value: presentCount },
    { name: 'Late', value: lateCount },
    { name: 'Absent', value: absentCount },
  ].filter(d => d.value > 0);

  const currentPath = location.pathname;

  const renderContent = () => {
    // Scan QR
    if (currentPath === '/student/scan') {
      return (
        <Card className="glass-card max-w-lg mx-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><QrCode className="w-4 h-4" /> Scan QR Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-64 h-64 rounded-2xl overflow-hidden bg-muted/30 border-2 border-dashed border-primary/40 relative">
                <div id="qr-reader" className={`w-full h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-cover [&_img]:hidden [&>div]:!border-none ${!qrCameraActive ? 'hidden' : ''}`} />
                {!qrCameraActive && !qrScanSuccess && (
                  <div className="w-full h-full flex items-center justify-center">
                    <QrCode className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                )}
                {qrScanSuccess && !qrCameraActive && (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-success/10">
                    <CheckCircle2 className="w-16 h-16 text-success" />
                    <p className="text-sm font-medium text-success">Attendance Marked!</p>
                  </div>
                )}
              </div>
              {qrScanSuccess ? (
                <Button onClick={() => setQrScanSuccess(false)} variant="outline">Scan Again</Button>
              ) : (
                <Button onClick={qrCameraActive ? stopQrCamera : startQrCamera}
                  variant={qrCameraActive ? 'outline' : 'default'}
                  className={!qrCameraActive ? 'gradient-primary text-primary-foreground' : ''}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {qrCameraActive ? 'Stop Camera' : 'Open Camera Scanner'}
                </Button>
              )}
              <div className="w-full max-w-xs">
                <p className="text-xs text-muted-foreground text-center mb-2">Or enter code manually:</p>
                <div className="flex gap-2">
                  <input value={qrInput} onChange={e => setQrInput(e.target.value)} placeholder="Enter QR code..."
                    className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm" />
                  <Button onClick={handleQrManual} disabled={qrScanning || !qrInput} size="sm">
                    {qrScanning ? 'Scanning...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // My Attendance
    if (currentPath === '/student/attendance') {
      return (
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">Recent Attendance</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {classesAttended.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {c.status === 'present' ? <CheckCircle2 className="w-4 h-4 text-success" /> :
                       c.status === 'late' ? <AlertCircle className="w-4 h-4 text-warning" /> :
                       <XCircle className="w-4 h-4 text-destructive" />}
                      <div>
                        <p className="text-sm font-medium">{c.subject}</p>
                        <p className="text-xs text-muted-foreground">{c.date} • {c.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs capitalize">{c.status}</Badge>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{c.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">Subject-wise Attendance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {subjectWise.map(s => (
                <div key={s.subject} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground">{s.attended}/{s.total} ({s.pct}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted">
                    <div className="h-2.5 rounded-full transition-all duration-500" style={{
                      width: `${s.pct}%`,
                      background: s.pct >= 85 ? 'hsl(142, 76%, 36%)' : s.pct >= 75 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 84%, 60%)',
                    }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Export Report</CardTitle>
                <Button size="sm" variant="outline" onClick={exportReport}><Download className="w-3 h-3 mr-1" /> Download CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground text-xs">Total Classes</p>
                  <p className="text-xl font-bold mt-1">{totalClasses}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground text-xs">Attended</p>
                  <p className="text-xl font-bold mt-1 text-success">{totalAttended}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground text-xs">Overall %</p>
                  <p className="text-xl font-bold mt-1">{overallPct}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-muted-foreground text-xs">Risk Status</p>
                  <p className="text-xl font-bold mt-1 text-success">Low</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Timetable
    if (currentPath === '/student/timetable') {
      return (
        <div className="space-y-4">
          {timetable.map(day => (
            <Card key={day.day} className="glass-card">
              <CardHeader className="pb-2"><CardTitle className="text-base">{day.day}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {day.classes.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{c.subject}</p>
                          <p className="text-xs text-muted-foreground">{c.room}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{c.time}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Default: Dashboard overview
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Overall Attendance" value={`${overallPct}%`} icon={UserCheck} gradient="success" trend={{ value: 1.2, label: 'vs last month' }} />
          <StatCard title="Classes Attended" value={`${totalAttended}/${totalClasses}`} icon={Calendar} gradient="primary" />
          <StatCard title="This Week" value="88%" icon={TrendingUp} gradient="warning" trend={{ value: -2, label: 'vs avg' }} />
          <StatCard title="Risk Level" value="Low" icon={AlertTriangle} gradient="success" subtitle="You're in good standing" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">Monthly Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={studentMonthly}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={[70, 100]} />
                  <Tooltip contentStyle={{ borderRadius: '0.75rem', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Area type="monotone" dataKey="attendance" stroke="hsl(217, 91%, 60%)" fill="url(#colorAtt)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-base">Status Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend /><Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming classes today */}
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-base">Today's Schedule</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timetable[new Date().getDay() === 0 ? 0 : Math.min(new Date().getDay() - 1, 4)]?.classes.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{c.subject}</p>
                      <p className="text-xs text-muted-foreground">{c.room}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">{c.time}</Badge>
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
      </div>
    </DashboardLayout>
  );
};

export default StudentDashboard;
