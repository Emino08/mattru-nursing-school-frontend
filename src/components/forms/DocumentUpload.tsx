import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import api from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface DocumentUploadProps {
    applicationId: number;
}

export default function DocumentUpload({ applicationId }: DocumentUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [documents, setDocuments] = useState({
        id_document: null as File | null,
        certificate: null as File | null,
        recommendation_letter: null as File | null,
        passport_photo: null as File | null,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, documentType: keyof typeof documents) => {
        if (e.target.files && e.target.files[0]) {
            setDocuments(prev => ({
                ...prev,
                [documentType]: e.target.files![0]
            }));
        }
    };

    const handleUpload = async () => {
        try {
            setUploading(true);

            // Check if all required documents are uploaded
            const requiredDocuments = ['id_document', 'certificate'] as const;
            for (const doc of requiredDocuments) {
                if (!documents[doc]) {
                    toast({
                        title: 'Missing document',
                        description: `Please upload your ${doc.replace('_', ' ')}`,
                        variant: 'destructive'
                    });
                    setUploading(false);
                    return;
                }
            }

            // Upload each document
            const formData = new FormData();
            formData.append('application_id', applicationId.toString());

            Object.entries(documents).forEach(([key, file]) => {
                if (file) formData.append(key, file);
            });

            await api.post('/api/applicant/documents', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast({ title: 'Success', description: 'Documents uploaded successfully' });
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to upload documents', variant: 'destructive' });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card className="border border-gray-200 shadow-sm animate-fadeIn">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-pink-50 pb-4">
                <CardTitle className="text-lg font-semibold text-gray-800">Required Documents</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                    Please upload the following documents to complete your application
                </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium" htmlFor="id_document">
                        Identification Document <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="id_document"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="border-gray-200"
                        onChange={(e) => handleFileChange(e, 'id_document')}
                    />
                    <p className="text-xs text-gray-500">Acceptable formats: PDF, JPG, PNG (Max size: 5MB)</p>
                </div>

                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium" htmlFor="certificate">
                        Education Certificate <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="certificate"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="border-gray-200"
                        onChange={(e) => handleFileChange(e, 'certificate')}
                    />
                    <p className="text-xs text-gray-500">Acceptable formats: PDF, JPG, PNG (Max size: 5MB)</p>
                </div>

                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium" htmlFor="recommendation_letter">
                        Recommendation Letter
                    </Label>
                    <Input
                        id="recommendation_letter"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="border-gray-200"
                        onChange={(e) => handleFileChange(e, 'recommendation_letter')}
                    />
                    <p className="text-xs text-gray-500">Acceptable formats: PDF, JPG, PNG (Max size: 5MB)</p>
                </div>

                <div className="space-y-2">
                    <Label className="text-gray-700 font-medium" htmlFor="passport_photo">
                        Passport Photo
                    </Label>
                    <Input
                        id="passport_photo"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        className="border-gray-200"
                        onChange={(e) => handleFileChange(e, 'passport_photo')}
                    />
                    <p className="text-xs text-gray-500">Acceptable formats: JPG, PNG (Max size: 2MB)</p>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="w-full h-12 text-white transition-all"
                        style={{
                            backgroundColor: '#2563EB',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.25)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#1D4ED8';
                            e.currentTarget.style.boxShadow = '0 8px 9px -4px rgba(37, 99, 235, 0.2), 0 4px 18px 0 rgba(37, 99, 235, 0.1)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = '#2563EB';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(37, 99, 235, 0.25)';
                        }}
                    >
                        {uploading ? 'Uploading...' : 'Upload Documents'}
                    </Button>
                </div>

                <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                        <span className="text-red-500">*</span> Required documents
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}