
import { useState, useEffect, useMemo } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppointmentForm } from "@/components/AppointmentForm";
import { ModernAppointmentsCalendar } from "@/components/ModernAppointmentsCalendar";

import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';

interface Service {
  id: string;
  name: string;
  duration: number;
  color: string;
  text_color: string;
  border_color: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  customer: Customer;
  service: Service;
  status: string;
  price?: number;
  notes?: string;
}

const Agenda = () => {
  const [currentDate] = useState(new Date());
  const [isAppointmentFormOpen, setIsAppointmentFormOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ date: string; time: string } | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const fetchStartDate = startOfWeek(subWeeks(currentDate, 4), { weekStartsOn: 1 });
  const fetchEndDate = endOfWeek(addWeeks(currentDate, 12), { weekStartsOn: 1 });

  // Fetch services for the legend
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch appointments for current range
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['appointments', format(fetchStartDate, 'yyyy-MM-dd'), format(fetchEndDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          customer:customers(*),
          service:services(*)
        `)
        .eq('user_id', user.id)
        .gte('appointment_date', format(fetchStartDate, 'yyyy-MM-dd'))
        .lte('appointment_date', format(fetchEndDate, 'yyyy-MM-dd'))
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Unable to load appointments",
          description: error.message || "Please try again in a moment.",
          variant: "destructive",
        });
        throw error;
      }
      return data || [];
    },
    enabled: !!user,
  });

  const hydratedAppointments = useMemo(
    () => appointments.filter((apt) => apt?.service && apt?.customer),
    [appointments]
  );

  // Filter appointments by selected service
  const filteredAppointments = useMemo(() => {
    if (!selectedServiceId) return hydratedAppointments;
    return hydratedAppointments.filter((apt) => apt.service?.id === selectedServiceId);
  }, [hydratedAppointments, selectedServiceId]);

  // Set up real-time subscription for appointments
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time appointment change:', payload);
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New Booking!",
              description: "A new appointment has been scheduled.",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast, queryClient]);

  const handleDateTimeClick = (date: string, time: string) => {
    setSelectedTimeSlot({ date, time });
    setIsAppointmentFormOpen(true);
  };

  const handleCloseAppointmentForm = () => {
    setIsAppointmentFormOpen(false);
    setSelectedTimeSlot(null);
  };

  const handleServiceSelect = (serviceId: string | null) => {
    setSelectedServiceId(serviceId);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <ModernAppointmentsCalendar 
            appointments={filteredAppointments}
            onDateTimeClick={handleDateTimeClick}
            services={services}
          />
        </main>
      </div>

      {/* Appointment Form Dialog */}
      {selectedTimeSlot && (
        <AppointmentForm
          isOpen={isAppointmentFormOpen}
          onClose={handleCloseAppointmentForm}
          selectedDate={selectedTimeSlot.date}
          selectedTime={selectedTimeSlot.time}
        />
      )}
    </SidebarProvider>
  );
};

export default Agenda;
