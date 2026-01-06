
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ChevronLeft, Star, Check, User, Clock, Calendar as CalendarIcon, CheckCircle2, MapPin, Phone, Mail } from "lucide-react";
import { format } from 'date-fns';
import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

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
  } | null;
  workingDays?: number[];
  rescheduleAppointment?: any;
}

const ModernBookingForm = ({
  form,
  services,
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
  const [step, setStep] = useState(1);
  const selectedServiceId = form.watch("service_id");
  const selectedService = services.find(s => s.id === selectedServiceId);
  const brandColor = businessProfile?.brand_color || '#e0c4a8';

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
    <div className="min-h-screen md:h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-4 font-sans flex flex-col overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col min-h-0">
        {/* Header & Progress Bar */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            {step > 1 && step < 4 ? (
              <button
                onClick={handleBack}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span>Πίσω</span>
              </button>
            ) : (
              <div /> // Spacer
            )}
            <div className="text-gray-400 text-sm">
              {step < 4 ? `Βήμα ${step} από 3` : 'Ολοκληρώθηκε'}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="relative flex justify-between max-w-xl mx-auto mb-6">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-800 -z-10 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-white transition-all duration-500 -z-10 -translate-y-1/2"
              style={{ width: `${((Math.min(step, 4) - 1) / 3) * 100}%` }}
            />

            {steps.map((s) => {
              const isActive = step >= s.number;
              const isCurrent = step === s.number;

              return (
                <div key={s.number} className="flex flex-col items-center gap-2 bg-[#1a1a1a] px-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isActive
                        ? "bg-white border-white text-black"
                        : "bg-[#1a1a1a] border-gray-700 text-gray-500",
                      isCurrent && "ring-4 ring-white/20"
                    )}
                  >
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium transition-colors duration-300 hidden md:block",
                    isActive ? "text-white" : "text-gray-500"
                  )}>
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Main Content Area */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0">
              <CardContent className="p-4 md:p-6 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                {/* STEP 1: SERVICES */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
                    <h2 className="text-xl font-bold text-white mb-4">
                      {rescheduleAppointment ? 'Αλλαγή Υπηρεσίας (Προαιρετικό)' : 'Επιλέξτε Υπηρεσία'}
                    </h2>
                    <div className="grid gap-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service.id)}
                          className={cn(
                            "group relative p-3 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 cursor-pointer transition-all duration-200",
                            selectedServiceId === service.id && "border-white ring-1 ring-white bg-gray-800"
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
                                <h3 className="text-base font-bold text-white group-hover:text-white transition-colors">
                                  {service.name}
                                </h3>
                                <p className="text-gray-400 text-xs">{service.duration} λεπτά</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-bold text-white">{service.price} €</span>
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
                    <h2 className="text-xl font-bold text-white mb-4 flex-shrink-0">
                      {rescheduleAppointment ? 'Νέα Ημερομηνία & Ώρα' : 'Επιλέξτε Ημερομηνία & Ώρα'}
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 flex-1 min-h-0">
                      {/* Calendar */}
                      <div className="calendar-dark-theme overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
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
                            caption_label: "text-base font-medium text-gray-200",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-6 w-6 bg-transparent p-0 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex justify-between w-full mb-1",
                            head_cell: "text-gray-500 rounded-md w-8 font-normal text-[0.7rem] uppercase",
                            row: "flex w-full mt-1 justify-between",
                            cell: "text-center text-xs p-0 relative [&:has([aria-selected])]:bg-transparent focus-within:relative focus-within:z-20",
                            day: cn(
                              "h-8 w-8 p-0 font-normal text-gray-300 hover:bg-gray-800 hover:text-white rounded-full transition-all duration-200",
                              "aria-selected:opacity-100"
                            ),
                            day_selected: "text-black hover:text-black font-medium",
                            day_today: "text-white font-bold relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-current after:rounded-full",
                            day_outside: "text-gray-700 opacity-50",
                            day_disabled: "text-gray-700 opacity-30 line-through decoration-gray-700",
                          }}
                          modifiersStyles={{
                            selected: { backgroundColor: brandColor }
                          }}
                        />
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-2 flex flex-col min-h-0">
                        <div className="text-gray-400 mb-2 text-xs flex-shrink-0">
                          {selectedDate ? format(selectedDate, 'EEEE d MMMM') : 'Επιλέξτε ημερομηνία'}
                        </div>
                        <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] flex-1 content-start">
                          {timeSlots.filter(time => isTimeSlotAvailable(time)).map((time) => (
                            <Button
                              key={time}
                              variant="outline"
                              onClick={() => handleTimeSelect(time)}
                              style={selectedTime === time ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                              className={cn(
                                "w-full justify-center text-xs font-medium h-9 rounded-full border transition-all duration-200",
                                selectedTime === time
                                  ? "text-black hover:opacity-90 hover:text-black"
                                  : "bg-transparent border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white hover:bg-gray-800"
                              )}
                            >
                              {time}
                            </Button>
                          ))}
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
                    <h2 className="text-xl font-bold text-white mb-4">
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
                                <FormLabel className="text-gray-400 text-xs">Ονοματεπώνυμο</FormLabel>
                                <FormControl>
                                  <Input {...field} className="bg-[#1a1a1a] border-gray-700 text-white rounded-xl h-10 text-sm focus:border-current focus:ring-1 focus:ring-current" />
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
                                <FormLabel className="text-gray-400 text-xs">Email</FormLabel>
                                <FormControl>
                                  <Input {...field} className="bg-[#1a1a1a] border-gray-700 text-white rounded-xl h-10 text-sm focus:border-current focus:ring-1 focus:ring-current" />
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
                                <FormLabel className="text-gray-400 text-xs">Τηλέφωνο</FormLabel>
                                <FormControl>
                                  <Input {...field} className="bg-[#1a1a1a] border-gray-700 text-white rounded-xl h-10 text-sm focus:border-current focus:ring-1 focus:ring-current" />
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
                                <FormLabel className="text-gray-400 text-xs">Σημειώσεις</FormLabel>
                                <FormControl>
                                  <Input {...field} className="bg-[#1a1a1a] border-gray-700 text-white rounded-xl h-10 text-sm focus:border-current focus:ring-1 focus:ring-current" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold h-11 rounded-xl mt-2 transition-all hover:opacity-90 hover:shadow-lg hover:shadow-blue-500/20"
                        >
                          {isLoading ? "Επεξεργασία..." : (rescheduleAppointment ? "Επιβεβαίωση Αλλαγής" : "Επιβεβαίωση Κράτησης")}
                        </Button>
                      </form>
                    </Form>
                  </div>
                )}

                {/* STEP 4: SUCCESS CONFIRMATION */}
                {step === 4 && (
                  <div className="flex flex-col items-center justify-center min-h-full animate-in fade-in zoom-in duration-500 text-center space-y-6 py-8 w-full">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-2 flex-shrink-0">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>

                    <div className="space-y-2 flex-shrink-0">
                      <h2 className="text-2xl font-bold text-white">
                        {rescheduleAppointment ? 'Το ραντεβού άλλαψε!' : 'Η κράτηση ολοκληρώθηκε!'}
                      </h2>
                      <p className="text-gray-400 max-w-sm mx-auto">
                        {rescheduleAppointment
                          ? 'Το ραντεβού σας ενημερώθηκε επιτυχώς. Θα λάβετε email επιβεβαίωσης.'
                          : 'Ευχαριστούμε για την προτίμηση. Θα λάβετε email επιβεβαίωσης σύντομα.'}
                      </p>
                    </div>

                    <div className="bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm border border-gray-800 space-y-4 flex-shrink-0">
                      <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                          style={{ backgroundColor: selectedService?.color || '#333', color: selectedService?.text_color || '#fff' }}
                        >
                          {selectedService?.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-white">{selectedService?.name}</h3>
                          <p className="text-xs text-gray-400">{selectedService?.duration} λεπτά • {selectedService?.price} €</p>
                        </div>
                      </div>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-3 text-gray-300">
                          <CalendarIcon className="w-4 h-4 text-gray-500" />
                          <span>{selectedDate && format(selectedDate, 'EEEE d MMMM yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{selectedTime}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="truncate">Dioikitiriou 1 Kastoria, 52100</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 w-full max-w-sm flex-shrink-0">
                      <Button
                        variant="outline"
                        className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                        onClick={() => window.location.reload()}
                      >
                        Νέα Κράτηση
                      </Button>
                      {/* Add to calendar button could go here */}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>

          {/* Right Column: Shop Info & Summary */}
          {step < 4 && (
            <div className="space-y-4 flex flex-col min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {/* Shop Card */}
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0">
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg">
                    <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/20">
                      <span className="text-xl font-serif italic text-white/90">twogents</span>
                    </div>
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1">{businessProfile?.full_name || "Business Name"}</h2>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                    <span className="font-medium text-white">5.0</span>
                    <Star className="w-3 h-3 fill-white text-white" />
                    <span>• 338 κριτικές</span>
                  </div>
                  <p className="text-gray-500 text-xs">
                    Dioikitiriou 1 Kastoria, West Macedonia 52100
                  </p>
                </CardContent>
              </Card>

              {/* Summary Card */}
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex-shrink-0">
                <CardContent className="p-5">
                  <h3 className="text-base font-bold text-white mb-4">Σύνοψη</h3>

                  {selectedService ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-medium text-sm">{selectedService.name}</div>
                          <div className="text-gray-500 text-xs">Διάρκεια: {selectedService.duration} λεπτά</div>
                        </div>
                        <div className="text-white font-medium text-sm">{selectedService.price} €</div>
                      </div>

                      {selectedDate && selectedTime && (
                        <div className="pt-3 border-t border-gray-800">
                          <div className="flex items-center gap-2 text-gray-300 mb-1">
                            <CalendarIcon className="w-3 h-3" />
                            <span className="text-xs">{format(selectedDate, 'd MMMM yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{selectedTime}</span>
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-800 flex justify-between items-center mt-3">
                        <div className="text-white font-bold text-sm">Σύνολο προς πληρωμή</div>
                        <div className="text-white font-bold text-sm">{selectedService.price} €</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-xs text-center py-3">
                      Επιλέξτε μια υπηρεσία για να δείτε τη σύνοψη
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

