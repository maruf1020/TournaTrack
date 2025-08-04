
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
import { Trophy } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getPlayerByEmail } from '@/lib/services';


const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

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

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsSubmitting(true);
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        
        // After successful sign-in, check their profile for admin status
        if (userCredential.user && userCredential.user.email) {
            const playerProfile = await getPlayerByEmail(userCredential.user.email);
            if (playerProfile) {
                toast({
                    title: 'Login Successful',
                    description: playerProfile.isAdmin ? 'Welcome back, Admin!' : 'Welcome back!',
                });
            } else {
                 toast({
                    title: 'Login Successful',
                    description: 'Welcome! Your profile is not in the employee database.',
                });
            }
             // Now that we have confirmed the user and their potential role, we can redirect.
            // The useAuth hook will have the correct data on the next page load.
            router.push('/');
        }

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
            <CardTitle className="text-2xl font-headline">ELXC TournaTrack</CardTitle>
            <CardDescription>
              Enter your admin credentials to sign in.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Powered by Firebase & Next.js
        </p>
      </div>
    </div>
  );
}
