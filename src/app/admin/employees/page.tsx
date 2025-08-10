
'use client';

import * as React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import EmployeeManager from '@/components/admin/EmployeeManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function ManageEmployeesPage() {
    const { isAdmin, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/');
        }
    }, [isAdmin, loading, router]);

    if (loading) {
        return (
            <AppLayout>
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!isAdmin) {
        return (
            <AppLayout>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <Lock className="w-16 h-16 text-destructive mb-4" />
                    <h1 className="text-2xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground mt-2">
                        You do not have permission to view this page.
                    </p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
                <h1 className="text-3xl font-bold tracking-tight font-headline">Employee Management</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Manage All Employees</CardTitle>
                        <CardDescription>Add, edit, remove, and import employees. Data is stored live in Firestore.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <EmployeeManager />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
