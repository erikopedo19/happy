
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from 'date-fns';
import ModernBookingForm from "@/components/ModernBookingForm";

const bookingSchema = z.object({
  customer_name: z.string().min(1, "Name is required"),
  customer_email: z.string().email("Valid email is required"),
  customer_phone: z.string().optional(),
  service_id: z.string().min(1, "Please select a service"),
  stylist_id: z.string().min(1, "Please select a stylist"),
  notes: z.string().optional(),
});

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  color: string;
  text_color: string;
  border_color: string;
}

interface Stylist {
  id: string;
  name: string;
  avatar_url?: string | null;
  title?: string | null;
}

interface BusinessProfile {
  id: string;
  full_name: string;
  brand_color?: string;
  booking_link?: string;
}

interface BookingError {
  code: string;
  message: string;
  details?: string;
}

interface AgendaSettings {
  start_hour: string;
  end_hour: string;
  service_duration: number;
  working_days?: number[] | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service: Service;
  stylist_id?: string | null;
}

const Booking = () => {
  const params = useParams();
  const bookingLink = params.bookingLink;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [bookingError, setBookingError] = useState<BookingError | null>(null);
  const [emailTheme, setEmailTheme] = useState<"default" | "minimal" | "festive">("default");
  const [accentColor, setAccentColor] = useState<string>("#1a1a1a");
  const { toast } = useToast();

  console.log('Booking component loaded with bookingLink:', bookingLink);

  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      service_id: "",
      stylist_id: "",
      notes: "",
    },
  });

  // Fetch business profile by booking link
  const { data: businessProfile, isLoading: profileLoading, error: profileError } = useQuery<BusinessProfile>({
    queryKey: ['business-profile', bookingLink],
    queryFn: async () => {
      console.log('Fetching business profile for booking link:', bookingLink);
      
      if (!bookingLink) {
        const error: BookingError = {
          code: 'MISSING_BOOKING_LINK',
          message: 'No booking link provided',
          details: 'The URL is missing the booking link parameter'
        };
        console.error('Booking error:', error);
        throw error;
      }
      
      const { data, error } = await supabase
        .rpc('get_public_profile_by_booking_link', { _booking_link: bookingLink });

      console.log('Business profile RPC result:', { data, error });

      if (error) {
        const bookingError: BookingError = {
          code: error.code || 'RPC_ERROR',
          message: 'Failed to fetch business profile',
          details: error.message || 'Database query failed'
        };
        console.error('RPC error:', bookingError);
        throw bookingError;
      }

      const profile = Array.isArray(data) ? data[0] : data;

      if (!profile) {
        const error: BookingError = {
          code: 'PROFILE_NOT_FOUND',
          message: 'Business profile not found',
          details: `No business found with booking link: ${bookingLink}`
        };
        console.error('Profile not found:', error);
        throw error;
      }

      return profile as BusinessProfile;
    },
    enabled: !!bookingLink,
    retry: (failureCount, error: any) => {
      console.log('Retry attempt:', failureCount, 'Error:', error);
      // Don't retry if it's a known error that won't resolve
      if (error?.code === 'PROFILE_NOT_FOUND' || error?.code === 'MISSING_BOOKING_LINK') {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
  });

  // Fetch public stylists for this business (after profile resolves)
  const { data: stylists = [] } = useQuery<Stylist[]>({
    queryKey: ['public-stylists', businessProfile?.id],
    queryFn: async () => {
      if (!businessProfile?.id) return [];

      const { data, error } = await supabase
        .from('stylists')
        .select('id, name, avatar_url, title')
        .eq('user_id', businessProfile.id)
        .eq('is_public', true);

      if (error) {
        console.error('Error fetching stylists:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!businessProfile?.id,
  });

  // Fetch services for this business
  const { data: services = [], error: servicesError } = useQuery<Service[]>({
    queryKey: ['public-services', businessProfile?.id],
    queryFn: async () => {
      if (!businessProfile?.id) return [];
      
      console.log('Fetching services for business:', businessProfile.id);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', businessProfile.id)
        .order('name');
      
      console.log('Services query result:', { data, error });
      
      if (error) {
        console.error('Error fetching services:', error);
        const bookingError: BookingError = {
          code: 'SERVICES_FETCH_ERROR',
          message: 'Failed to load services',
          details: error.message
        };
        throw bookingError;
      }
      
      if (!data || data.length === 0) {
        const bookingError: BookingError = {
          code: 'NO_SERVICES',
          message: 'No services available',
          details: 'This business has not set up any services yet'
        };
        console.warn('No services found:', bookingError);
      }
      
      return data || [];
    },
    enabled: !!businessProfile?.id,
  });

  // Fetch agenda settings
  const { data: settings } = useQuery<AgendaSettings>({
    queryKey: ['public-agenda-settings', businessProfile?.id],
    queryFn: async () => {
      if (!businessProfile?.id) return null;
      
      console.log('Fetching agenda settings for business:', businessProfile.id);
      const { data, error } = await supabase
        .from('agenda_settings')
        .select('*')
        .eq('user_id', businessProfile.id)
        .maybeSingle();
      
      console.log('Agenda settings query result:', { data, error });
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching agenda settings:', error);
        return { start_hour: '08:00', end_hour: '18:00', service_duration: 30, working_days: [0,1,2,3,4,5,6] };
      }
      return data || { start_hour: '08:00', end_hour: '18:00', service_duration: 30, working_days: [0,1,2,3,4,5,6] };
    },
    enabled: !!businessProfile?.id,
  });

  // Fetch existing appointments for selected date
  const selectedStylistId = form.watch("stylist_id");

  const { data: existingAppointments = [] } = useQuery<Appointment[], Error>({
    queryKey: [
      'public-appointments',
      businessProfile?.id ?? 'no-business',
      selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'no-date',
      selectedStylistId ?? 'no-stylist'
    ],
    queryFn: async (): Promise<Appointment[]> => {
      if (!businessProfile?.id || !selectedDate) return [];
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('Fetching appointments for date:', dateStr);
      
      const { data, error } = await (supabase
        .from('appointments')
        .select(`
          *,
          service:services(*)
        `)
        .eq('user_id', businessProfile.id)
        .eq('appointment_date', dateStr)
        .eq('stylist_id', selectedStylistId) as any);
      
      console.log('Appointments query result:', { data, error });
      
      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }
      return (data || []) as Appointment[];
    },
    enabled: !!businessProfile?.id && !!selectedDate && !!selectedStylistId,
  });

  // Generate time slots
  const generateTimeSlots = (startHour: string, endHour: string, interval: number = 30) => {
    const slots = [];
    const start = parseInt(startHour.split(':')[0]);
    const end = parseInt(endHour.split(':')[0]);
    
    for (let hour = start; hour <= end; hour++) {
      for (let minutes = 0; minutes < 60; minutes += interval) {
        if (hour === end && minutes > 0) break;
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeSlot);
      }
    }
    return slots;
  };

  useEffect(() => {
    if (settings) {
      console.log('Generating time slots with settings:', settings);
      const slots = generateTimeSlots(settings.start_hour, settings.end_hour, settings.service_duration);
      setTimeSlots(slots);
    }
  }, [settings]);

  // Use profile brand color as fallback accent
  useEffect(() => {
    if (businessProfile?.brand_color && accentColor === "#1a1a1a") {
      setAccentColor(businessProfile.brand_color);
    }
  }, [businessProfile?.brand_color]);

  // Parse query params for theme/accent
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get('theme') as "default" | "minimal" | "festive" | null;
    const accent = params.get('accent');
    if (theme) setEmailTheme(theme);
    if (accent) setAccentColor(accent);
  }, []);

  // Check if a time slot is available
  const isTimeSlotAvailable = (time: string) => {
    try {
      const selectedServiceId = form.watch("service_id");
      const stylistId = selectedStylistId;
      if (!selectedServiceId || !stylistId) return false;
      
      const selectedService = services.find(s => s.id === selectedServiceId);
      if (!selectedService) return false;

      const slotInterval = settings?.service_duration || 30;
      const slotsNeeded = Math.ceil(selectedService.duration / slotInterval);
      const startSlotIndex = timeSlots.indexOf(time);
      
      // Check if this slot and required subsequent slots are free
      for (let i = 0; i < slotsNeeded; i++) {
        const checkTime = timeSlots[startSlotIndex + i];
        if (!checkTime) return false;
        
        const isOccupied = existingAppointments.some(apt => {
          if (!apt.service) return false; // Skip if service is missing
          const matchesStylist = apt.stylist_id ? apt.stylist_id === stylistId : false;
          if (!matchesStylist) return false;
          const aptTime = apt.appointment_time?.substring(0, 5);
          if (!aptTime) return false;
          const aptDuration = apt.service.duration;
          const aptSlotsNeeded = Math.ceil(aptDuration / slotInterval);
          const aptStartIndex = timeSlots.indexOf(aptTime);
          const checkIndex = timeSlots.indexOf(checkTime);
          
          return checkIndex >= aptStartIndex && checkIndex < aptStartIndex + aptSlotsNeeded;
        });
        
        if (isOccupied) return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking time slot availability:', error);
      return false;
    }
  };

  const onSubmit = async (values: z.infer<typeof bookingSchema>) => {
    setBookingError(null);
    
    if (!businessProfile?.id || !selectedDate || !selectedTime) {
      const error: BookingError = {
        code: 'INCOMPLETE_BOOKING',
        message: 'Incomplete booking information',
        details: 'Please select a date and time before confirming'
      };
      setBookingError(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Creating booking with values:', values);
      
      // Guard against race: ensure the slot is still free for this stylist
      if (!isTimeSlotAvailable(selectedTime)) {
        const error: BookingError = {
          code: 'SLOT_TAKEN',
          message: 'Time slot unavailable',
          details: 'This stylist is no longer free at the selected time. Please pick another slot.',
        };
        setBookingError(error);
        toast({
          title: error.message,
          description: error.details,
          variant: "destructive",
        });
        return false;
      }

      // First, check if customer already exists for this business owner and email
      const { data: existingCustomers, error: searchError } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', businessProfile.id)
        .eq('email', values.customer_email)
        .limit(1);

      if (searchError) {
        console.error('Error searching for existing customer:', searchError);
      }

      let customer;

      if (existingCustomers && existingCustomers.length > 0) {
        // Customer already exists, use the existing one
        customer = existingCustomers[0];
        console.log('Using existing customer:', customer);
        
        // Optionally update customer info if it has changed
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update({
            name: values.customer_name,
            phone: values.customer_phone || null,
          })
          .eq('id', customer.id)
          .select()
          .single();

        if (!updateError && updatedCustomer) {
          customer = updatedCustomer;
        }
      } else {
        // Create new customer
        const customerData = {
          name: values.customer_name,
          email: values.customer_email,
          phone: values.customer_phone || null,
          user_id: businessProfile.id, // associate customer with business owner
        };

        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single();

        if (customerError) {
          console.error('Customer creation error:', customerError);
          const error: BookingError = {
            code: customerError.code || 'CUSTOMER_CREATE_ERROR',
            message: 'Failed to create customer record',
            details: customerError.message || 'Could not save customer information'
          };
          setBookingError(error);
          throw error;
        }

        customer = newCustomer;
        console.log('Customer created successfully:', customer);
      }

      // Create appointment with the business owner's user_id
      const { data: newAppointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          customer_id: customer.id,
          service_id: values.service_id,
          stylist_id: values.stylist_id,
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          notes: values.notes || null,
          status: 'scheduled',
          user_id: businessProfile.id, // This is the business owner's ID
        })
        .select()
        .single();

      if (appointmentError) {
        console.error('Appointment creation error:', appointmentError);
        const error: BookingError = {
          code: appointmentError.code || 'APPOINTMENT_CREATE_ERROR',
          message: 'Failed to create appointment',
          details: appointmentError.message || 'Could not schedule the appointment. The time slot may no longer be available.'
        };
        setBookingError(error);
        throw error;
      }

      console.log('Appointment created successfully:', newAppointment);

      // Send confirmation email via Resend
      try {
        const selectedService = services.find(s => s.id === values.service_id);
        const selectedStylist = stylists.find(s => s.id === values.stylist_id);
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            customerEmail: values.customer_email,
            customerName: values.customer_name,
            customerPhone: values.customer_phone,
            businessName: businessProfile.full_name,
            serviceName: selectedService?.name || 'Service',
            appointmentDate: format(selectedDate, 'EEEE, MMMM d, yyyy'),
            appointmentTime: selectedTime,
            price: selectedService?.price,
            notes: values.notes,
            bookingId: newAppointment?.id?.substring(0, 8), // Use first 8 chars of UUID
            theme: emailTheme,
            accentColor,
            stylistName: selectedStylist?.name,
            stylistTitle: selectedStylist?.title,
            stylistAvatar: selectedStylist?.avatar_url,
          },
        });

        if (emailError) {
          console.error('Error sending confirmation email:', emailError);
          // Don't fail the booking if email fails
        } else {
          console.log('Confirmation email sent successfully:', emailData);
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Continue even if email fails
      }

      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been scheduled successfully. Check your email for confirmation.",
      });

      form.reset();
      setSelectedTime("");
      return true; // Return true to advance to success step
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      const displayError = bookingError || {
        code: 'UNKNOWN_ERROR',
        message: 'Booking failed',
        details: error?.message || 'An unexpected error occurred. Please try again.'
      };
      
      toast({
        title: displayError.message,
        description: displayError.details,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading booking page...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (profileError || !businessProfile) {
    console.error('Profile loading error or no business profile:', profileError, businessProfile);
    
    const error = profileError as any;
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    const errorMessage = error?.message || 'Booking Not Found';
    const errorDetails = error?.details || "The booking link you're looking for doesn't exist or has been removed.";
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">{errorMessage}</h1>
            <p className="text-slate-300 mb-4">{errorDetails}</p>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
            <div className="text-xs text-slate-500 mb-2">Error Details:</div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Error Code:</span>
                <span className="font-mono text-slate-300">{errorCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Booking Link:</span>
                <span className="font-mono text-slate-300">{bookingLink || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.history.back()} 
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show warning if no services available
  if (services.length === 0 && !servicesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">No Services Available</h1>
            <p className="text-slate-300 mb-4">
              {businessProfile?.full_name || 'This business'} hasn't set up any services yet.
            </p>
            <p className="text-slate-400 text-sm">
              Please contact them directly or check back later.
            </p>
          </div>
          
          <Button 
            onClick={() => window.history.back()} 
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ModernBookingForm
      form={form}
      services={services || []}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      selectedTime={selectedTime}
      setSelectedTime={setSelectedTime}
      timeSlots={timeSlots}
      isTimeSlotAvailable={isTimeSlotAvailable}
      onSubmit={onSubmit}
      isLoading={isLoading}
      businessProfile={businessProfile}
      workingDays={settings?.working_days ?? [0,1,2,3,4,5,6]}
    />
  );
};

export default Booking;
