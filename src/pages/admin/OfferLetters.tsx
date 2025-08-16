import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { toast } from 'sonner';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';

interface Application {
    id: number;
    applicant_id: number;
    email: string;
    program_type: string;
    application_status: string;
}

export default function OfferLetters() {
    const [offers, setOffers] = useState<Application[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        api
            .get('/admin/applications')
            .then((res) => setOffers(res.data.filter((app: Application) => app.application_status === 'offer_issued')))
            .catch(() => toast.error('Failed to load offer letters'));
    }, []);

    const totalPages = Math.ceil(offers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOffers = offers.slice(startIndex, endIndex);

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Offer Letters</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Applicant Email</TableHead>
                        <TableHead>Program</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedOffers.map((offer) => (
                        <TableRow key={offer.id}>
                            <TableCell>{offer.email}</TableCell>
                            <TableCell>{offer.program_type}</TableCell>
                            <TableCell>{offer.application_status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="flex justify-center items-center space-x-4 mt-6">
                <Button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-md transition-all ${
                        currentPage === 1
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary-dark"
                    }`}
                >
                    Previous
                </Button>
                <span className="text-gray-700 font-medium">
        Page <span className="text-primary font-bold">{currentPage}</span> of {totalPages}
    </span>
                <Button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-md transition-all ${
                        currentPage === totalPages
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary-dark"
                    }`}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}