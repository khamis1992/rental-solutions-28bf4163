// @ts-nocheck
/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FileText,
  AlertTriangle,
  DownloadCloud,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { VehicleData } from '@/types/vehicle.types';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1'];

const ComplianceReporting = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, make, model, year, license_plate, insurance_expiry, inspection_expiry');
      if (!error && data) setVehicles(data as VehicleData[]);
      setLoading(false);
    };
    fetchVehicles();
  }, []);

  // Helper to check expiry status
  const getStatus = (expiry: string | null | undefined) => {
    if (!expiry) return 'missing';
    const exp = new Date(expiry);
    const now = new Date();
    const soon = new Date();
    soon.setDate(now.getDate() + 14); // 14 days = expiring soon
    if (exp < now) return 'expired';
    if (exp >= now && exp <= soon) return 'expiring';
    return 'valid';
  };

  // Calculate compliance stats
  const insuranceStats = { valid: 0, expired: 0, expiring: 0, missing: 0 };
  const inspectionStats = { valid: 0, expired: 0, expiring: 0, missing: 0 };
  vehicles.forEach(v => {
    insuranceStats[getStatus(v.insurance_expiry)]++;
    inspectionStats[getStatus(v.inspection_expiry)]++;
  });

  const totalVehicles = vehicles.length;
  const compliant = insuranceStats.valid + inspectionStats.valid;
  const nonCompliant = insuranceStats.expired + insuranceStats.missing + inspectionStats.expired + inspectionStats.missing;
  const expiringSoon = insuranceStats.expiring + inspectionStats.expiring;

  // Data for charts
  const complianceData = [
    { name: 'Insurance', compliant: insuranceStats.valid, nonCompliant: insuranceStats.expired + insuranceStats.missing },
    { name: 'Inspection', compliant: inspectionStats.valid, nonCompliant: inspectionStats.expired + inspectionStats.missing },
  ];
  const statusData = [
    { name: 'Compliant', value: compliant },
    { name: 'Non-Compliant', value: nonCompliant },
    { name: 'Expiring Soon', value: expiringSoon },
  ];

  // Urgent issues
  const urgentInsurance = vehicles.filter(v => getStatus(v.insurance_expiry) === 'expired' || getStatus(v.insurance_expiry) === 'expiring');
  const urgentInspection = vehicles.filter(v => getStatus(v.inspection_expiry) === 'expired' || getStatus(v.inspection_expiry) === 'expiring');

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-semibold">Compliance Status Overview</CardTitle>
              <CardDescription>Summary of regulatory compliance across the fleet</CardDescription>
            </div>
            <Button variant="outline" className="flex items-center">
              <DownloadCloud className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-green-50">
                  <div>
                    <p className="text-sm font-medium text-green-600">Compliant</p>
                    <h3 className="text-2xl font-bold text-green-700">{totalVehicles ? Math.round((compliant / (totalVehicles * 2)) * 100) : 0}%</h3>
                    <p className="text-xs text-green-500">{compliant} records</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-red-50">
                  <div>
                    <p className="text-sm font-medium text-red-600">Non-Compliant</p>
                    <h3 className="text-2xl font-bold text-red-700">{totalVehicles ? Math.round((nonCompliant / (totalVehicles * 2)) * 100) : 0}%</h3>
                    <p className="text-xs text-red-500">{nonCompliant} records</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50">
                  <div>
                    <p className="text-sm font-medium text-amber-600">Expiring Soon</p>
                    <h3 className="text-2xl font-bold text-amber-700">{totalVehicles ? Math.round((expiringSoon / (totalVehicles * 2)) * 100) : 0}%</h3>
                    <p className="text-xs text-amber-500">{expiringSoon} records</p>
                  </div>
                  <div className="bg-amber-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Compliance by Document Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={complianceData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={120} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="compliant" name="Compliant" fill="#10b981" />
                          <Bar dataKey="nonCompliant" name="Non-Compliant" fill="#ef4444" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">Overall Compliance Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Urgent Compliance Issues */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Urgent Compliance Issues</CardTitle>
          <CardDescription>Vehicles with expired or soon-to-expire insurance/inspection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              {urgentInsurance.length === 0 && urgentInspection.length === 0 ? (
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>All vehicles are compliant</AlertTitle>
                  <AlertDescription>No urgent compliance issues found.</AlertDescription>
                </Alert>
              ) : (
                <>
                  {urgentInsurance.length > 0 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Insurance Issues</AlertTitle>
                      <AlertDescription>
                        {urgentInsurance.length} vehicle(s) have insurance expired or expiring soon.
                        <ul className="mt-2 list-disc list-inside">
                          {urgentInsurance.map(v => (
                            <li key={v.id}>{v.make} {v.model} ({v.license_plate}) - {v.insurance_expiry ? `Expires: ${v.insurance_expiry}` : 'No expiry set'}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                  {urgentInspection.length > 0 && (
                    <Alert variant="warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Inspection Issues</AlertTitle>
                      <AlertDescription>
                        {urgentInspection.length} vehicle(s) have inspection expired or expiring soon.
                        <ul className="mt-2 list-disc list-inside">
                          {urgentInspection.map(v => (
                            <li key={v.id}>{v.make} {v.model} ({v.license_plate}) - {v.inspection_expiry ? `Expires: ${v.inspection_expiry}` : 'No expiry set'}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplianceReporting;
