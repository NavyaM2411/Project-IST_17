import React, { useRef, useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, CameraOff, CheckCircle2, XCircle, Scan, UserCheck, RefreshCw, Video } from 'lucide-react';
import { mockStudents, mockClassSessions } from '@/lib/mock-data';
import { toast } from 'sonner';

interface RecognizedStudent {
  id: string;
  name: string;
  rollNo: string;
  confidence: number;
  time: string;
}

const FaceScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedClass, setSelectedClass] = useState(mockClassSessions[0].id);
  const [recognizedStudents, setRecognizedStudents] = useState<RecognizedStudent[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'no-match'>('idle');

  const csStudents = mockStudents.filter(s => s.department === 'Computer Science');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        setScanStatus('idle');
        setCapturedImage(null);
      }
    } catch (err) {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setIsScanning(false);
    setScanStatus('idle');
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }, []);

  const simulateRecognition = useCallback(() => {
    // Simulate AI face recognition with random match
    const shouldMatch = Math.random() > 0.25;
    if (shouldMatch) {
      const alreadyRecognized = new Set(recognizedStudents.map(s => s.id));
      const remaining = csStudents.filter(s => !alreadyRecognized.has(s.id));
      if (remaining.length === 0) return null;
      const student = remaining[Math.floor(Math.random() * remaining.length)];
      return {
        id: student.id,
        name: student.name,
        rollNo: student.rollNo,
        confidence: 0.85 + Math.random() * 0.14,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
    }
    return null;
  }, [recognizedStudents, csStudents]);

  const handleScan = useCallback(async () => {
    if (!isCameraOn) return;
    setIsScanning(true);
    setScanStatus('scanning');

    const image = captureFrame();
    setCapturedImage(image);

    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1500));

    const result = simulateRecognition();
    if (result) {
      setScanStatus('success');
      setRecognizedStudents(prev => [...prev, result]);
      toast.success(`✅ ${result.name} marked present (${(result.confidence * 100).toFixed(0)}% confidence)`);
    } else {
      setScanStatus('no-match');
      toast.error('Face not recognized. Please try again.');
    }
    setIsScanning(false);
  }, [isCameraOn, captureFrame, simulateRecognition]);

  const handleAutoScan = useCallback(async () => {
    if (!isCameraOn) return;
    setIsScanning(true);
    for (let i = 0; i < 3; i++) {
      setScanStatus('scanning');
      await new Promise(r => setTimeout(r, 1200));
      const result = simulateRecognition();
      if (result) {
        setScanStatus('success');
        setRecognizedStudents(prev => [...prev, result]);
        toast.success(`✅ ${result.name} marked present`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    setScanStatus('idle');
    setIsScanning(false);
  }, [isCameraOn, simulateRecognition]);

  const selectedSession = mockClassSessions.find(c => c.id === selectedClass)!;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Face Recognition Scanner</h1>
            <p className="text-sm text-muted-foreground">AI-powered attendance marking via face detection</p>
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mockClassSessions.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.subject} — {c.time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Camera Feed */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-4 h-4" />
                Live Camera Feed — {selectedSession.subject}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-xl overflow-hidden border border-border">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {!isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <CameraOff className="w-12 h-12" />
                    <p className="text-sm">Camera is off</p>
                    <Button onClick={startCamera} className="gradient-primary text-primary-foreground">
                      <Camera className="w-4 h-4 mr-2" /> Start Camera
                    </Button>
                  </div>
                )}

                {/* Scan overlay */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-primary rounded-2xl animate-pulse relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-2xl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-2xl" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-2xl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-2xl" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Scan className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Status indicator */}
                {scanStatus === 'success' && !isScanning && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="w-3 h-3" /> Match Found</Badge>
                  </div>
                )}
                {scanStatus === 'no-match' && !isScanning && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> No Match</Badge>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap gap-2">
                {isCameraOn ? (
                  <>
                    <Button onClick={handleScan} disabled={isScanning} className="gradient-primary text-primary-foreground">
                      <Scan className="w-4 h-4 mr-2" /> {isScanning ? 'Scanning...' : 'Scan Face'}
                    </Button>
                    <Button onClick={handleAutoScan} disabled={isScanning} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" /> Auto-Scan (3 faces)
                    </Button>
                    <Button onClick={stopCamera} variant="outline" className="ml-auto">
                      <CameraOff className="w-4 h-4 mr-2" /> Stop Camera
                    </Button>
                  </>
                ) : (
                  <Button onClick={startCamera} className="gradient-primary text-primary-foreground">
                    <Camera className="w-4 h-4 mr-2" /> Start Camera
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recognized Students */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><UserCheck className="w-4 h-4" /> Marked Present</span>
                <Badge variant="secondary">{recognizedStudents.length}/{csStudents.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recognizedStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scan className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No students scanned yet</p>
                  <p className="text-xs">Start the camera and scan faces</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recognizedStudents.map((s, i) => (
                    <div key={s.id} className="flex items-center justify-between p-2.5 rounded-lg bg-success/10 border border-success/20 animate-fade-in">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.rollNo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-[10px]">{(s.confidence * 100).toFixed(0)}%</Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session info */}
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Session Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div><span className="text-muted-foreground">Subject</span><p className="font-medium">{selectedSession.subject} ({selectedSession.code})</p></div>
              <div><span className="text-muted-foreground">Time</span><p className="font-medium">{selectedSession.time}</p></div>
              <div><span className="text-muted-foreground">Room</span><p className="font-medium">{selectedSession.room}</p></div>
              <div><span className="text-muted-foreground">Attendance</span><p className="font-medium">{recognizedStudents.length} / {csStudents.length} ({((recognizedStudents.length / csStudents.length) * 100).toFixed(0)}%)</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default FaceScanner;
