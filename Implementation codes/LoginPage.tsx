import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, GraduationCap, BookOpen, UserCheck, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const roles: { role: UserRole; label: string; icon: React.ElementType; desc: string }[] = [
  { role: 'admin', label: 'Administrator', icon: Shield, desc: 'Full system access & analytics' },
  { role: 'faculty', label: 'Faculty', icon: BookOpen, desc: 'Mark attendance & view reports' },
  { role: 'student', label: 'Student', icon: GraduationCap, desc: 'View your attendance & alerts' },
];

const LoginPage: React.FC = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password, fullName, selectedRole, department, rollNo);
        toast.success('Account created! Redirecting...');
      } else {
        await login(email, password);
        toast.success('Signed in!');
      }
      // Navigation handled by auth state change in App
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary-foreground">AttendAI</span>
          </div>
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight mb-4">
            AI-Powered<br />Attendance<br />Monitoring
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-sm">
            Smart attendance tracking with face recognition, predictive analytics, and real-time insights.
          </p>
        </div>
        <div className="relative z-10 space-y-4">
          {['Face Recognition & Liveness Detection', 'Predictive Risk Analysis', 'Real-time Dashboards & Reports'].map((feature) => (
            <div key={feature} className="flex items-center gap-3 text-primary-foreground/90">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-primary-foreground/5" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">AttendAI</span>
          </div>

          <h2 className="text-2xl font-bold mb-1">{isSignup ? 'Create Account' : 'Welcome back'}</h2>
          <p className="text-muted-foreground mb-8">
            {isSignup ? 'Sign up to get started with AttendAI' : 'Sign in to your account to continue'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Role</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {roles.map(({ role, label, icon: Icon }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          selectedRole === role
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <Icon className={`w-5 h-5 mx-auto mb-1 ${selectedRole === role ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" required />
                </div>

                {selectedRole === 'student' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Computer Science" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll No</Label>
                      <Input id="rollNo" value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="CS2024001" />
                    </div>
                  </div>
                )}

                {selectedRole === 'faculty' && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" value={department} onChange={e => setDepartment(e.target.value)} placeholder="Computer Science" />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>

            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-11 font-medium">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isSignup ? 'Create Account' : 'Sign In'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary font-medium hover:underline"
            >
              {isSignup ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
