
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Car, 
  Clock, 
  Edit, 
  FileText, 
  MapPin, 
  Phone, 
  Star, 
  Trash2, 
  User 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomerData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  driving_license: string;
  address: string;
  customer_type: string;
  company_name: string | null;
  tax_number: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface AgreementData {
  id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  status: string;
  vehicles: {
    make: string;
    model: string;
    license_plate: string;
  };
}

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [agreements, setAgreements] = useState<AgreementData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCustomer(id);
      fetchAgreements(id);
    }
  }, [id]);

  const fetchCustomer = async (customerId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (error: any) {
      console.error("Error fetching customer:", error.message);
      toast.error("Failed to load customer details");
      navigate("/customers");
    } finally {
      setLoading(false);
    }
  };

  const fetchAgreements = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from("agreements")
        .select(`
          id,
          vehicle_id,
          start_date,
          end_date,
          status,
          vehicles (
            make,
            model,
            license_plate
          )
        `)
        .eq("customer_id", customerId);

      if (error) throw error;
      setAgreements(data || []);
    } catch (error: any) {
      console.error("Error fetching agreements:", error.message);
      toast.error("Failed to load rental agreements");
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    
    if (!window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", customer.id);
        
      if (error) throw error;
      
      toast.success("Customer deleted successfully");
      navigate("/customers");
    } catch (error: any) {
      console.error("Error deleting customer:", error.message);
      toast.error("Failed to delete customer");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Customer not found</h2>
        <Button 
          variant="outline" 
          onClick={() => navigate("/customers")} 
          className="mt-4"
        >
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {customer.first_name} {customer.last_name}
          </h2>
          <p className="text-muted-foreground">{customer.email}</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/customers/edit/${customer.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDeleteCustomer}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Customer Details</TabsTrigger>
          <TabsTrigger value="rentals">Rental History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge 
                      variant={customer.customer_type === "corporate" ? "secondary" : "outline"}
                      className={customer.customer_type === "corporate" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}
                    >
                      {customer.customer_type === "corporate" ? (
                        <Star className="h-3 w-3 mr-1" />
                      ) : (
                        <User className="h-3 w-3 mr-1" />
                      )}
                      <span className="capitalize">{customer.customer_type}</span>
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm text-muted-foreground">Driving License</p>
                  <p className="font-medium">{customer.driving_license}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground shrink-0 mt-0.5" />
                    <p>{customer.address || "No address provided"}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge 
                    variant={
                      customer.status === "active" ? "default" : 
                      customer.status === "pending" ? "secondary" : 
                      "destructive"
                    }
                    className={
                      customer.status === "active" ? "bg-green-500 hover:bg-green-600" : 
                      customer.status === "pending" ? "bg-yellow-500 hover:bg-yellow-600" : 
                      ""
                    }
                  >
                    <span className="capitalize">{customer.status}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            {customer.customer_type === "corporate" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Company Name</p>
                    <p className="font-medium">{customer.company_name || "Not provided"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Number</p>
                    <p className="font-medium">{customer.tax_number || "Not provided"}</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card className={customer.customer_type === "corporate" ? "md:col-span-2" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                    <p>{new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-line">
                    {customer.notes || "No additional notes"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="rentals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental History</CardTitle>
              <CardDescription>
                {agreements.length > 0 
                  ? `${agreements.length} rental agreements found`
                  : "No rental agreements found"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agreements.length > 0 ? (
                <div className="space-y-4">
                  {agreements.map((agreement) => (
                    <div 
                      key={agreement.id} 
                      className="flex items-center justify-between border rounded-md p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <Car className="h-10 w-10 text-primary" />
                        <div>
                          <h4 className="font-medium">
                            {agreement.vehicles.make} {agreement.vehicles.model}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {agreement.vehicles.license_plate}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Period</p>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(agreement.start_date).toLocaleDateString()} - {new Date(agreement.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <Badge 
                          variant={
                            agreement.status === "active" ? "default" : 
                            agreement.status === "completed" ? "secondary" : 
                            agreement.status === "pending" ? "outline" :
                            "destructive"
                          }
                          className={
                            agreement.status === "active" ? "bg-green-500 hover:bg-green-600" : 
                            agreement.status === "completed" ? "bg-blue-500 hover:bg-blue-600" : 
                            ""
                          }
                        >
                          <span className="capitalize">{agreement.status}</span>
                        </Badge>
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/agreements/${agreement.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">
                    This customer has no rental agreements yet
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/agreements/add", { 
                      state: { customerId: customer.id } 
                    })}
                  >
                    Create New Agreement
                  </Button>
                </div>
              )}
            </CardContent>
            {agreements.length > 0 && (
              <CardFooter className="flex justify-end">
                <Button
                  onClick={() => navigate("/agreements/add", { 
                    state: { customerId: customer.id } 
                  })}
                >
                  Create New Agreement
                </Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetail;
