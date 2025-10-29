"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserIcon, BookOpenIcon, MicIcon } from 'lucide-react';

export default function StartPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // If user is already authenticated, redirect to dashboard
      if (user) {
        router.push('/me/home');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-violet-600 p-3 rounded-xl">
              <MicIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to <span className="text-violet-600">Expressify</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Master your communication skills with AI-powered training. Practice conversations, 
            improve your vocal delivery, and build confidence in a safe environment.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="border-violet-200 dark:border-violet-800">
            <CardHeader>
              <BookOpenIcon className="h-8 w-8 text-violet-600 mb-2" />
              <CardTitle>Textual Practice</CardTitle>
              <CardDescription>
                Improve your writing and text-based communication skills
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-violet-200 dark:border-violet-800">
            <CardHeader>
              <MicIcon className="h-8 w-8 text-violet-600 mb-2" />
              <CardTitle>Vocal Training</CardTitle>
              <CardDescription>
                Practice speaking, pronunciation, and vocal delivery
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-violet-200 dark:border-violet-800">
            <CardHeader>
              <UserIcon className="h-8 w-8 text-violet-600 mb-2" />
              <CardTitle>Visual Practice</CardTitle>
              <CardDescription>
                Work on body language, presentation skills, and confidence
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Authentication Options */}
        <div className="max-w-md mx-auto">
          <Card className="border-violet-200 dark:border-violet-800 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Join thousands improving their communication skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/start/signup" className="w-full">
                <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                  Create Account
                </Button>
              </Link>
              <Link href="/start/signin" className="w-full">
                <Button variant="outline" className="w-full border-violet-300 text-violet-600 hover:bg-violet-50">
                  Sign In
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p>&copy; 2025 Expressify. Empowering confident communication.</p>
        </div>
      </div>
    </div>
  );
}