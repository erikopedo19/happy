import { useState } from 'react';
import { Search, Bell, Plus, Calendar as CalendarIcon, LayoutGrid, FileText, DollarSign, User, TrendingUp, ArrowUpRight, Clock, Users } from "lucide-react";
import { LineChart2 } from "@/components/LineChart2";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StatsCards } from "@/components/StatsCards";
import { AppointmentsTable } from "@/components/AppointmentsTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export function DashboardContent() {
  const today = new Date();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ appointments: any[]; clients: any[] }>({ appointments: [], clients: [] });

  // Search function
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults({ appointments: [], clients: [] });
      return;
    }

    try {
      // Search appointments
      const { data: appointments } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:profiles(*),
          service:services(*),
          stylist:stylists(*)
        `)
        .or(`customer.name.ilike.%${query}%,service.name.ilike.%${query}%`)
        .limit(5);

      // Search clients
      const { data: clients } = await supabase
        .from('profiles')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(5);

      setSearchResults({
        appointments: appointments || [],
        clients: clients || []
      });
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ appointments: [], clients: [] });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50 text-foreground">

      {/* Main Content */}
      <div className="px-6 py-8">
        {/* Title & Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back! Here's your business overview.</p>
          </div>
          <Tabs defaultValue="overview" className="w-auto">
            <TabsList className="bg-white border border-slate-200 h-11 p-1 gap-1 rounded-lg shadow-sm max-h-[45px]">
              <TabsTrigger value="overview" className="h-9 px-4 text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md transition-all">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="bookings" className="h-9 px-4 text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md transition-all">
                <FileText className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
              <TabsTrigger value="clients" className="h-9 px-4 text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md transition-all">
                <User className="h-4 w-4 mr-2" />
                Clients
              </TabsTrigger>
              <TabsTrigger value="analytics" className="h-9 px-4 text-sm data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm rounded-md transition-all">
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Cards */}
        <div className="mb-8">
          <StatsCards />
        </div>

        {/* Cashflow Chart */}
        <div className="mb-8">
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <LineChart2 />
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-slate-700 border-slate-200 hover:bg-slate-50 h-10">
                  <Plus className="w-4 h-4 mr-2" />
                  New Appointment
                </Button>
                <Button variant="outline" className="w-full justify-start text-slate-700 border-slate-200 hover:bg-slate-50 h-10">
                  <Users className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
                <Button variant="outline" className="w-full justify-start text-slate-700 border-slate-200 hover:bg-slate-50 h-10">
                  <Clock className="w-4 h-4 mr-2" />
                  View Schedule
                </Button>
              </div>
            </div>
          </Card>

          {/* Today's Summary */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Appointments</span>
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">8</p>
                  <p className="text-xs text-slate-500 mt-1">+2 from yesterday</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Completed</span>
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">5</p>
                  <p className="text-xs text-slate-500 mt-1">62.5% completion</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Revenue</span>
                    <ArrowUpRight className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">$420</p>
                  <p className="text-xs text-slate-500 mt-1">+$120 today</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Appointments Table */}
        <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Recent Appointments</h3>
              <p className="text-sm text-slate-600 mt-1">All upcoming and recent bookings</p>
            </div>
            <Button variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-medium">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <AppointmentsTable />
          </div>
        </Card>
      </div>
    </div>
  );
}
