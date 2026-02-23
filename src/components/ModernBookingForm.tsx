
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Star, Check, User, Clock, Calendar as CalendarIcon, CheckCircle2, MapPin, Phone, Mail, Sparkles, ArrowRight, Home, Scissors, Euro, CalendarDays, Clock3 } from "lucide-react";
import { format } from 'date-fns';
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import { PStepper } from "@/components/p-stepper";
import { FadeInUpText } from '@/components/ui/fade-in-up-text';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  color: string;
  text_color: string;
  border_color: string;
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
  getAvailableDatesForStylist?: (stylistId: string) => Date[];
  getAvailableTimesForStylistAndDate?: (stylistId: string, date: Date) => string[];
  onSubmit: (values: any) => Promise<boolean | void>;
  isLoading: boolean;
  businessProfile: {
    full_name: string;
    brand_color?: string;
    address?: string;
    phone?: string;
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
  existingAppointments = [],
  businessProfile,
  workingDays = [0, 1, 2, 3, 4, 5, 6],
  rescheduleAppointment
}: ModernBookingFormProps) => {
  const [step, setStep] = useState(1);
  const selectedServiceId = form.watch("service_id");
  const selectedStylistId = form.watch("stylist_id");
  const selectedService = services.find(s => s.id === selectedServiceId);
  const brandColor = businessProfile?.brand_color || '#e0c4a8';

  // Filter stylists that are available for the selected service
  // If no stylistServices exist, show all stylists for any service
  const availableStylistsForService = selectedServiceId
    ? (stylistServices.length > 0 
        ? stylists.filter(stylist =>
            stylistServices.some(ss =>
              ss.stylist_id === stylist.id && ss.service_id === selectedServiceId
            )
          )
        : stylists) // Show all stylists if no service-stylist relationships defined
    : stylists;

  // Auto-advance when service is selected if on step 1
  const handleServiceSelect = (serviceId: string) => {
    form.setValue("service_id", serviceId);
    setStep(2);
  };

  // Auto-advance when time is selected if on step 2
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleBack = () => {
    if (step > 1 && step < 4) { // Don't allow back from success step
      setStep(step - 1);
    }
  };

  const steps = [
    { number: 1, title: "Υπηρεσίες", icon: User },
    { number: 2, title: "Ημερομηνία & Ώρα", icon: CalendarIcon },
    { number: 3, title: "Στοιχεία", icon: Check },
    { number: 4, title: "Ολοκλήρωση", icon: CheckCircle2 },
  ];

  const handleSubmit = async (values: any) => {
    const success = await onSubmit(values);
    if (success) {
      setStep(4);
    }
  };

  return (
    <div className="min-h-screen md:h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50 text-gray-900 p-4 font-sans flex flex-col overflow-hidden" style={{ transform: 'scale(1.2)', transformOrigin: 'top left', width: '83.33%', height: '83.33vh' }}>
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Header & Progress Bar */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            {step > 1 && step < 4 ? (
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span>Πίσω</span>
              </button>
            ) : (
              <div /> // Spacer
            )}
            <div className="text-gray-500 text-sm">
              {step < 4 ? `Βήμα ${step} από 3` : 'Ολοκληρώθηκε'}
            </div>
          </div>

          {/* PStepper Component */}
          <PStepper 
            steps={steps} 
            currentStep={step} 
            className="max-w-xl mx-auto mb-6"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Main Content Area */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl flex-1 flex flex-col min-h-0">
              <CardContent className="p-4 md:p-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                {/* STEP 1: SERVICES */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {rescheduleAppointment ? 'Αλλαγή Υπηρεσίας (Προαιρετικό)' : 'Επιλέξτε Υπηρεσία'}
                    </h2>
                    <div className="grid gap-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service.id)}
                          className={cn(
                            "group relative p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-all duration-200 shadow-sm",
                            selectedServiceId === service.id && "border-blue-500 ring-2 ring-blue-500 bg-blue-50"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold"
                                style={{ backgroundColor: service.color || '#333', color: service.text_color || '#fff' }}
                              >
                                {service.name.charAt(0)}
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-gray-900 group-hover:text-gray-900 transition-colors">
                                  {service.name}
                                </h3>
                                <p className="text-gray-500 text-xs">{service.duration} λεπτά</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-bold text-gray-900">{service.price} €</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: DATE & TIME */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 h-full flex flex-col">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex-shrink-0">
                      {rescheduleAppointment ? 'Νέα Ημερομηνία & Ώρα' : 'Επιλέξτε Ημερομηνία & Ώρα'}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
                      {/* Calendar */}
                      <div className="calendar-white-theme overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => {
                            if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                            return !workingDays.includes(date.getDay());
                          }}
                          className="p-0 w-full"
                          classNames={{
                            months: "w-full",
                            month: "w-full space-y-2",
                            caption: "flex justify-between pt-1 relative items-center mb-2",
                            caption_label: "text-base font-medium text-gray-900",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-6 w-6 bg-transparent p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex justify-between w-full mb-1",
                            head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.7rem] uppercase",
                            row: "flex w-full mt-1 justify-between",
                            cell: "text-center text-xs p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                            day: cn(
                              "h-8 w-8 p-0 font-normal text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-all duration-200",
                              "aria-selected:opacity-100"
                            ),
                            day_selected: "text-white hover:text-white font-medium",
                            day_today: "text-gray-900 font-bold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-current after:rounded-full",
                            day_outside: "text-gray-400 opacity-50",
                            day_disabled: "text-gray-300 opacity-30 line-through decoration-gray-300",
                          }}
                          modifiersStyles={{
                            selected: { backgroundColor: brandColor }
                          }}
                        />
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-2 flex flex-col min-h-0">
                        <div className="text-gray-600 mb-2 text-xs flex-shrink-0">
                          {selectedDate ? format(selectedDate, 'EEEE d MMMM') : 'Επιλέξτε ημερομηνία'}
                        </div>
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1 content-start">
                          {timeSlots.filter(time => isTimeSlotAvailable(time)).map((time) => {
                            const availableStylists = getAvailableStylistsForTime ? getAvailableStylistsForTime(time) : [];
                            
                            return (
                              <div key={time} className="space-y-1">
                                <Button
                                  variant="outline"
                                  onClick={() => handleTimeSelect(time)}
                                  style={selectedTime === time ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                                  className={cn(
                                    "w-full justify-center text-xs font-medium h-9 rounded-full border transition-all duration-200",
                                    selectedTime === time
                                      ? "text-white hover:opacity-90 hover:text-white"
                                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50"
                                  )}
                                >
                                  {time}
                                </Button>
                                {selectedTime === time && availableStylists.length > 0 && (
                                  <div className="text-xs text-gray-500 px-2">
                                    {availableStylists.length} stylist{availableStylists.length > 1 ? 's' : ''} available
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {selectedDate && timeSlots.filter(time => isTimeSlotAvailable(time)).length === 0 && (
                            <div className="col-span-2 text-center text-gray-500 py-4 text-sm">
                              Δεν υπάρχουν διαθέσιμα ραντεβού
                            </div>
                          )}
                          {!selectedDate && (
                            <div className="col-span-2 text-center text-gray-500 py-4 text-sm">
                              Επιλέξτε ημερομηνία για να δείτε τις ώρες
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: INFO FORM */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      {rescheduleAppointment ? 'Επιβεβαίωση Στοιχείων' : 'Στοιχεία Κράτησης'}
                    </h2>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
                        <div className="grid md:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="customer_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-600 text-xs">Ονοματεπώνυμο</FormLabel>
                                <FormControl>
                                  <Input {...field} className="bg-white border-gray-300 text-gray-900 rounded-xl h-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
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
                                <FormLabel className="text-gray-600 text-xs">Email</FormLabel>
                                <FormControl>
                                  <Input {...field} className="bg-white border-gray-300 text-gray-900 rounded-xl h-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="customer_phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-600 text-xs">Τηλέφωνο</FormLabel>
                                <FormControl>
                                  <Input {...field} className="bg-white border-gray-300 text-gray-900 rounded-xl h-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-600 text-xs">Σημειώσεις</FormLabel>
                                <FormControl>
                                  <Input {...field} className="bg-white border-gray-300 text-gray-900 rounded-xl h-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          {/* Only show stylist selection if services exist */}
                          {services.length > 0 && (
                            <FormField
                              control={form.control}
                              name="stylist_id"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-600 text-xs">Επιλογή Στυλίστα</FormLabel>
                                  <FormControl>
                                    <div className="grid sm:grid-cols-2 gap-2">
                                      {availableStylistsForService.length === 0 && (
                                        <div className="text-gray-500 text-xs col-span-2">
                                          {selectedServiceId 
                                            ? 'Δεν υπάρχουν διαθέσιμοι στυλίστες για αυτή την υπηρεσία'
                                            : 'Επιλέξτε υπηρεσία πρώτα'
                                          }
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
                                              "flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 bg-white",
                                              isSelected
                                                ? "border-blue-500 shadow-[0_0_0_2px] shadow-blue-500/20"
                                                : "border-gray-300 hover:border-gray-400"
                                            )}
                                          >
                                            <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-sm font-semibold text-gray-700">
                                              {stylist.avatar_url ? (
                                                <img src={stylist.avatar_url} alt={stylist.name} className="h-full w-full object-cover" />
                                              ) : (
                                                stylist.name.charAt(0).toUpperCase()
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-gray-900 text-sm font-medium truncate">{stylist.name}</div>
                                              <div className="text-gray-500 text-xs truncate">{stylist.title || "Στυλίστας"}</div>
                                            </div>
                                            <div
                                              className={cn(
                                                "h-2 w-2 rounded-full",
                                                isSelected ? "bg-green-500" : "bg-gray-300"
                                              )}
                                            />
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
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-blue-600 text-white font-bold h-11 rounded-xl mt-2 transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20"
                        >
                          {isLoading ? "Επεξεργασία..." : (rescheduleAppointment ? "Επιβεβαίωση Αλλαγής" : "Επιβεβαίωση Κράτησης")}
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}

                {/* STEP 4: SUCCESS CONFIRMATION */}
                {step === 4 && (
                  <div className="flex flex-col items-center justify-center min-h-full animate-in fade-in zoom-in duration-500 py-8 w-full">
                    <Card className="w-full max-w-lg border-0 bg-white shadow-2xl overflow-hidden">
                      {/* Success Header */}
                      <CardContent className="p-0">
                        <div className="bg-gradient-to-r from-green-50 via-green-100/50 to-green-50 p-8 text-center border-b border-green-200">
                          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 ring-4 ring-green-200">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {rescheduleAppointment ? 'Το ραντεβού άλλαξε!' : 'Η κράτηση ολοκληρώθηκε!'}
                          </h2>
                          <p className="text-gray-600 max-w-sm mx-auto text-sm">
                            {rescheduleAppointment
                              ? 'Το ραντεβού σας ενημερώθηκε επιτυχώς. Θα λάβετε email επιβεβαίωσης.'
                              : 'Ευχαριστούμε για την προτίμηση. Θα λάβετε email επιβεβαίωσης σύντομα.'}
                          </p>
                        </div>

                        {/* Booking Details Card */}
                        <div className="p-6 space-y-6">
                          {/* Service Info */}
                          <div className="flex items-start gap-4">
                            <div
                              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg"
                              style={{ backgroundColor: selectedService?.color || '#333', color: selectedService?.text_color || '#fff' }}
                            >
                              <Scissors className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 text-lg">{selectedService?.name}</h3>
                              <p className="text-gray-500 text-sm">{selectedService?.duration} λεπτά</p>
                              <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700 border-green-200">
                                <Euro className="w-3 h-3 mr-1" />
                                {selectedService?.price} €
                              </Badge>
                            </div>
                          </div>

                          <Separator className="bg-gray-200" />

                          {/* Date & Time */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <CalendarDays className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-wide">Ημερομηνία</span>
                              </div>
                              <p className="text-gray-900 font-medium">
                                {selectedDate && format(selectedDate, 'EEEE d MMMM')}
                              </p>
                              <p className="text-gray-500 text-sm">
                                {selectedDate && format(selectedDate, 'yyyy')}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <Clock3 className="w-4 h-4" />
                                <span className="text-xs uppercase tracking-wide">Ώρα</span>
                              </div>
                              <p className="text-gray-900 font-medium text-lg">{selectedTime}</p>
                              <p className="text-gray-500 text-sm">τοπική ώρα</p>
                            </div>
                          </div>

                          {/* Stylist Info */}
                          {selectedStylistId && (
                            <>
                              <Separator className="bg-gray-200" />
                              <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Στυλίστας</p>
                                {(() => {
                                  const stylist = stylists.find(s => s.id === selectedStylistId);
                                  return stylist ? (
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-12 w-12 border-2 border-gray-200">
                                        <AvatarImage src={stylist.avatar_url || undefined} alt={stylist.name} />
                                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                          {stylist.name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="text-gray-900 font-medium">{stylist.name}</p>
                                        <p className="text-gray-500 text-sm">{stylist.title || "Στυλίστας"}</p>
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </>
                          )}

                          {/* Location Info */}
                          {(businessProfile?.address) && (
                            <>
                              <Separator className="bg-gray-200" />
                              <div className="flex items-start gap-3 bg-gray-50/50 rounded-xl p-4 border border-gray-200">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <MapPin className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-gray-900 font-medium">{businessProfile.full_name}</p>
                                  <p className="text-gray-600 text-sm">{businessProfile.address}</p>
                                  {businessProfile.phone && (
                                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {businessProfile.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {/* Total Price */}
                          <div className="bg-gradient-to-r from-green-50 via-green-100/50 to-green-50 rounded-xl p-4 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-green-600" />
                                <span className="text-green-700 font-medium">Σύνολο προς πληρωμή</span>
                              </div>
                              <span className="text-2xl font-bold text-gray-900">{selectedService?.price} €</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 pt-0 space-y-3">
                          <Button
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold h-12 rounded-xl shadow-lg shadow-green-500/20"
                            onClick={() => window.location.reload()}
                          >
                            <Home className="w-4 h-4 mr-2" />
                            Νέα Κράτηση
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 h-11 rounded-xl"
                            onClick={() => window.print()}
                          >
                            Εκτύπωση Επιβεβαίωσης
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* Right Column: Shop Info & Summary */}
          {step < 4 && (
            <div className="space-y-4 flex flex-col min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {/* Shop Card */}
              <Card className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl flex-shrink-0">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-blue-50 via-purple-50/50 to-blue-50 p-6 text-center border-b border-gray-200">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20 ring-4 ring-white">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-gray-200">
                        <span className="text-xl font-serif italic text-gray-900">{businessProfile?.full_name?.charAt(0) || 'B'}</span>
                      </div>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-1">{businessProfile?.full_name || "Business Name"}</h2>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0">
                      <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                      5.0 • 338 κριτικές
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    {businessProfile?.address && (
                      <div className="flex items-start gap-2 text-gray-600 text-xs">
                        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span>{businessProfile.address}</span>
                      </div>
                    )}
                    {businessProfile?.phone && (
                      <div className="flex items-center gap-2 text-gray-600 text-xs">
                        <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{businessProfile.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 text-xs">
                      <Mail className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>Επιβεβαίωση μέσω email</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xl flex-shrink-0">
                <CardContent className="p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Σύνοψη Κράτησης
                  </h3>

                  {selectedService ? (
                    <div className="space-y-4">
                      {/* Service Info */}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: selectedService.color || '#333', color: selectedService.text_color || '#fff' }}
                        >
                          <Scissors className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 font-medium text-sm truncate">{selectedService.name}</p>
                          <p className="text-gray-500 text-xs">{selectedService.duration} λεπτά</p>
                        </div>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-900 border-0">
                          {selectedService.price} €
                        </Badge>
                      </div>

                      <Separator className="bg-gray-200" />

                      {/* Date & Time */}
                      {selectedDate && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-700">
                            <CalendarDays className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{format(selectedDate, 'EEEE d MMMM yyyy')}</span>
                          </div>
                          {selectedTime && (
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock3 className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium">{selectedTime}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stylist Info */}
                      {selectedStylistId && (
                        <>
                          <Separator className="bg-gray-200" />
                          {(() => {
                            const stylist = stylists.find(s => s.id === selectedStylistId);
                            return stylist ? (
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-gray-200">
                                  <AvatarImage src={stylist.avatar_url || undefined} alt={stylist.name} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-semibold">
                                    {stylist.name?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="text-gray-900 text-sm font-medium truncate">{stylist.name}</p>
                                  <p className="text-gray-500 text-xs">{stylist.title || "Στυλίστας"}</p>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </>
                      )}

                      <Separator className="bg-gray-200" />

                      {/* Total */}
                      <div className="bg-gradient-to-r from-blue-50 via-purple-50/50 to-blue-50 rounded-xl p-3 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 text-sm font-medium">Σύνολο</span>
                          <span className="text-xl font-bold text-gray-900">{selectedService.price} €</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-xs text-center py-4">
                      Επιλέξτε υπηρεσία, ημερομηνία και ώρα
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernBookingForm;

