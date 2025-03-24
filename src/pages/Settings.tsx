
import React from 'react';
import PageContainer from '@/components/layout/PageContainer';

const Settings = () => {
  return (
    <PageContainer
      title="System Settings"
      description="Configure system-wide settings for your rental business"
    >
      <div className="space-y-6">
        <div className="text-center p-12">
          <h2 className="text-2xl font-semibold">Settings Page</h2>
          <p className="mt-2 text-muted-foreground">
            This page will contain system settings functionality.
          </p>
        </div>
      </div>
    </PageContainer>
  );
};

export default Settings;
