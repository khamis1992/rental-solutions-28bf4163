// @ts-nocheck
/* eslint-disable */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Switch } from '@/components/ui/switch';
import { Settings, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { VehicleData } from '@/types/vehicle.types';
import { useVehicleDetail } from '@/hooks/use-vehicle-detail';
import { VehicleStatusQuickUpdate } from '@/components/vehicles/VehicleStatusQuickUpdate';
import { toast } from 'sonner';

interface VehicleSettingsTabProps {
  vehicle: VehicleData;
}

export const VehicleSettingsTab: React.FC<VehicleSettingsTabProps> = ({ vehicle }) => {
  const { language } = useLanguage();
  const { updateVehicle, isUpdating } = useVehicleDetail(vehicle.id);
  const [isEditing, setIsEditing] = useState(false);
  const [editedVehicle, setEditedVehicle] = useState({
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: vehicle.year || '',
    color: vehicle.color || '',
    license_plate: vehicle.license_plate || '',
    vin: vehicle.vin || '',
    rent_amount: vehicle.rent_amount || 0,
    mileage: vehicle.mileage || 0
  });

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [autoMaintenance, setAutoMaintenance] = useState(false);
  const [trackMileage, setTrackMileage] = useState(true);

  const handleSave = async () => {
    try {
      await updateVehicle(editedVehicle);
      setIsEditing(false);
      toast.success(language === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'Changes saved successfully');
    } catch (error) {
      toast.error(language === 'ar' ? 'فشل في حفظ التغييرات' : 'Failed to save changes');
    }
  };

  const handleCancel = () => {
    setEditedVehicle({
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      license_plate: vehicle.license_plate || '',
      vin: vehicle.vin || '',
      rent_amount: vehicle.rent_amount || 0,
      mileage: vehicle.mileage || 0
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Vehicle Status Quick Update */}
      <VehicleStatusQuickUpdate vehicle={vehicle} />
      
      {/* Vehicle Information Settings */}
      <Card>
        <CardHeader>
          <div className={`flex justify-between items-start ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Edit className="h-5 w-5" />
                {language === 'ar' ? 'معلومات المركبة' : 'Vehicle Information'}
              </CardTitle>
              <CardDescription className={language === 'ar' ? 'text-right' : ''}>
                {language === 'ar' ? 'تحديث معلومات المركبة الأساسية' : 'Update basic vehicle information'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={isUpdating}
                    className={language === 'ar' ? 'flex-row-reverse' : ''}
                  >
                    <Save className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancel}
                    className={language === 'ar' ? 'flex-row-reverse' : ''}
                  >
                    <X className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className={language === 'ar' ? 'flex-row-reverse' : ''}
                >
                  <Edit className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                  {language === 'ar' ? 'تحرير' : 'Edit'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="make">{language === 'ar' ? 'الماركة' : 'Make'}</Label>
              <Input
                id="make"
                value={editedVehicle.make}
                onChange={(e) => setEditedVehicle(prev => ({ ...prev, make: e.target.value }))}
                disabled={!isEditing}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="model">{language === 'ar' ? 'الموديل' : 'Model'}</Label>
              <Input
                id="model"
                value={editedVehicle.model}
                onChange={(e) => setEditedVehicle(prev => ({ ...prev, model: e.target.value }))}
                disabled={!isEditing}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="year">{language === 'ar' ? 'السنة' : 'Year'}</Label>
              <Input
                id="year"
                type="number"
                value={editedVehicle.year}
                onChange={(e) => setEditedVehicle(prev => ({ ...prev, year: parseInt(e.target.value) || 0 }))}
                disabled={!isEditing}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="color">{language === 'ar' ? 'اللون' : 'Color'}</Label>
              <Input
                id="color"
                value={editedVehicle.color}
                onChange={(e) => setEditedVehicle(prev => ({ ...prev, color: e.target.value }))}
                disabled={!isEditing}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="license_plate">{language === 'ar' ? 'لوحة الترخيص' : 'License Plate'}</Label>
              <Input
                id="license_plate"
                value={editedVehicle.license_plate}
                onChange={(e) => setEditedVehicle(prev => ({ ...prev, license_plate: e.target.value }))}
                disabled={!isEditing}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="vin">{language === 'ar' ? 'رقم الهيكل' : 'VIN'}</Label>
              <Input
                id="vin"
                value={editedVehicle.vin}
                onChange={(e) => setEditedVehicle(prev => ({ ...prev, vin: e.target.value }))}
                disabled={!isEditing}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="rent_amount">{language === 'ar' ? 'السعر اليومي (ر.ق)' : 'Daily Rate (QAR)'}</Label>
              <Input
                id="rent_amount"
                type="number"
                value={editedVehicle.rent_amount}
                onChange={(e) => setEditedVehicle(prev => ({ ...prev, rent_amount: parseFloat(e.target.value) || 0 }))}
                disabled={!isEditing}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="mileage">{language === 'ar' ? 'عداد المسافة (كم)' : 'Mileage (km)'}</Label>
              <Input
                id="mileage"
                type="number"
                value={editedVehicle.mileage}
                onChange={(e) => setEditedVehicle(prev => ({ ...prev, mileage: parseFloat(e.target.value) || 0 }))}
                disabled={!isEditing}
                className={language === 'ar' ? 'text-right' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <Settings className="h-5 w-5" />
            {language === 'ar' ? 'تفضيلات المركبة' : 'Vehicle Preferences'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'إعدادات وتفضيلات المركبة' : 'Vehicle settings and preferences'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="notifications" className="text-base font-medium">
                {language === 'ar' ? 'تفعيل التنبيهات' : 'Enable Notifications'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'استقبال تنبيهات حول الصيانة والاستحقاقات' : 'Receive notifications about maintenance and due dates'}
              </p>
            </div>
            <Switch 
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="auto-maintenance" className="text-base font-medium">
                {language === 'ar' ? 'الصيانة التلقائية' : 'Auto Maintenance'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'جدولة الصيانة تلقائياً حسب المسافة والوقت' : 'Schedule maintenance automatically based on mileage and time'}
              </p>
            </div>
            <Switch 
              id="auto-maintenance"
              checked={autoMaintenance}
              onCheckedChange={setAutoMaintenance}
            />
          </div>

          <div className={`flex items-center justify-between ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <div className={language === 'ar' ? 'text-right' : ''}>
              <Label htmlFor="track-mileage" className="text-base font-medium">
                {language === 'ar' ? 'تتبع المسافة' : 'Track Mileage'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'تتبع المسافة المقطوعة تلقائياً' : 'Automatically track mileage'}
              </p>
            </div>
            <Switch 
              id="track-mileage"
              checked={trackMileage}
              onCheckedChange={setTrackMileage}
            />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 text-red-600 ${language === 'ar' ? 'flex-row-reverse text-right' : ''}`}>
            <AlertTriangle className="h-5 w-5" />
            {language === 'ar' ? 'منطقة الخطر' : 'Danger Zone'}
          </CardTitle>
          <CardDescription className={language === 'ar' ? 'text-right' : ''}>
            {language === 'ar' ? 'إجراءات لا يمكن التراجع عنها' : 'Irreversible actions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${language === 'ar' ? 'text-right' : ''}`}>
            <h4 className="font-medium text-red-900 mb-2">
              {language === 'ar' ? 'حذف المركبة' : 'Delete Vehicle'}
            </h4>
            <p className="text-sm text-red-700 mb-3">
              {language === 'ar' ? 'سيتم حذف هذه المركبة نهائياً مع جميع البيانات المرتبطة بها.' : 'This will permanently delete this vehicle and all associated data.'}
            </p>
            <Button variant="destructive" size="sm">
              {language === 'ar' ? 'حذف المركبة' : 'Delete Vehicle'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
