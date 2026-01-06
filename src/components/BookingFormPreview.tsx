
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User, Phone, Mail, MessageSquare } from "lucide-react";

const BookingFormPreview = () => {
  return (
    <Card className="max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-xl">B</span>
        </div>
        <CardTitle className="text-xl text-gray-900">Book Your Appointment</CardTitle>
        <p className="text-gray-600 text-sm">BarberPro - Professional Services</p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="service" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select Service
          </Label>
          <select 
            id="service" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          >
            <option>Haircut - $25 (30 min)</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select Date
          </Label>
          <Input
            id="date"
            type="date"
            disabled
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Select Time
          </Label>
          <select 
            id="time" 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          >
            <option>9:00 AM</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Name
            </Label>
            <Input
              id="name"
              placeholder="Your name"
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone
            </Label>
            <Input
              id="phone"
              placeholder="Your phone"
              disabled
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Notes (Optional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Any special requests or notes..."
            disabled
            rows={3}
          />
        </div>

        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
          disabled
        >
          Book Appointment
        </Button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            This is a preview of your booking form
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingFormPreview;
