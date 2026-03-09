import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Clock, User, Calendar as CalendarIcon, Check, Video, Globe, ArrowRight, MapPin } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek } from 'date-fns';
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
  existingAppointments?: { id: string; appointment_date: string; appointment_time: string; service: Service; stylist_id?: string | null }[];
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  timeSlots: string[];
  isTimeSlotAvailable: (time: string) => boolean;
  getAvailableStylistsForTime?: (time: string) => any[];
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
  getAvailableStylistsForTime,
  onSubmit,
  isLoading,
  businessProfile,
  workingDays = [0, 1, 2, 3, 4, 5, 6],
  rescheduleAppointment
}: ModernBookingFormProps) => {
  const [step, setStep] = useState<"service" | "datetime" | "stylist" | "details" | "success">("service");
  const [selectedStylistId, setSelectedStylistId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("12h");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [accentColor, setAccentColor] = useState<string>("#ef4444"); // Default red
  const [showThemeControls, setShowThemeControls] = useState(false);
  
  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedStylist = stylists.find(s => s.id === selectedStylistId);

  // Get available stylists for selected time
  const availableStylistsForTime = selectedTime && getAvailableStylistsForTime
    ? getAvailableStylistsForTime(selectedTime)
    : stylists;

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

  // Calendar days - show full weeks including prev/next month days
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Week days header - starting from Monday
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  // Predefined accent colors
  const accentColors = [
    { name: "Red", value: "#ef4444" },
    { name: "Orange", value: "#f97316" },
    { name: "Amber", value: "#f59e0b" },
    { name: "Green", value: "#22c55e" },
    { name: "Emerald", value: "#10b981" },
    { name: "Teal", value: "#14b8a6" },
    { name: "Cyan", value: "#06b6d4" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Indigo", value: "#6366f1" },
    { name: "Violet", value: "#8b5cf6" },
    { name: "Purple", value: "#a855f7" },
    { name: "Fuchsia", value: "#d946ef" },
    { name: "Pink", value: "#ec4899" },
    { name: "Rose", value: "#f43f5e" },
  ];

  // Theme-aware color classes
  const getBgClass = () => theme === "dark" ? "bg-[#0f0f0f]" : "bg-gray-50";
  const getCardBgClass = () => theme === "dark" ? "bg-[#1a1a1a]" : "bg-white";
  const getCardBgClassSecondary = () => theme === "dark" ? "bg-[#1f1f1f]" : "bg-gray-50";
  const getCardBgClassTertiary = () => theme === "dark" ? "bg-[#2a2a2a]" : "bg-gray-100";
  const getCardBgClassQuaternary = () => theme === "dark" ? "bg-[#3a3a3a]" : "bg-gray-200";
  const getTextClass = () => theme === "dark" ? "text-white" : "text-gray-900";
  const getTextMutedClass = () => theme === "dark" ? "text-gray-400" : "text-gray-500";
  const getTextSecondaryClass = () => theme === "dark" ? "text-gray-300" : "text-gray-600";
  const getBorderClass = () => theme === "dark" ? "border-[#2a2a2a]" : "border-gray-200";
  const getInputBgClass = () => theme === "dark" ? "bg-[#1f1f1f]" : "bg-white";
  const getRingClass = () => theme === "dark" ? "ring-[#2a2a2a]" : "ring-gray-200";

  // Accent color style
  const accentStyle = { backgroundColor: accentColor, borderColor: accentColor };
  const accentTextStyle = { color: accentColor };
  const accentBgLightStyle = { backgroundColor: `${accentColor}20`, borderColor: accentColor };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    form.setValue("service_id", serviceId);
    setAnimationDirection("forward");
    setStep("datetime");
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime("");
    setSelectedStylistId("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setSelectedStylistId("");
  };

  const handleStylistSelect = (stylistId: string) => {
    setSelectedStylistId(stylistId);
    form.setValue("stylist_id", stylistId);
    setAnimationDirection("forward");
    setStep("details");
  };

  const handleContinue = () => {
    if (!selectedTime) return;
    setAnimationDirection("forward");
    if (stylists.length > 0) {
      setStep("stylist");
    } else {
      setStep("details");
    }
  };

  const handleBack = (targetStep: "service" | "datetime" | "stylist") => {
    setAnimationDirection("backward");
    setStep(targetStep);
  };

  const formatTime = (time: string) => {
    if (timeFormat === "24h") return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleSubmit = async (values: any) => {
    // Ensure stylist_id is set if stylists are available
    if (stylists.length > 0 && !values.stylist_id && selectedStylistId) {
      values.stylist_id = selectedStylistId;
    }
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
    <div className={`min-h-screen ${getBgClass()} ${getTextClass()}`}>
      {/* Theme Toggle Button */}
      <button
        onClick={() => setShowThemeControls(!showThemeControls)}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full ${getCardBgClass()} ${getBorderClass()} border shadow-lg hover:scale-105 transition-transform`}
      >
        <div className="w-5 h-5 rounded-full" style={accentStyle} />
      </button>

      {/* Theme Controls Panel */}
      {showThemeControls && (
        <div className={`fixed top-16 right-4 z-50 p-4 rounded-xl ${getCardBgClass()} ${getBorderClass()} border shadow-xl w-64`}>
          <h3 className={`text-sm font-semibold mb-3 ${getTextClass()}`}>Theme Settings</h3>
          
          {/* Dark/Light Toggle */}
          <div className="mb-4">
            <label className={`text-xs ${getTextMutedClass()} mb-2 block`}>Mode</label>
            <div className={`flex gap-2 p-1 rounded-lg ${getCardBgClassSecondary()}`}>
              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors",
                  theme === "dark" ? getTextClass() : getTextMutedClass(),
                  theme === "dark" && getCardBgClassTertiary()
                )}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors",
                  theme === "light" ? getTextClass() : getTextMutedClass(),
                  theme === "light" && getCardBgClassTertiary()
                )}
              >
                Light
              </button>
            </div>
          </div>

          {/* Accent Color Picker */}
          <div>
            <label className={`text-xs ${getTextMutedClass()} mb-2 block`}>Accent Color</label>
            <div className="grid grid-cols-7 gap-1.5">
              {accentColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setAccentColor(color.value)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-transform hover:scale-110",
                    accentColor === color.value && "ring-2 ring-offset-2 ring-offset-gray-900 ring-white"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {step === "service" ? (
        /* Service Selection - Centered Single Page */
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-md">
            {/* Business Profile Header */}
            <div className="text-center mb-8">
              <div className={`w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 ring-2 ${getRingClass()}`}>
                <img 
                  src={businessProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${businessProfile?.full_name || 'user'}`}
                  alt={businessProfile?.full_name || 'Business'}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className={`text-xl font-semibold ${getTextClass()} mb-1`}>{businessProfile?.full_name || 'Book an Appointment'}</h1>
              <p className={`${getTextMutedClass()} text-sm`}>Select a service to continue</p>
            </div>

            {/* Services List */}
            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service.id)}
                  className={cn(
                    `w-full p-4 rounded-2xl border text-left transition-all ${getCardBgClass()} hover:${getCardBgClassSecondary()}`,
                    selectedServiceId === service.id
                      ? "ring-1"
                      : getBorderClass()
                  )}
                  style={selectedServiceId === service.id ? accentBgLightStyle : {}}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className={`font-medium ${getTextClass()} text-base`}>{service.name}</p>
                      {service.description && (
                        <p className={`text-sm ${getTextMutedClass()} mt-1 line-clamp-2`}>{service.description}</p>
                      )}
                    </div>
                    <p className={`text-lg font-bold ${getTextClass()} ml-4`}>€{service.price}</p>
                  </div>
                  <div className={`flex items-center gap-2 ${getTextMutedClass()} text-sm`}>
                    <Clock className="w-4 h-4" />
                    <span>{service.duration} mins</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <p className={`text-center ${getTextMutedClass()} text-xs mt-8`}>
              Powered by Cutzio
            </p>
          </div>
        </div>
      ) : (
        /* Multi-step Booking Form - Centered */
        <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-6xl">
        {/* Main 3-Panel Layout with Animation */}
        <div 
          className={cn(
            `flex flex-col lg:flex-row min-h-[600px] ${getCardBgClass()} rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ease-out`,
            animationDirection === "forward" ? "animate-in slide-in-from-right-4" : "animate-in slide-in-from-left-4"
          )}
          key={step}
        >
          
          {/* Left Panel - Service Info */}
          <div className={`w-full lg:w-[320px] ${getCardBgClass()} p-6 lg:p-8 flex flex-col border-b lg:border-b-0 lg:border-r ${getBorderClass()}`}>
            {/* Profile */}
            <div className="mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden">
                <img 
                  src={businessProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${businessProfile?.full_name || 'user'}`}
                  alt={businessProfile?.full_name || 'Business'}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className={`mt-3 text-sm ${getTextMutedClass()}`}>{businessProfile?.full_name || 'Business Name'}</p>
            </div>

            {/* Service Selection or Selected Service */}
            {step === "service" ? (
              <>
                <h2 className={`text-xl font-semibold ${getTextClass()} mb-4`}>Select a Service</h2>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => handleServiceSelect(service.id)}
                      className={cn(
                        `w-full p-4 rounded-xl border text-left transition-all ${getCardBgClass()}`,
                        selectedServiceId === service.id
                          ? "border-red-500 bg-[#2a2a2a]"
                          : getBorderClass() + " hover:border-gray-600"
                      )}
                      style={selectedServiceId === service.id ? accentBgLightStyle : {}}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className={`font-medium ${getTextClass()}`}>{service.name}</p>
                        <p className={`text-lg font-bold ${getTextClass()}`}>€{service.price}</p>
                      </div>
                      <p className={`text-sm ${getTextMutedClass()}`}>{service.duration} mins</p>
                    </button>
                  ))}
                </div>
              </>
            ) : selectedService ? (
              <>
                {/* Selected Service Title */}
                <h2 className={`text-xl font-semibold ${getTextClass()} mb-2`}>
                  [{selectedService.duration}-min] {selectedService.name}
                </h2>
                
                {selectedService.description && (
                  <p className={`text-sm ${getTextMutedClass()} mb-6 leading-relaxed`}>{selectedService.description}</p>
                )}

                {/* Service Details */}
                <div className="space-y-3 text-sm">
                  <div className={`flex items-center gap-2 ${getTextSecondaryClass()}`}>
                    <Clock className={`w-4 h-4 ${getTextMutedClass()}`} />
                    <span>{selectedService.duration} min</span>
                  </div>
                  <div className={`flex items-center gap-2 ${getTextSecondaryClass()}`}>
                    <Video className={`w-4 h-4 ${getTextMutedClass()}`} />
                    <span>Google Meet</span>
                  </div>
                  <div className={`flex items-center gap-2 ${getTextSecondaryClass()}`}>
                    <MapPin className={`w-4 h-4 ${getTextMutedClass()}`} />
                    <span>{businessProfile?.address || "Salon Location"}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${getTextSecondaryClass()}`}>
                    <Globe className={`w-4 h-4 ${getTextMutedClass()}`} />
                    <span>Europe/Athens</span>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-auto pt-6">
                  <p className={`text-2xl font-bold ${getTextClass()}`}>€{selectedService.price}</p>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => handleBack("service")}
                  className={`flex items-center gap-2 ${getTextMutedClass()} hover:${getTextClass()} transition-colors mt-4 text-sm`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Change service</span>
                </button>
              </>
            ) : null}
          </div>

          {/* Center Panel - Calendar */}
          <div className={`flex-1 ${getCardBgClass()} p-6 lg:p-8 border-b lg:border-b-0 lg:border-r ${getBorderClass()}`}>
            {(step === "datetime" || step === "stylist" || step === "details") && selectedService ? (
              <div className="h-full flex flex-col">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-semibold ${getTextClass()}`}>
                    {format(currentMonth, 'MMMM')} <span className={getTextMutedClass()}>{format(currentMonth, 'yyyy')}</span>
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg hover:${getCardBgClassTertiary()} transition-colors ${getTextMutedClass()}`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg hover:${getCardBgClassTertiary()} transition-colors ${getTextMutedClass()}`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Week days header */}
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {weekDays.map(day => (
                    <div key={day} className={`text-center text-xs font-medium ${getTextMutedClass()} py-2`}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, new Date());
                    const isDisabled = day < new Date(new Date().setHours(0, 0, 0, 0)) || !workingDays.includes(getDay(day));
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => !isDisabled && handleDateSelect(day)}
                        disabled={isDisabled}
                        className={cn(
                          `aspect-square flex items-center justify-center text-sm font-medium rounded-xl transition-all min-h-[44px]`,
                          isSelected
                            ? "text-white"
                            : isDisabled
                            ? "text-gray-400 cursor-not-allowed"
                            : !isCurrentMonth
                            ? getTextMutedClass()
                            : isToday
                            ? `${getTextClass()} border ${getBorderClass()}`
                            : `${getTextClass()} hover:${getCardBgClassTertiary()} ${getCardBgClassSecondary()}`
                        )}
                        style={isSelected ? accentStyle : {}}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Date Display */}
                {selectedDate && (
                  <div className={`mt-6 pt-6 border-t ${getBorderClass()}`}>
                    <p className={`text-sm ${getTextMutedClass()} mb-2`}>Selected Date</p>
                    <p className={`text-lg font-medium ${getTextClass()}`}>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Right Panel - Time Slots / Stylists / Details */}
          <div className={`w-full lg:w-[300px] ${getCardBgClass()} p-6`}>
            {step === "datetime" && selectedService && (
              <>
                {/* Time Format Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-sm font-medium ${getTextClass()}`}>
                    {selectedDate ? format(selectedDate, 'EEE dd') : 'Select a date'}
                  </h4>
                  <div className={`flex gap-1 ${getCardBgClassTertiary()} rounded-lg p-1`}>
                    <button
                      onClick={() => setTimeFormat("12h")}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium transition-colors",
                        timeFormat === "12h" ? `${getCardBgClassQuaternary()} ${getTextClass()}` : `${getTextMutedClass()} hover:${getTextClass()}`
                      )}
                    >
                      12h
                    </button>
                    <button
                      onClick={() => setTimeFormat("24h")}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-medium transition-colors",
                        timeFormat === "24h" ? `${getCardBgClassQuaternary()} ${getTextClass()}` : `${getTextMutedClass()} hover:${getTextClass()}`
                      )}
                    >
                      24h
                    </button>
                  </div>
                </div>

                {/* Time slots */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {selectedDate ? (
                    availableTimeSlots.length > 0 ? (
                      availableTimeSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={cn(
                            `w-full py-3 px-4 rounded-xl border font-medium transition-all text-center ${getTextClass()}`,
                            selectedTime === time
                              ? "border-transparent text-white"
                              : `${getBorderClass()} hover:border-gray-600 ${getCardBgClassSecondary()}`
                          )}
                          style={selectedTime === time ? accentBgLightStyle : {}}
                        >
                          {formatTime(time)}
                        </button>
                      ))
                    ) : (
                      <div className={`text-center ${getTextMutedClass()} py-4 text-sm`}>
                        No available times
                      </div>
                    )
                  ) : (
                    <div className={`text-center ${getTextMutedClass()} py-4 text-sm`}>
                      Select a date to see available times
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                {selectedDate && availableTimeSlots.length > 0 && (
                  <div className="mt-6">
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedTime}
                      className={cn(
                        "w-full py-3 px-6 rounded-xl font-semibold text-white transition-all",
                        selectedTime
                          ? ""
                          : "bg-gray-600 cursor-not-allowed"
                      )}
                      style={selectedTime ? accentStyle : {}}
                    >
                      Continue
                    </Button>
                  </div>
                )}
              </>
            )}

            {step === "stylist" && selectedService && (
              <>
                <h4 className={`text-sm font-medium ${getTextClass()} mb-4`}>Select Stylist</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {availableStylistsForTime.length > 0 ? (
                    availableStylistsForTime.map((stylist) => {
                      const isSelected = selectedStylistId === stylist.id;
                      return (
                        <button
                          key={stylist.id}
                          onClick={() => handleStylistSelect(stylist.id)}
                          className={cn(
                            `w-full p-4 rounded-xl border text-left transition-all ${getCardBgClassSecondary()}`,
                            isSelected
                              ? "border-transparent"
                              : `${getBorderClass()} hover:border-gray-600`
                          )}
                          style={isSelected ? accentBgLightStyle : {}}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full ${getCardBgClassQuaternary()} overflow-hidden flex items-center justify-center text-sm font-semibold ${getTextClass()}`}>
                              {stylist.avatar_url ? (
                                <img src={stylist.avatar_url} alt={stylist.name} className="h-full w-full object-cover" />
                              ) : (
                                stylist.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`${getTextClass()} text-sm font-medium truncate`}>{stylist.name}</div>
                              <div className={`${getTextMutedClass()} text-xs truncate`}>{stylist.title || "Stylist"}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className={`text-center ${getTextMutedClass()} py-4 text-sm`}>
                      No stylists available for this time
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleBack("datetime")}
                  className={`flex items-center gap-2 ${getTextMutedClass()} hover:${getTextClass()} transition-colors mt-4 text-sm`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to time selection</span>
                </button>
              </>
            )}

            {step === "details" && selectedService && (
              <div className="h-full flex flex-col">
                <h4 className={`text-sm font-medium ${getTextClass()} mb-4`}>Your Details</h4>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 flex-1">
                    <FormField
                      control={form.control}
                      name="customer_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`${getTextMutedClass()} text-sm`}>Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${getTextMutedClass()}`} />
                              <Input 
                                {...field} 
                                className={`w-full pl-10 pr-3 py-3 ${getInputBgClass()} border ${getBorderClass()} rounded-xl focus:outline-none transition-colors ${getTextClass()} placeholder-gray-500 text-sm`}
                                placeholder="Your name"
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
                          <FormLabel className={`${getTextMutedClass()} text-sm`}>Email</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className={`w-full px-3 py-3 ${getInputBgClass()} border ${getBorderClass()} rounded-xl focus:outline-none transition-colors ${getTextClass()} placeholder-gray-500 text-sm`}
                              placeholder="email@example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customer_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`${getTextMutedClass()} text-sm`}>Phone</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              className={`w-full px-3 py-3 ${getInputBgClass()} border ${getBorderClass()} rounded-xl focus:outline-none transition-colors ${getTextClass()} placeholder-gray-500 text-sm`}
                              placeholder="+30 691 234 5678"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="mt-auto pt-4">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 text-sm"
                        style={accentStyle}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {rescheduleAppointment ? "Confirm Change" : "Book Appointment"}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>

                <button
                  onClick={() => handleBack(stylists.length > 0 ? "stylist" : "datetime")}
                  className={`flex items-center gap-2 ${getTextMutedClass()} hover:${getTextClass()} transition-colors mt-4 text-sm`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      )}
    </div>
  );
};

export default ModernBookingForm;
