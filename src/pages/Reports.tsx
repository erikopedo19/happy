import { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";
import { Download, FileText, Calendar, Users, Scissors, TrendingUp, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const db = supabase as any;

// Country data (same as dashboard)
const countryData = [
  { country: 'United Kingdom', orders: '12.3K', percent: 80, flag: '🇬🇧' },
  { country: 'United States', orders: '10.8K', percent: 60, flag: '🇺🇸' },
  { country: 'Sweden', orders: '6,023', percent: 40, flag: '🇸🇪' },
  { country: 'Turkey', orders: '3,512', percent: 30, flag: '🇹🇷' },
  { country: 'Germany', orders: '2,891', percent: 25, flag: '🇩🇪' },
];

interface Service {
  id: string;
  name: string;
  color: string | null;
}

const Reports = () => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('last30days');

  // Fetch services for the services breakdown
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['services', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await db
        .from('services')
        .select('id, name, color')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Mock data for services breakdown (in real app, this would come from appointments aggregation)
  const servicesData = services.length > 0 ? services.map((service, index) => ({
    name: service.name,
    appointments: [45, 38, 32, 28, 22, 18, 15, 12][index % 8] || 10,
    percent: [80, 65, 55, 45, 35, 28, 22, 18][index % 8] || 15,
    color: service.color || 'bg-blue-50',
  })) : [];

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="h-screen flex w-full bg-[#f8f9fa] overflow-hidden">
        <AppSidebar />
        <main className="flex-1 bg-[#f8f9fa] flex flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 p-4 lg:hidden shadow-sm">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
                <p className="text-gray-500 mt-1">View detailed analytics and insights</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-40 bg-white border-gray-200">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="last7days">Last 7 days</SelectItem>
                    <SelectItem value="last30days">Last 30 days</SelectItem>
                    <SelectItem value="thisMonth">This month</SelectItem>
                    <SelectItem value="lastMonth">Last month</SelectItem>
                    <SelectItem value="thisYear">This year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="border-gray-200">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Total Customers</p>
                      <p className="text-xl font-semibold text-gray-900">1,248</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <Scissors className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Appointments</p>
                      <p className="text-xl font-semibold text-gray-900">3,456</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Revenue</p>
                      <p className="text-xl font-semibold text-gray-900">$48,250</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reports</p>
                      <p className="text-xl font-semibold text-gray-900">24</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Country Breakdown */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Country Breakdown</CardTitle>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-gray-900">38,512</span>
                      <span className="text-xs text-red-500 font-medium">▼ 38.22%</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-sm text-gray-500 hover:text-gray-700">
                    View All →
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    {countryData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.flag}</span>
                            <span className="text-sm font-medium text-gray-700">{item.country}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">{item.orders}</span>
                            <span className="text-xs text-gray-500 ml-1">({item.percent}%)</span>
                          </div>
                        </div>
                        <Progress value={item.percent} className="h-2 bg-gray-100" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Services Breakdown */}
              <Card className="bg-white border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Services Breakdown</CardTitle>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-2xl font-bold text-gray-900">
                        {servicesLoading ? '...' : services.length}
                      </span>
                      <span className="text-xs text-gray-500">Active services</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => window.location.href = '/services'}
                  >
                    Manage →
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  {servicesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="h-4 bg-gray-200 rounded w-24"></div>
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : servicesData.length > 0 ? (
                    <div className="space-y-4">
                      {servicesData.slice(0, 6).map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: item.color?.includes('blue') ? '#3b82f6' : item.color?.includes('red') ? '#ef4444' : item.color?.includes('green') ? '#22c55e' : item.color?.includes('purple') ? '#8b5cf6' : '#3b82f6' }}
                              />
                              <span className="text-sm font-medium text-gray-700">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-medium text-gray-900">{item.appointments}</span>
                              <span className="text-xs text-gray-500 ml-1">({item.percent}%)</span>
                            </div>
                          </div>
                          <Progress value={item.percent} className="h-2 bg-gray-100" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No services found</p>
                      <Button onClick={() => window.location.href = '/services'}>
                        Create Your First Service
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Reports;
