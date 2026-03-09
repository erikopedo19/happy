
import { useState, useEffect } from "react";
import { Clock, Save, Calendar, Loader2, Bell, User, Settings2, Link2, Palette, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import BookingLinkGenerator from "@/components/BookingLinkGenerator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const serviceDurationOptions = [10, 15, 20, 25, 30, 45, 60, 90];

const Settings = () => {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("18:00");
  const [activeTab, setActiveTab] = useState("general");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['agenda_settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase
        .from('agenda_settings' as any)
        .select('service_duration, start_hour, end_hour') as any)
        .eq('user_id', user.id)
        .single();

      if (error && (error as any).code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (settings) {
      setSelectedDuration(settings.service_duration || 30);
      setStartHour(settings.start_hour?.substring(0, 5) || "08:00");
      setEndHour(settings.end_hour?.substring(0, 5) || "18:00");
    }
  }, [settings]);

  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (newSettings: { service_duration: number; start_hour: string; end_hour: string }) => {
      if (!user) throw new Error("User not found");
      const { error } = await (supabase as any)
        .from('agenda_settings')
        .update(newSettings)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your agenda settings have been updated successfully."
      });
      queryClient.invalidateQueries({ queryKey: ['agenda_settings', user?.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not save settings: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    saveSettings({
      service_duration: selectedDuration,
      start_hour: startHour,
      end_hour: endHour,
    });
  };

  const generateTimeSlots = () => {
    const slots: string[] = [];
    if (!startHour || !endHour) return slots;
    const start = parseInt(startHour.split(':')[0]);
    const end = parseInt(endHour.split(':')[0]);
    for (let hour = start; hour <= end; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };

  // Notification items
  const notifications = [
    { id: "new-bookings", label: "New Bookings", desc: "Get notified when new appointments are booked", default: true },
    { id: "reminders", label: "Appointment Reminders", desc: "Send reminders before appointments", default: true },
    { id: "cancellations", label: "Cancellations", desc: "Get notified when appointments are cancelled", default: true },
    { id: "daily-digest", label: "Daily Digest", desc: "Receive a summary of your daily schedule", default: false },
  ];

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="h-screen flex w-full bg-[#f8f9fa] overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="px-4 md:px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-gray-600 hover:text-gray-900 lg:hidden" />
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Manage your workspace preferences</p>
                </div>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={isSaving} 
                size="sm"
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl h-9 px-4 text-sm font-medium"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>

          {/* Content with Tabs */}
          <div className="flex-1 overflow-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              {/* Tabs Navigation */}
              <div className="bg-white border-b border-gray-200 px-4 md:px-6">
                <TabsList className="h-11 bg-transparent border-0 p-0 gap-1 w-full justify-start overflow-x-auto">
                  <TabsTrigger 
                    value="general" 
                    className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-none rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Settings2 className="w-4 h-4 mr-1.5" />
                    General
                  </TabsTrigger>
                  <TabsTrigger 
                    value="booking" 
                    className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-none rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Link2 className="w-4 h-4 mr-1.5" />
                    Booking
                  </TabsTrigger>
                  <TabsTrigger 
                    value="notifications" 
                    className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-none rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Bell className="w-4 h-4 mr-1.5" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="business" 
                    className="data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900 data-[state=active]:shadow-none rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4 mr-1.5" />
                    Business
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-4 md:p-6 max-w-3xl mx-auto w-full">
                {isLoadingSettings ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {/* General Tab */}
                    <TabsContent value="general" className="mt-0 space-y-4">
                      {/* Service Duration */}
                      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 px-4 md:px-6 pt-4 md:pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <Clock className="w-4.5 h-4.5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold text-gray-900">Slot Duration</CardTitle>
                              <CardDescription className="text-xs text-gray-500">Default time per service slot</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                          <div className="grid grid-cols-4 gap-2">
                            {serviceDurationOptions.map((duration) => (
                              <button
                                key={duration}
                                onClick={() => setSelectedDuration(duration)}
                                className={cn(
                                  "py-2.5 px-2 rounded-xl border text-sm font-medium transition-all",
                                  selectedDuration === duration
                                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900"
                                )}
                              >
                                {duration}m
                              </button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Working Hours */}
                      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 px-4 md:px-6 pt-4 md:pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-4.5 h-4.5 text-green-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold text-gray-900">Working Hours</CardTitle>
                              <CardDescription className="text-xs text-gray-500">Set your daily availability</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Opens at</Label>
                              <Input
                                type="time"
                                value={startHour}
                                onChange={(e) => setStartHour(e.target.value)}
                                className="rounded-xl border-gray-200 focus:border-gray-400 focus:ring-gray-400 h-10 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Closes at</Label>
                              <Input
                                type="time"
                                value={endHour}
                                onChange={(e) => setEndHour(e.target.value)}
                                className="rounded-xl border-gray-200 focus:border-gray-400 focus:ring-gray-400 h-10 text-sm"
                              />
                            </div>
                          </div>

                          <Separator className="my-4" />

                          {/* Preview */}
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Preview</p>
                            <div className="flex flex-wrap gap-1.5">
                              {generateTimeSlots().map((slot) => (
                                <Badge key={slot} variant="secondary" className="bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg px-2 py-0.5">
                                  {slot}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Booking Tab */}
                    <TabsContent value="booking" className="mt-0 space-y-4">
                      <BookingLinkGenerator />
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="mt-0 space-y-4">
                      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-2 px-4 md:px-6 pt-4 md:pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Bell className="w-4.5 h-4.5 text-amber-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold text-gray-900">Notifications</CardTitle>
                              <CardDescription className="text-xs text-gray-500">Choose what you get notified about</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                          <div className="space-y-1">
                            {notifications.map((item, index) => (
                              <div key={item.id}>
                                <div className="flex items-center justify-between py-3">
                                  <div className="flex-1 min-w-0 pr-4">
                                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                  </div>
                                  <Switch defaultChecked={item.default} />
                                </div>
                                {index < notifications.length - 1 && <Separator />}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Business Tab */}
                    <TabsContent value="business" className="mt-0 space-y-4">
                      <Card className="border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="pb-3 px-4 md:px-6 pt-4 md:pt-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-4.5 h-4.5 text-purple-600" />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold text-gray-900">Business Info</CardTitle>
                              <CardDescription className="text-xs text-gray-500">Your public business details</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 md:px-6 pb-4 md:pb-6 space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Business Name</Label>
                            <Input placeholder="Your Business Name" className="rounded-xl border-gray-200 h-10 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Phone Number</Label>
                            <Input placeholder="+1 (555) 123-4567" className="rounded-xl border-gray-200 h-10 text-sm" />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-500 mb-1.5 block">Address</Label>
                            <Input placeholder="123 Main St, City, State 12345" className="rounded-xl border-gray-200 h-10 text-sm" />
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </>
                )}
              </div>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
