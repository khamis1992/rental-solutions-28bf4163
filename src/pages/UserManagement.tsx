import React, { useEffect, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { SectionHeader } from "@/components/ui/section-header";
import { Users, UserPlus, Shield, ShieldCheck, Search } from "lucide-react";
import { useProfile } from "@/contexts/ProfileContext";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomButton } from "@/components/ui/custom-button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import RolePermissionsTable from "@/components/auth/RolePermissionsTable";
import SecurityPreferences from "@/components/auth/SecurityPreferences";
import { Input } from "@/components/ui/input";

const UserManagement = () => {
  const { profile, isLoading } = useProfile();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, status, created_at")
      .not("role", "eq", "customer");
    if (error) {
      toast.error("فشل في تحميل المستخدمين: " + error.message);
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) {
      toast.error("فشل في تحديث الدور: " + error.message);
    } else {
      toast.success("تم تحديث دور المستخدم");
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setUpdatingId(null);
  };

  // Filtering and searching
  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesSearch =
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </PageContainer>
    );
  }

  // Only block access if you want to restrict to admins:
  // const isAdmin = profile?.role === "admin";
  // if (!isAdmin) {
  //   toast.error("You don't have permission to access this page");
  //   return <Navigate to="/dashboard" replace />;
  // }

  return (
    <PageContainer>
      <SectionHeader
        title="إدارة المستخدمين"
        description="إدارة مستخدمي النظام والأدوار والصلاحيات"
        icon={Users}
        actions={
          <CustomButton
            size="sm"
            variant="default"
            onClick={() => toast('تم إرسال دعوة المستخدم')}
          >
            <UserPlus className="h-3 w-3 ml-2" />
            دعوة مستخدم
          </CustomButton>
        }
      />
      <div className="space-y-5" dir="rtl">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex">
            <TabsTrigger value="users" className="flex items-center space-x-reverse space-x-2 text-sm">
              <Users className="h-3 w-3 ml-2" />
              المستخدمون
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center space-x-reverse space-x-2 text-sm">
              <Shield className="h-3 w-3 ml-2" />
              الصلاحيات
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-reverse space-x-2 text-sm">
              <ShieldCheck className="h-3 w-3 ml-2" />
              الأمان
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-5">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-right text-lg">المستخدمون</CardTitle>
                <CardDescription className="text-right text-sm">قائمة المستخدمين وأدوارهم</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute right-2 top-2.5 h-3 w-3 text-muted-foreground" />
                    <Input
                      placeholder="البحث في المستخدمين بالاسم أو البريد الإلكتروني..."
                      className="pr-8 text-right h-9 text-sm"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      dir="rtl"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto flex-row-reverse">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[140px] h-9 text-sm">
                        <SelectValue placeholder="تصفية حسب الدور" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">جميع الأدوار</SelectItem>
                        <SelectItem value="admin">مدير</SelectItem>
                        <SelectItem value="staff">موظف</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading} className="h-9 text-sm">
                      تحديث
                    </Button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:bg-gray-900">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-right font-semibold text-sm">الاسم</th>
                        <th className="px-3 py-2 text-right font-semibold text-sm">البريد الإلكتروني</th>
                        <th className="px-3 py-2 text-right font-semibold text-sm">الدور</th>
                        <th className="px-3 py-2 text-right font-semibold text-sm">الحالة</th>
                        <th className="px-3 py-2 text-right font-semibold text-sm">تاريخ الانضمام</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan={5} className="text-center py-6 text-sm">جاري تحميل المستخدمين...</td></tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-6 text-muted-foreground text-sm">لم يتم العثور على مستخدمين.</td></tr>
                      ) : (
                        filteredUsers.map(user => (
                          <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-3 py-2 font-medium text-right text-sm">{user.full_name || 'غير متوفر'}</td>
                            <td className="px-3 py-2 text-right text-sm">{user.email}</td>
                            <td className="px-3 py-2">
                              <Select
                                value={user.role}
                                onValueChange={val => handleRoleChange(user.id, val)}
                                disabled={profile?.id === user.id || updatingId === user.id}
                              >
                                <SelectTrigger className="w-[120px] h-8 text-sm">
                                  <SelectValue placeholder="اختر الدور" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">مدير</SelectItem>
                                  <SelectItem value="staff">موظف</SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-2 capitalize text-right text-sm">
                              {user.status === 'active' ? 'نشط' : 
                               user.status === 'inactive' ? 'غير نشط' : 
                               user.status === 'pending' ? 'معلق' : 
                               user.status || 'غير متوفر'}
                            </td>
                            <td className="px-3 py-2 text-right text-sm">{user.created_at ? new Date(user.created_at).toLocaleDateString('ar-QA') : 'غير متوفر'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="permissions" className="mt-5">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-right text-lg">صلاحيات الأدوار</CardTitle>
                <CardDescription className="text-right text-sm">
                  تحديد ما يمكن لكل دور الوصول إليه في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RolePermissionsTable />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security" className="mt-5">
            <SecurityPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default UserManagement;
