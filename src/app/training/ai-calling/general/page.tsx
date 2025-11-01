"use client";

import { useState, useEffect, useRef } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { ExpressifySidebar } from '@/components/ui/expressify-sidebar';
import { LearningHeader } from '@/components/ui/learning-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Clock, AlertCircle, Activity, CheckCircle2, XCircle, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CallLog {
  id: string;
  type: 'system' | 'info' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

const BACKEND_URL = 'http://localhost:5000';
const DEFAULT_PHONE = '+919041107458';

export default function GeneralCallPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callLogs, setCallLogs] = useState<CallLog[]>([
    {
      id: '1',
      type: 'system',
      message: 'System ready. Click "Start Call" to begin your AI conversation practice.',
      timestamp: new Date(),
    },
  ]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [callLogs]);

  // Call duration timer
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setCallDuration(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addLog = (type: 'system' | 'info' | 'success' | 'error', message: string) => {
    const newLog: CallLog = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
    };
    setCallLogs((prev) => [...prev, newLog]);
  };

  const handleStartCall = async () => {
    setIsLoading(true);
    addLog('info', 'Initiating call to backend server...');

    try {
      const response = await fetch(`${BACKEND_URL}/make-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: DEFAULT_PHONE,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsCallActive(true);
        setCallSid(data.sid);
        addLog('success', `Call initiated successfully! Call SID: ${data.sid}`);
        addLog('info', `Calling ${DEFAULT_PHONE}...`);
        addLog('system', 'AI assistant will introduce itself when you answer.');
      } else {
        throw new Error(data.error || 'Failed to initiate call');
      }
    } catch (error) {
      addLog('error', `Failed to start call: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Call error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallSid(null);
    addLog('system', 'Call session ended. Ready for a new call.');
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'error':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'info':
        return <Info className="h-3.5 w-3.5" />;
      case 'system':
        return <Activity className="h-3.5 w-3.5" />;
      default:
        return <Info className="h-3.5 w-3.5" />;
    }
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <ExpressifySidebar />
        <SidebarInset>
          <LearningHeader trainingType="ai-calling" currentGame="general-call" />
          
          <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4">
            <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
              <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
                
                {/* Header Section */}
                <div className="px-2 sm:px-0">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <Phone className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        AI Call Practice
                      </h1>
                      <p className="text-sm text-muted-foreground sm:text-base">
                        Practice conversations with our intelligent AI assistant
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
                  
                  {/* Left Column - Call Controls */}
                  <div className="space-y-4 sm:space-y-6">
                    
                    {/* Call Status Card */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">Call Status</CardTitle>
                        <CardDescription>Current session information</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        
                        {/* Status Display */}
                        <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 text-center space-y-3 border border-border/50">
                          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                            {isCallActive ? (
                              <Phone className="h-8 w-8 text-white animate-pulse" />
                            ) : isLoading ? (
                              <Clock className="h-8 w-8 text-white animate-spin" />
                            ) : (
                              <Phone className="h-8 w-8 text-white" />
                            )}
                          </div>
                          
                          <div>
                            <Badge variant={isCallActive ? "default" : "secondary"} className="mb-2">
                              {isCallActive ? "Active" : isLoading ? "Connecting" : "Inactive"}
                            </Badge>
                            <h3 className="font-semibold text-base">
                              {isCallActive 
                                ? "Call in Progress" 
                                : isLoading 
                                ? "Connecting..." 
                                : "Ready to Start"}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {isCallActive 
                                ? `Duration: ${formatDuration(callDuration)}` 
                                : isLoading
                                ? "Initiating call..."
                                : "Start a new session"}
                            </p>
                          </div>
                        </div>

                        {/* Call Action Button */}
                        {!isCallActive ? (
                          <Button
                            onClick={handleStartCall}
                            className="w-full h-12"
                            size="lg"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Clock className="mr-2 h-5 w-5 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Phone className="mr-2 h-5 w-5" />
                                Start Call
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleEndCall}
                            variant="destructive"
                            className="w-full h-12"
                            size="lg"
                          >
                            <PhoneOff className="mr-2 h-5 w-5" />
                            End Session
                          </Button>
                        )}

                        {/* Session Info */}
                        {callSid && (
                          <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Session ID</p>
                            <p className="text-xs font-mono">{callSid}</p>
                          </div>
                        )}

                      </CardContent>
                    </Card>

                    {/* Quick Guide Card */}
                    <Card className="border-border/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-yellow-500" />
                          Quick Guide
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold">1.</span>
                            <span>Click "Start Call" to initiate</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-green-500 font-bold">2.</span>
                            <span>Answer your phone when it rings</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-purple-500 font-bold">3.</span>
                            <span>Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">0</kbd> after speaking</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-500 font-bold">4.</span>
                            <span>Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded">5</kbd> to end call</span>
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                  </div>

                  {/* Right Column - Call Logs (Takes 2 columns on XL) */}
                  <div className="xl:col-span-2">
                    <Card className="border-border/50 h-full flex flex-col">
                      <CardHeader className="flex-shrink-0 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Activity className="h-5 w-5 text-purple-500" />
                              System Logs
                            </CardTitle>
                            <CardDescription>Real-time activity and status updates</CardDescription>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {callLogs.length} {callLogs.length === 1 ? 'log' : 'logs'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
                        {/* Logs Container with Scroll */}
                        <div className="flex-1 overflow-y-auto px-6 pb-4">
                          <div className="space-y-2">
                            {callLogs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0"
                              >
                                <div className="mt-0.5 flex-shrink-0 text-muted-foreground">
                                  {getLogIcon(log.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm leading-relaxed break-words">
                                    {log.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {log.timestamp.toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            ))}
                            <div ref={logsEndRef} />
                          </div>
                        </div>

                        {/* Info Footer */}
                        <div className="flex-shrink-0 px-6 py-3 border-t border-border/50 bg-muted/20">
                          <div className="flex items-start gap-2 text-xs text-muted-foreground">
                            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed">
                              These logs display system events and call status. 
                              The actual conversation happens on your phone with the AI assistant.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
