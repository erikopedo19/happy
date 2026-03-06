import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Clock, User, Calendar as CalendarIcon, Check, Video, Globe, ArrowRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  color?: string;
  text_color?: string;
  border_color?: string;
}

interface ModernBookingFormProps {
  form: UseFormReturn<any>;
  services: Service[];
  stylists?: { id: string; name: string; avatar_url?: string | null; title?: string | null }[];
  stylistServices?: { stylist_id: string; service_id: string }[];
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  timeSlots: string[];
  isTimeSlotAvailable: (time: string) => boolean;
  onSubmit: (values: any) => Promise<boolean | void>;
  isLoading: boolean;
  businessProfile: {
    full_name: string;
    brand_color?: string;
    address?: string;
    phone?: string;
    avatar_url?: string;
  } | null;
  workingDays?: number[];
  rescheduleAppointment?: any;
}

const ModernBookingForm = ({
  form,
  services,
  stylists = [],
  stylistServices = [],
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  timeSlots,
  isTimeSlotAvailable,
  onSubmit,
  isLoading,
  businessProfile,
  workingDays = [0, 1, 2, 3, 4, 5, 6],
  rescheduleAppointment
}: ModernBookingFormProps) => {
  const [step, setStep] = useState<"service" | "datetime" | "details" | "success">("service");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  
  const selectedService = services.find(s => s.id === selectedServiceId);

  // Filter stylists that are available for the selected service
  const availableStylistsForService = selectedServiceId
    ? (stylistServices.length > 0 
        ? stylists.filter(stylist =>
            stylistServices.some(ss =>
              ss.stylist_id === stylist.id && ss.service_id === selectedServiceId
            )
          )
        : stylists)
    : stylists;

  // Calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Week days header
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    form.setValue("service_id", serviceId);
    setStep("datetime");
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinue = () => {
    if (!selectedTime) return;
    setStep("details");
  };

  const formatTime = (time: string) => {
    if (timeFormat === "24h") return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (values: any) => {
    const success = await onSubmit(values);
    if (success) {
      setStep("success");
    }
  };

  // Get available time slots for selected date
  const availableTimeSlots = selectedDate 
    ? timeSlots.filter(time => isTimeSlotAvailable(time))
    : [];

  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {rescheduleAppointment ? 'Το ραντεβού άλλαξε!' : 'Η κράτηση ολοκληρώθηκε!'}
          </h2>
          <p className="text-gray-400 mb-6">
            Ευχαριστούμε για την προτίμηση. Θα λάβετε email επιβεβαίωσης.
          </p>
          <div className="bg-[#2a2a2a] rounded-2xl p-6 mb-6 max-w-md mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img 
                  src={businessProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${businessProfile?.full_name || 'user'}`}
                  alt={businessProfile?.full_name || 'Business'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="text-white font-medium">{selectedService?.name}</p>
                <p className="text-gray-400 text-sm">{selectedService?.duration} λεπτά</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300 text-sm">
              <Clock className="w-4 h-4" />
              <span>{selectedTime}</span>
            </div>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-semibold"
          >
            Νέα Κράτηση
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Main 3-Panel Layout */}
        <div className="flex flex-col lg:flex-row min-h-[600px] bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Left Panel - Service Info */}
          <div className="w-full lg:w-[320px] bg-[#1a1a1a] p-6 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r border-[#2a2a2a]">
            {/* Profile */}
            <div className="mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img 
                  src={businessProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${businessProfile?.full_name || 'user'}`}
                  alt={businessProfile?.full_name || 'Business'}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="mt-3 text-sm text-gray-400">{businessProfile?.full_name || 'Business Name'}</p>
            </div>

            {/* Service Selection or Selected Service */}
            {step === "service" ? (
              <>
                <h2 className="text-xl font-semibold text-white mb-4">Επιλέξτε Υπηρεσία</h2>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all",
                        selectedServiceId === service.id
                          ? "border-red-500 bg-[#2a2a2a]"
                          : "border-[#2a2a2a] hover:border-gray-600"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-white">[{service.duration}-min] {service.name}</p>
                          {service.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-xl font-bold text-white mt-3">{service.price} €</p>
                    </button>
                  ))}
                </div>
              </>
            ) : selectedService ? (
              <>
                {/* Selected Service Title */}
                <h2 className="text-xl font-semibold text-white mb-2">
                  [{selectedService.duration}-min] {selectedService.name}
                </h2>
                
                {selectedService.description && (
                  <p className="text-sm text-gray-400 mb-6">{selectedService.description}</p>
                )}

                {/* Service Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{selectedService.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Video className="w-4 h-4 text-gray-500" />
                    <span>Google Meet</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span>Europe/Athens</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-auto pt-6">
                  <p className="text-2xl font-bold text-white">{selectedService.price} €</p>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setStep("service")}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mt-4 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Αλλαγή υπηρεσίας</span>
                </button>
              </>
            ) : null}
          </div>

          {/* Center Panel - Calendar or Details */}
          <div className="flex-1 bg-[#1a1a1a] p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#2a2a2a]">
            {step === "datetime" && selectedService ? (
              <div className="h-full flex flex-col">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-white">
                    {format(currentMonth, 'MMMM')} <span className="text-gray-500">{format(currentMonth, 'yyyy')}</span>
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors text-gray-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors text-gray-400"
                    >
                      <ChevronRight className="w-4 h-4" />
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
                <div className="grid grid-cols-7 gap-2 mb-6">
                  {calendarDays.map((day) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDisabled = day < new Date(new Date().setHours(0, 0, 0, 0)) || !workingDays.includes(getDay(day));
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => !isDisabled && handleDateSelect(day)}
                        disabled={isDisabled}
                        className={cn(
                          "aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all",
                          isSelected
                            ? "bg-red-500 text-white"
                            : isDisabled
                            ? "text-gray-600 cursor-not-allowed"
                            : !isCurrentMonth
                            ? "text-gray-600"
                            : "text-white hover:bg-[#2a2a2a]"
                        )}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : step === "details" && selectedService ? (
              <div className="h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Στοιχεία Κράτησης
                </h3>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex-1">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customer_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-400 text-sm">Ονοματεπώνυμο</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <Input 
                                  {...field} 
                                  className="w-full pl-12 pr-4 py-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl focus:border-red-500 focus:outline-none transition-colors text-white placeholder-gray-500" 
                                  placeholder="Όνομα"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customer_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-400 text-sm">Email</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="w-full px-4 py-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl focus:border-red-500 focus:outline-none transition-colors text-white placeholder-gray-500" 
                                placeholder="email@example.com"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="customer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-400 text-sm">Τηλέφωνο</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className="w-full px-4 py-4 bg-[#2a2a2a] border border-[#3a3a3a] rounded-xl focus:border-red-500 focus:outline-none transition-colors text-white placeholder-gray-500" 
                              placeholder="+30 691 234 5678"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {services.length > 0 && (
                      <FormField
                        control={form.control}
                        name="stylist_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-400 text-sm">Επιλογή Στυλίστα</FormLabel>
                            <FormControl>
                              <div className="grid sm:grid-cols-2 gap-2">
                                {availableStylistsForService.length === 0 && (
                                  <div className="text-gray-500 text-sm col-span-2">
                                    Δεν υπάρχουν διαθέσιμοι στυλίστες
                                  </div>
                                )}
                                {availableStylistsForService.map((stylist) => {
                                  const isSelected = field.value === stylist.id;
                                  return (
                                    <button
                                      key={stylist.id}
                                      type="button"
                                      onClick={() => field.onChange(stylist.id)}
                                      className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border text-left transition-all bg-[#2a2a2a]",
                                        isSelected
                                          ? "border-red-500"
                                          : "border-[#3a3a3a] hover:border-gray-600"
                                      )}
                                    >
                                      <div className="h-10 w-10 rounded-full bg-[#3a3a3a] overflow-hidden flex items-center justify-center text-sm font-semibold text-white">
                                        {stylist.avatar_url ? (
                                          <img src={stylist.avatar_url} alt={stylist.name} className="h-full w-full object-cover" />
                                        ) : (
                                          stylist.name.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-medium truncate">{stylist.name}</div>
                                        <div className="text-gray-500 text-xs truncate">{stylist.title || "Στυλίστας"}</div>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => setStep("datetime")}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mt-4"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Πίσω στο ημερολόγιο</span>
                    </button>

                    <div className="mt-auto pt-6">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600"
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Επεξεργασία...
                          </>
                        ) : (
                          <>
                            {rescheduleAppointment ? "Επιβεβαίωση Αλλαγής" : "Επιβεβαίωση Κράτησης"}
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            ) : null}
          </div>

          {/* Right Panel - Time Slots */}
          {step === "datetime" && selectedService && (
            <div className="w-full lg:w-[280px] bg-[#1a1a1a] p-6">
              {/* Time Format Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setTimeFormat("12h")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    timeFormat === "12h" ? "bg-[#2a2a2a] text-white" : "text-gray-500 hover:text-white"
                  )}
                >
                  12h
                </button>
                <button
                  onClick={() => setTimeFormat("24h")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    timeFormat === "24h" ? "bg-[#2a2a2a] text-white" : "text-gray-500 hover:text-white"
                  )}
                >
                  24h
                </button>
              </div>

              {/* Selected Date */}
              <h4 className="text-sm font-medium text-white mb-4">
                {selectedDate ? format(selectedDate, 'EEE dd') : 'Επιλέξτε ημερομηνία'}
              </h4>

              {/* Time slots */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {selectedDate ? (
                  availableTimeSlots.length > 0 ? (
                    availableTimeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleTimeSelect(time)}
                        className={cn(
                          "w-full py-3 px-4 rounded-xl border font-medium transition-all text-center",
                          selectedTime === time
                            ? "border-red-500 bg-red-500/10 text-white"
                            : "border-[#2a2a2a] hover:border-gray-600 text-white"
                        )}
                      >
                        {formatTime(time)}
                      </button>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-4 text-sm">
                      Δεν υπάρχουν διαθέσιμες ώρες
                    </div>
                  )
                ) : (
                  <div className="text-center text-gray-500 py-4 text-sm">
                    Επιλέξτε ημερομηνία
                  </div>
                )}
              </div>

              {/* Continue Button */}
              {selectedDate && (
                <div className="mt-6">
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedTime}
                    className={cn(
                      "w-full py-3 px-6 rounded-xl font-semibold text-white transition-all",
                      selectedTime
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-gray-600 cursor-not-allowed"
                    )}
                  >
                    Συνέχεια
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernBookingForm;
