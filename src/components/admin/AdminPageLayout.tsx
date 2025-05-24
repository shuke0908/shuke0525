import React from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export default function AdminPageLayout({
  children,
  title,
  description,
}: AdminPageLayoutProps) {
  return (
    <div className='flex min-h-screen'>
      <AdminSidebar />
      <div className='flex-1 p-8'>
        {title && (
          <>
            <h1 className='text-3xl font-bold mb-2'>{title}</h1>
            {description && (
              <p className='text-muted-foreground mb-8'>{description}</p>
            )}
          </>
        )}
        {children}
      </div>
    </div>
  );
}
