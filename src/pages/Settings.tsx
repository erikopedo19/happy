
import { useState, useEffect } from "react";
import { Clock, Save, Calendar, Loader2, Bell, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import BookingLinkGenerator from "@/components/BookingLinkGenerator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const serviceDurationOptions = [10, 15, 20, 25, 30, 45, 60, 90];

const Settings = () => {
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("18:00");
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['agenda_settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('agenda_settings')
        .select('service_duration, start_hour, end_hour')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
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
      const { error } = await supabase
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
    const slots = [];
    if (!startHour || !endHour) return slots;
    const start = parseInt(startHour.split(':')[0]);
    const end = parseInt(endHour.split(':')[0]);
    
    for (let hour = start; hour <= end; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    
    return slots;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1 bg-white">
          <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
                  <p className="text-sm text-gray-500">Configure your agenda preferences</p>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 max-w-4xl mx-auto">
            {isLoadingSettings ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Booking Link Generator */}
                <BookingLinkGenerator />
                
                {/* Service Duration Settings */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Service Duration</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Select the default duration for your services in minutes.
                  </p>
                  
                  <div className="grid grid-cols-4 gap-3">
                    {serviceDurationOptions.map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setSelectedDuration(duration)}
                        className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                          selectedDuration === duration
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Available Hours Settings */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Available Hours</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Set your working hours for the agenda display.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startHour" className="text-sm font-medium text-gray-700">
                        Start Time
                      </Label>
                      <Input
                        id="startHour"
                        type="time"
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endHour" className="text-sm font-medium text-gray-700">
                        End Time
                      </Label>
                      <Input
                        id="endHour"
                        type="time"
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>

                {/* Service Categories */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Service Categories</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your service categories for better organization.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['Haircuts', 'Styling', 'Coloring', 'Treatments', 'Beard Care', 'Shaving', 'Hair Wash', 'Consultation', 'Special Events', 'Kids Services'].map((category) => (
                      <div
                        key={category}
                        className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 text-center hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Notification Settings */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Configure when and how you receive notifications.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">New Bookings</p>
                        <p className="text-xs text-gray-500">Get notified when new appointments are booked</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Appointment Reminders</p>
                        <p className="text-xs text-gray-500">Send reminders before appointments</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Cancellations</p>
                        <p className="text-xs text-gray-500">Get notified when appointments are cancelled</p>
                      </div>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </div>
                  </div>
                </Card>

                {/* Business Information */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Update your business details and contact information.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
                        Business Name
                      </Label>
                      <Input
                        id="businessName"
                        placeholder="Your Business Name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="businessPhone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <Input
                        id="businessPhone"
                        placeholder="+1 (555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="businessAddress" className="text-sm font-medium text-gray-700">
                        Address
                      </Label>
                      <Input
                        id="businessAddress"
                        placeholder="123 Main St, City, State 12345"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>

                {/* Preview */}
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Service Duration:</span> {selectedDuration} minutes
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Working Hours:</span> {startHour} - {endHour}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Time Slots:</span> {generateTimeSlots().join(', ')}
                    </p>
                  </div>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
