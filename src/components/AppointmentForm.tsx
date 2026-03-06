import { useState, useMemo } from "react";
import { X, ChevronLeft, Clock, User, MapPin, Calendar as CalendarIcon, ArrowRight, Video, Globe, Check, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

// Generate time slots from 9 AM to 6 PM
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour !== 18) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }
  return slots;
};

export function AppointmentForm({ isOpen, onClose, selectedDate, selectedTime }: AppointmentFormProps) {
  const [step, setStep] = useState<"datetime" | "details" | "success">("datetime");
  const [selectedDateObj, setSelectedDateObj] = useState<Date>(new Date(selectedDate));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(selectedTime);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const timeSlots = useMemo(() => generateTimeSlots(), []);

  // Fetch services
  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user profile for business info
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedService = services.find((s: Service) => s.id === serviceId);

  const handleDateSelect = (date: Date) => {
    setSelectedDateObj(date);
    setSelectedTimeSlot("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTimeSlot(time);
  };

  const handleContinue = () => {
    if (!selectedTimeSlot) {
      toast({
        title: "Select a time",
        description: "Please select an available time slot.",
        variant: "destructive",
      });
      return;
    }
    setStep("details");
  };

  const formatTime = (time: string) => {
    if (timeFormat === "24h") return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedService) return;

    setIsLoading(true);
    try {
      // Create or find customer
      let customerId: string;
      
      if (customerEmail) {
        // Check if customer exists
        const { data: existingCustomer } = await (supabase as any)
          .from('customers')
          .select('id')
          .eq('email', customerEmail)
          .eq('user_id', user.id)
          .single();
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const { data: newCustomer, error } = await (supabase as any)
            .from('customers')
            .insert({
              name: customerName,
              email: customerEmail,
              user_id: user.id,
            })
            .select()
            .single();
          
          if (error) throw error;
          customerId = newCustomer.id;
        }
      } else {
        // Create customer without email
        const { data: newCustomer, error } = await (supabase as any)
          .from('customers')
          .insert({
            name: customerName,
            user_id: user.id,
          })
          .select()
          .single();
        
        if (error) throw error;
        customerId = newCustomer.id;
      }

      // Create appointment
      const { error: appointmentError } = await (supabase as any)
        .from('appointments')
        .insert({
          customer_id: customerId,
          service_id: serviceId,
          appointment_date: format(selectedDateObj, 'yyyy-MM-dd'),
          appointment_time: selectedTimeSlot,
          price: selectedService.price,
          status: 'scheduled',
          user_id: user.id,
        });

      if (appointmentError) throw appointmentError;

      toast({
        title: "Appointment Booked!",
        description: `Your appointment is confirmed for ${format(selectedDateObj, 'MMMM d')} at ${selectedTimeSlot}.`,
      });

      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      handleClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("datetime");
    setSelectedDateObj(new Date(selectedDate));
    setSelectedTimeSlot(selectedTime);
    setCustomerName("");
    setCustomerEmail("");
    setServiceId("");
    setCurrentMonth(new Date(selectedDate));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-0 shadow-2xl rounded-3xl">
        <DialogTitle className="sr-only">Book Appointment</DialogTitle>
        
        <div className="flex min-h-[600px]">
          {/* Left Panel - Business Info */}
          <div className="w-[380px] bg-gray-50 p-8 flex flex-col border-r border-gray-200">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-500 hover:text-gray-900 transition-colors z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Profile Image */}
            <div className="mt-8 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl font-semibold shadow-lg">
                {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'B'}
              </div>
            </div>

            {/* Business Name */}
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {profile?.full_name || profile?.business_name || 'Your Barbershop'}
            </h2>
            
            {/* Service Info */}
            {selectedService ? (
              <div className="mt-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedService.name}</h3>
                <div className="flex items-center gap-4 text-gray-600 text-sm mb-4">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{selectedService.duration} mins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>In-person</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">${selectedService.price}</p>
              </div>
            ) : (
              <div className="mt-6">
                <p className="text-gray-600">Select a service to continue</p>
              </div>
            )}

            {/* Selected Date/Time Summary */}
            {selectedTimeSlot && (
              <div className="mt-6 p-4 bg-white rounded-2xl border border-gray-200">
                <div className="flex items-center gap-3 text-gray-900">
                  <CalendarIcon className="w-5 h-5 text-violet-600" />
                  <div>
                    <p className="font-semibold">{format(selectedDateObj, 'EEEE, MMMM d')}</p>
                    <p className="text-sm text-gray-600">{selectedTimeSlot}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Back button for details step */}
            {step === "details" && (
              <button
                onClick={() => setStep("datetime")}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to calendar</span>
              </button>
            )}
          </div>

          {/* Right Panel - Calendar/Time/Form */}
          <div className="flex-1 p-8 bg-white">
            {step === "datetime" ? (
              <div className="h-full flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Select Date & Time
                </h3>

                {/* Service Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
                  <div className="grid grid-cols-1 gap-2">
                    {services.map((service: Service) => (
                      <button
                        key={service.id}
                        onClick={() => setServiceId(service.id)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                          serviceId === service.id
                            ? "border-violet-600 bg-violet-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-600">{service.duration} mins</p>
                        </div>
                        <p className="font-bold text-gray-900">${service.price}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedService && (
                  <>
                    {/* Calendar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">
                          {format(currentMonth, 'MMMM yyyy')}
                        </h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Week days header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map(day => (
                          <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                          const isSelected = isSameDay(day, selectedDateObj);
                          const isCurrentMonth = isSameMonth(day, currentMonth);
                          const isTodayDate = isToday(day);
                          
                          return (
                            <button
                              key={day.toISOString()}
                              onClick={() => handleDateSelect(day)}
                              className={cn(
                                "aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all",
                                isSelected
                                  ? "bg-gray-900 text-white"
                                  : isTodayDate
                                  ? "bg-violet-100 text-violet-700"
                                  : isCurrentMonth
                                  ? "text-gray-900 hover:bg-gray-100"
                                  : "text-gray-400"
                              )}
                            >
                              {format(day, 'd')}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {format(selectedDateObj, 'EEEE, MMMM d')}
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={cn(
                              "py-3 px-4 rounded-xl border-2 font-medium transition-all",
                              selectedTimeSlot === time
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 hover:border-gray-400 text-gray-900"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Continue Button */}
                    <div className="mt-auto">
                      <button
                        onClick={handleContinue}
                        disabled={!selectedTimeSlot}
                        className={cn(
                          "w-full py-4 px-6 rounded-full font-semibold text-white transition-all flex items-center justify-center gap-2",
                          selectedTimeSlot
                            ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:opacity-90 shadow-lg shadow-violet-500/25"
                            : "bg-gray-300 cursor-not-allowed"
                        )}
                      >
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Details Step */
              <div className="h-full flex flex-col">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Enter Your Details
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none transition-colors text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none transition-colors text-gray-900"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      We'll send a confirmation email to this address.
                    </p>
                  </div>

                  {/* Book Button */}
                  <div className="mt-auto pt-6">
                    <button
                      type="submit"
                      disabled={isLoading || !customerName}
                      className={cn(
                        "w-full py-4 px-6 rounded-full font-semibold text-white transition-all flex items-center justify-center gap-2",
                        customerName && !isLoading
                          ? "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:opacity-90 shadow-lg shadow-violet-500/25"
                          : "bg-gray-300 cursor-not-allowed"
                      )}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30  border-t-white rounded-full animate-spin" />
                          Booking...
                        </>
                      ) : (
                        <>
                          Book Appointment
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
