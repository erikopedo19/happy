import { useState } from "react";
import { CircleAlertIcon, X, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime: string;
}

export function AppointmentForm({ isOpen, onClose, selectedDate, selectedTime }: AppointmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch services
  const { data: services = [] } = useQuery({
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

  // Fetch stylists
  const { data: stylists = [] } = useQuery({
    queryKey: ['stylists-for-appointments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const result = await (supabase as any)
        .from('stylists')
        .select('id, name, title')
        .eq('user_id', user.id);
      const { data, error } = result;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create appointments.",
        variant: "destructive",
      });
      return;
    }

    if (!serviceId) {
      toast({
        title: "Error",
        description: "Please select a service.",
        variant: "destructive",
      });
      return;
    }

    if (!isNewCustomer && !customerId) {
      toast({
        title: "Error",
        description: "Please select a customer.",
        variant: "destructive",
      });
      return;
    }

    if (isNewCustomer && !customerName) {
      toast({
        title: "Error",
        description: "Please enter a customer name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let finalCustomerId = customerId;

      // If creating a new customer, create them first
      if (isNewCustomer && customerName) {
        const result = await (supabase as any)
          .from('customers')
          .insert({
            name: customerName,
            user_id: user.id,
          })
          .select()
          .single();
        const { data: newCustomer, error: customerError } = result;

        if (customerError) throw customerError;
        finalCustomerId = newCustomer.id;
      }

      const selectedService = services.find((s: any) => s.id === serviceId);
      const servicePrice = selectedService?.price || 0;

      const { error } = await (supabase
        .from('appointments') as any)
        .insert({
          customer_id: finalCustomerId,
          service_id: serviceId,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          price: servicePrice,
          notes: notes,
          status: 'scheduled',
          user_id: user.id,
          stylist_id: stylistId || null,
        });

      if (error) throw error;

      // Send confirmation email if customer has email
      try {
        const customer = customers.find((c: any) => c.id === finalCustomerId);
        const service = services.find((s: any) => s.id === serviceId);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (customer?.email && service) {
          const { error: emailError } = await (supabase as any).functions.invoke('send-booking-confirmation', {
            body: {
              customerEmail: customer.email,
              customerName: customer.name,
              businessName: profile?.full_name || 'Your Barber',
              serviceName: service.name,
              appointmentDate: new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              appointmentTime: selectedTime,
              price: servicePrice,
              notes: notes,
            },
          });

          if (emailError) {
            console.error('Error sending confirmation email:', emailError);
          }
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      toast({
        title: "Success",
        description: "Appointment created successfully.",
      });

      // Invalidate and refetch appointments and customers
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      handleClose();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCustomerId("");
    setCustomerName("");
    setServiceId("");
    setStylistId("");
    setNotes("");
    setIsNewCustomer(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md relative bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-900 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>
        
        <CardHeader className="bg-gradient-to-br from-blue-50 via-purple-50/50 to-blue-50 border-b border-gray-200 p-6">
          <CardTitle className="text-lg font-bold text-gray-900">Create Appointment</CardTitle>
          <CardDescription className="text-gray-600">
            Schedule a new appointment for <span className="font-medium text-gray-900">{new Date(selectedDate).toLocaleDateString()}</span> at <span className="font-medium text-gray-900">{selectedTime}</span>
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6">
            {/* Customer Tabs - iOS Style */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">Customer</Label>
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomer(false);
                    setCustomerId("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all flex-1 justify-center",
                    !isNewCustomer
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <Users className="w-4 h-4" />
                  <span>Existing</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomer(true);
                    setCustomerName("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all flex-1 justify-center",
                    isNewCustomer
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>New</span>
                </button>
              </div>
            </div>

            {/* Customer selection/input */}
            {isNewCustomer ? (
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-gray-700">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Enter customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="customer" className="text-gray-700">Select Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="bg-white border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Service selection */}
            <div className="space-y-2">
              <Label htmlFor="service" className="text-gray-700">Service *</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="bg-white border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service: any) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} ({service.duration}min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stylist selection */}
            <div className="space-y-2">
              <Label htmlFor="stylist" className="text-gray-700">Stylist (Optional)</Label>
              <Select value={stylistId} onValueChange={setStylistId}>
                <SelectTrigger className="bg-white border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue placeholder="Select a stylist" />
                </SelectTrigger>
                <SelectContent>
                  {stylists.map((stylist: any) => (
                    <SelectItem key={stylist.id} value={stylist.id}>
                      {stylist.name} {stylist.title ? `• ${stylist.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-700">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes for this appointment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-white border-gray-300 text-gray-900 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[80px]"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 p-6 pt-0">
            <div className="flex gap-3 w-full">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 h-11 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 font-medium" 
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20" 
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Appointment"}
              </Button>
            </div>
            
            <div className="flex gap-1.5 text-gray-500 text-xs w-full">
              <CircleAlertIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>Confirmation email will be sent if customer has email on file.</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
