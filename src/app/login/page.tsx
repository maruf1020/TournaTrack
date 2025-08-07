
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Mail } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { getPlayerByEmail } from '@/lib/services';
import { Separator } from '@/components/ui/separator';


const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

const MicrosoftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M7.462 0H0v7.462h7.462V0zM16 0H8.538v7.462H16V0zM7.462 8.538H0V16h7.462V8.538zM16 8.538H8.538V16H16V8.538z"/>
    </svg>
)

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const handleCreateAdmin = async (data: LoginFormInputs) => {
     try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        toast({
            title: 'Admin Account Created & Logged In',
            description: 'Welcome, Admin!',
        });
        router.push('/');
    } catch (signupError: any) {
        toast({
            variant: 'destructive',
            title: 'Error Creating Admin Account',
            description: `Could not create admin user. Please check the Firebase console. Error: ${signupError.code}`,
        });
    }
  }

  const handleSuccessfulLogin = async (email: string | null) => {
     if (email) {
        const playerProfile = await getPlayerByEmail(email);
        toast({
            title: 'Login Successful',
            description: playerProfile?.isAdmin ? 'Welcome back, Admin!' : 'Welcome back!',
        });
    } else {
         toast({
            title: 'Login Successful',
            description: 'Welcome! Your profile could not be found.',
        });
    }
    router.push('/');
  }

  const handleMicrosoftSignIn = async () => {
    setIsSubmitting(true);
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      // tenant: 'echologyx.com', //on live
      tenant: 'testwebsitecontoso.store', //for testing
    });
    
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await handleSuccessfulLogin(user.email);
    } catch (error: any) {
        // Handle specific OAuth errors
        if (error.code === 'auth/account-exists-with-different-credential') {
            toast({
                variant: 'destructive',
                title: 'Authentication Error',
                description: 'An account already exists with the same email address but different sign-in credentials. Please use the original method to sign in.',
            });
        } else {
             toast({
                variant: 'destructive',
                title: 'Error Signing In',
                description: error.message || 'An unexpected error occurred during Microsoft sign-in.',
            });
        }
    } finally {
        setIsSubmitting(false);
    }
  }


  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsSubmitting(true);
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        await handleSuccessfulLogin(userCredential.user.email);
    } catch (error: any) {
        // If user does not exist, try creating the user for the first time.
        // This is useful for the initial setup.
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
           if (data.email === 'admin@echologyx.com') {
             await handleCreateAdmin(data);
           } else {
             toast({
                variant: "destructive",
                title: "Invalid Credentials",
                description: "Please check your email and password.",
             });
           }
        } else if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
             toast({
                variant: 'destructive',
                title: 'Firebase Configuration Error',
                description: 'Email/Password sign-in is not enabled. Please enable it in the Firebase console.',
            });
        }
        else {
            toast({
                variant: 'destructive',
                title: 'Error Signing In',
                description: error.message,
            });
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Tour Console</CardTitle>
            <CardDescription>
              Sign in to manage your tournaments.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full flex items-center gap-2" onClick={handleMicrosoftSignIn} disabled={isSubmitting}>
               <MicrosoftIcon /> Sign in with Microsoft
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@echologyx.com"
                  {...register('email')}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
               <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Sign In with Email'}
              </Button>
            </form>
          </CardContent>
          
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by Firebase & Next.js
        </p>
      </div>
    </div>
  );
}
