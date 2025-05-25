'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean()
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password, data.rememberMe);
      toast({
        title: "로그인 성공",
        description: "환영합니다!",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "로그인 실패",
        description: error.message || "이메일 또는 비밀번호를 확인해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='flex flex-col md:flex-row min-h-screen'>
      {/* Form Column */}
      <div className='flex-1 flex items-center justify-center p-6'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-2xl'>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue trading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter your email' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className='relative'>
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder='Enter your password'
                            {...field}
                          />
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className='h-4 w-4' />
                            ) : (
                              <Eye className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='rememberMe'
                  render={({ field }) => (
                    <FormItem>
                      <div className='flex items-center space-x-2'>
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormLabel className='text-sm font-normal'>
                          Remember me
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='submit'
                  className='w-full'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : null}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className='flex justify-center'>
            <p className='text-sm text-muted-foreground'>
              Don&apos;t have an account?{' '}
              <a
                href='/register'
                className='text-primary underline-offset-4 hover:underline'
              >
                Sign Up
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Hero Column */}
      <div className='flex-1 bg-gradient-to-br from-primary/20 to-primary/10 hidden md:flex flex-col justify-center p-12'>
        <div className='max-w-md'>
          <h1 className='text-4xl font-bold mb-6'>Welcome to QuantTrade</h1>
          <p className='text-lg mb-6'>
            Access your trading dashboard and manage your cryptocurrency investments with our advanced platform.
          </p>
          <ul className='space-y-4'>
            <li className='flex items-start'>
              <div className='h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5'>
                <span className='text-primary text-sm font-bold'>✓</span>
              </div>
              <div>
                <h3 className='font-semibold'>Secure Access</h3>
                <p className='text-sm text-muted-foreground'>
                  Your account is protected with advanced security
                </p>
              </div>
            </li>
            <li className='flex items-start'>
              <div className='h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5'>
                <span className='text-primary text-sm font-bold'>✓</span>
              </div>
              <div>
                <h3 className='font-semibold'>Real-time Trading</h3>
                <p className='text-sm text-muted-foreground'>
                  Execute trades instantly with live market data
                </p>
              </div>
            </li>
            <li className='flex items-start'>
              <div className='h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5'>
                <span className='text-primary text-sm font-bold'>✓</span>
              </div>
              <div>
                <h3 className='font-semibold'>Portfolio Management</h3>
                <p className='text-sm text-muted-foreground'>
                  Track and manage your investments effectively
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 