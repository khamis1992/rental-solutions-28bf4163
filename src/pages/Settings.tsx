import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { UserCog, Sliders } from "lucide-react";
const UserSettings = React.lazy(() => import("./UserSettings"));
const SystemSettings = React.lazy(() => import("./SystemSettings"));

const Settings: React.FC = () => {
  const [tab, setTab] = React.useState("user");
  return (
    <PageContainer>
      <SectionHeader
        title="Settings"
        description="Manage your user and system settings"
        icon={UserCog}
      />
      <Tabs value={tab} onValueChange={setTab} className="w-full mt-6">
        <TabsList>
          <TabsTrigger value="user">
            <UserCog className="h-4 w-4 mr-2" /> User Settings
          </TabsTrigger>
          <TabsTrigger value="system">
            <Sliders className="h-4 w-4 mr-2" /> System Settings
          </TabsTrigger>
        </TabsList>
        <TabsContent value="user" className="mt-4">
          <React.Suspense fallback={<div>Loading User Settings...</div>}>
            <UserSettings />
          </React.Suspense>
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          <React.Suspense fallback={<div>Loading System Settings...</div>}>
            <SystemSettings />
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Settings; 