import React, { useRef, useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, CheckCircle2, Scan, Video, ScanFace } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { mockClassSessions } from '@/lib/mock-data';

const StudentFaceScan: React.FC = () => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [marked, setMarked] = useState<{ subject: string; time: string; confidence: number } | null>(null);

  const session = mockClassSessions[0];

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        setMarked(null);
      }
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setIsScanning(false);
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  const handleScan = useCallback(async () => {
    if (!isCameraOn) return;
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 1800));
    const confidence = 0.88 + Math.random() * 0.11;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setMarked({ subject: session.subject, time, confidence });
    toast.success(`✅ Attendance marked for ${session.subject} (${(confidence * 100).toFixed(0)}% match)`);
    setIsScanning(false);
  }, [isCameraOn, session.subject]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold">Scan Face to Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">Use your camera to verify your identity and mark attendance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="w-4 h-4" /> Live Camera — {session.subject}
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

                {!isCameraOn && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <CameraOff className="w-12 h-12" />
                    <p className="text-sm">Camera is off</p>
                    <Button onClick={startCamera} className="gradient-primary text-primary-foreground">
                      <Camera className="w-4 h-4 mr-2" /> Start Camera
                    </Button>
                  </div>
                )}

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

                {marked && !isScanning && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-success text-success-foreground gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Attendance Marked
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {isCameraOn ? (
                  <>
                    <Button onClick={handleScan} disabled={isScanning} className="gradient-primary text-primary-foreground">
                      <ScanFace className="w-4 h-4 mr-2" /> {isScanning ? 'Verifying...' : 'Scan My Face'}
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

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {marked ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div>
                      <p className="text-sm font-medium">Attendance Marked</p>
                      <p className="text-xs text-muted-foreground">{user?.name}</p>
                    </div>
                  </div>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="font-medium">{marked.subject}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{marked.time}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Match</span><Badge variant="outline">{(marked.confidence * 100).toFixed(0)}%</Badge></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ScanFace className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Not marked yet</p>
                  <p className="text-xs">Start camera and scan your face</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentFaceScan;
