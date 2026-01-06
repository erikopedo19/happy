import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const appointmentSchema = z.object({
  customer_id: z.string().optional(),
  customer_name: z.string().optional(),
  service_id: z.string().min(1, "Please select a service"),
  price: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => data.customer_id || data.customer_name, {
  message: "Please select a customer or enter a new customer name",
  path: ["customer_id"],
});

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedTime: string;
}

export function AppointmentForm({ isOpen, onClose, selectedDate, selectedTime }: AppointmentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      customer_id: "",
      customer_name: "",
      service_id: "",
      price: "",
      notes: "",
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const onSubmit = async (values: z.infer<typeof appointmentSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create appointments.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let customerId = values.customer_id;

      // If creating a new customer, create them first
      if (isNewCustomer && values.customer_name) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: values.customer_name,
            user_id: user.id,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      const { error } = await supabase
        .from('appointments')
        .insert({
          customer_id: customerId,
          service_id: values.service_id,
          appointment_date: selectedDate,
          appointment_time: selectedTime,
          price: values.price ? parseFloat(values.price) : null,
          notes: values.notes,
          status: 'scheduled',
          user_id: user.id,
        });

      if (error) throw error;

      // Send confirmation email if customer has email
      try {
        const customer = customers.find(c => c.id === customerId);
        const service = services.find(s => s.id === values.service_id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (customer?.email && service) {
          const { error: emailError } = await supabase.functions.invoke('send-booking-confirmation', {
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
              price: values.price ? parseFloat(values.price) : service.price,
              notes: values.notes,
            },
          });

          if (emailError) {
            console.error('Error sending confirmation email:', emailError);
          }
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Continue even if email fails
      }

      toast({
        title: "Success",
        description: "Appointment created successfully. Confirmation email sent if customer has email on file.",
      });

      // Invalidate and refetch appointments and customers
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      form.reset();
      onClose();
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
    form.reset();
    setIsNewCustomer(false);
    onClose();
  };

  const toggleCustomerMode = () => {
    setIsNewCustomer(!isNewCustomer);
    form.setValue("customer_id", "");
    form.setValue("customer_name", "");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment for the selected date and time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Date: {new Date(selectedDate).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            Time: {selectedTime}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            {/* Customer toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Customer</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleCustomerMode}
              >
                {isNewCustomer ? "Select Existing" : "Add New"}
              </Button>
            </div>

            {/* Customer selection/input */}
            {isNewCustomer ? (
              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter customer name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="service_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.duration}min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
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
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes for this appointment..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Appointment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
