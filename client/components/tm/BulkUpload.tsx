import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface BulkUploadProps {
  onUploadSuccess: () => void;
}

export function BulkUpload({ onUploadSuccess }: BulkUploadProps) {
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const downloadTemplate = (type: 'customers' | 'policies') => {
    const headers = type === 'customers'
      ? "name,phone,email,address\n"
      : "id,customer_email,policy_number,insurer,type,status,start_date,end_date,premium_amount,coverage_amount,last_contacted_date\n";
    
    const content = "data:text/csv;charset=utf-8," + encodeURIComponent(headers);
    const a = document.createElement('a');
    a.href = content;
    a.download = `${type}_template.csv`;
    a.click();
  };
  
  const handleUpload = async (type: 'customers' | 'policies') => {
    const file = type === 'customers' ? customerFile : policyFile;
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("csvfile", file);
    
    try {
      const response = await fetch(`/api/${type}/bulk`, {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "An unknown error occurred.");
      }
      
      toast.success(result.message);
      onUploadSuccess(); // This will refetch the data on the dashboard
    } catch (error) {
      toast.error("Upload Failed", { description: (error as Error).message });
    } finally {
      setIsUploading(false);
      if(type === 'customers') setCustomerFile(null);
      else setPolicyFile(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>1. Upload Customers</CardTitle>
          <CardDescription>Upload a CSV file with your customer data. Download the template to see the required format.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => downloadTemplate('customers')}>Download Customer Template</Button>
          <Input type="file" accept=".csv" onChange={(e) => setCustomerFile(e.target.files?.[0] ?? null)} />
          <Button onClick={() => handleUpload('customers')} disabled={!customerFile || isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Customers'}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>2. Upload Policies</CardTitle>
          <CardDescription>After uploading customers, upload their policies. The 'customer_email' column is used to link policies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => downloadTemplate('policies')}>Download Policy Template</Button>
          <Input type="file" accept=".csv" onChange={(e) => setPolicyFile(e.target.files?.[0] ?? null)} />
          <Button onClick={() => handleUpload('policies')} disabled={!policyFile || isUploading}>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload Policies'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}