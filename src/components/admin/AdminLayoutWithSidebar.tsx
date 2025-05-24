import React from 'react';
import type { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';
import { Helmet } from 'react-helmet';

interface AdminLayoutWithSidebarProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

/**
 * AdminLayoutWithSidebar component that provides a consistent layout for all admin pages
 * Includes the sidebar and main content area
 */
export default function AdminLayoutWithSidebar({
  children,
  title,
  description,
  action,
}: AdminLayoutWithSidebarProps) {
  const pageTitle = title ? `${title} | Admin Panel` : 'Admin Panel';

  // Add console log to debug
  console.log('Rendering AdminLayoutWithSidebar with title:', title);

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {description && <meta name='description' content={description} />}
      </Helmet>
      <div className='flex min-h-screen w-full bg-background'>
        <AdminSidebar />
        <div className='flex-1 p-8 overflow-hidden'>
          {title && (
            <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8'>
              <div>
                <h1 className='text-3xl font-bold mb-2'>{title}</h1>
                {description && (
                  <p className='text-muted-foreground'>{description}</p>
                )}
              </div>
              {action && <div className='mt-4 md:mt-0'>{action}</div>}
            </div>
          )}
          <div className='w-full'>{children}</div>
        </div>
      </div>
    </>
  );
}
