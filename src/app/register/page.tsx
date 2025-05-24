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
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions'
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { isAuthenticated, isLoading: authLoading, registerMutation } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      acceptTerms: false
    }
  });

  const onSubmit = (data: RegisterFormData) => {
    setIsSubmitting(true);
    registerMutation.mutate({
      email: data.email,
      username: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      agreeToTerms: data.acceptTerms,
      agreeToPrivacy: data.acceptTerms,
    }, {
      onSettled: () => {
        setIsSubmitting(false);
      }
    });
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
            <CardTitle className='text-2xl'>Create Account</CardTitle>
            <CardDescription>
              Sign up to start trading cryptocurrencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='firstName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder='First name' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='lastName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder='Last name' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                        <Input
                          type='password'
                          placeholder='Create a secure password'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder='Confirm your password'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='phoneNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter your phone number' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='acceptTerms'
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
                          I accept the{' '}
                          <a
                            href='/terms'
                            className='text-primary underline-offset-4 hover:underline'
                          >
                            Terms of Service
                          </a>
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
                  Create Account
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className='flex justify-center'>
            <p className='text-sm text-muted-foreground'>
              Already have an account?{' '}
              <a
                href='/login'
                className='text-primary underline-offset-4 hover:underline'
              >
                Sign In
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>

      {/* Hero Column */}
      <div className='flex-1 bg-gradient-to-br from-primary/20 to-primary/10 hidden md:flex flex-col justify-center p-12'>
        <div className='max-w-md'>
          <h1 className='text-4xl font-bold mb-6'>Join Our Trading Platform</h1>
          <p className='text-lg mb-6'>
            Start trading cryptocurrencies with our advanced platform. Get
            access to powerful tools, real-time market data, and multiple
            trading strategies.
          </p>
          <ul className='space-y-4'>
            <li className='flex items-start'>
              <div className='h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5'>
                <span className='text-primary text-sm font-bold'>1</span>
              </div>
              <div>
                <h3 className='font-semibold'>Create an Account</h3>
                <p className='text-sm text-muted-foreground'>
                  Sign up in minutes with just your email
                </p>
              </div>
            </li>
            <li className='flex items-start'>
              <div className='h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5'>
                <span className='text-primary text-sm font-bold'>2</span>
              </div>
              <div>
                <h3 className='font-semibold'>Verify Your Identity</h3>
                <p className='text-sm text-muted-foreground'>
                  Complete the KYC process to unlock all features
                </p>
              </div>
            </li>
            <li className='flex items-start'>
              <div className='h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5'>
                <span className='text-primary text-sm font-bold'>3</span>
              </div>
              <div>
                <h3 className='font-semibold'>Start Trading</h3>
                <p className='text-sm text-muted-foreground'>
                  Deposit funds and begin trading with multiple strategies
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 