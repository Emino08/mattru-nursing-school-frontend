import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/services/api';
import { Upload, ChevronLeft, ChevronRight, Check, FileIcon, X, Save, Clock, Printer, Eye, Edit, Plus, Trash2 } from 'lucide-react';

// WASSCE and A-Level subjects and grades
const WASSCE_SUBJECTS = [
    'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Economics', 'Literature in English', 'French',
    'Government', 'Religious Studies', 'Agricultural Science', 'Technical Drawing',
    'Visual Arts', 'Music', 'Computer Studies', 'Physical Education'
];

const A_LEVEL_SUBJECTS = [
    'Mathematics', 'Further Mathematics', 'Physics', 'Chemistry', 'Biology',
    'History', 'Geography', 'Economics', 'Literature in English', 'French',
    'Government', 'Psychology', 'Sociology', 'Art', 'Music'
];

const WASSCE_GRADES = ['A1', 'A2', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'];
const A_LEVEL_GRADES = ['A', 'B', 'C', 'D', 'E'];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Question {
    id: number;
    category: string;
    category_id: number;
    category_order: number;
    section: string;
    question_text: string;
    question_type: string;
    options?: string[] | string;
    validation_rules?: Record<string, any>;
    conditional_logic?: { question_id: number; value: string; show_question_ids?: number[] } | null;
    is_required: boolean;
    sort_order: number;
    table_columns?: Array<{ id: number; name: string; type: string; is_required: boolean; options?: string[] }>;
}

interface SubmittedApplication {
    submitted_at: string;
    categories: {
        [key: string]: Array<{
            question_id: number;
            question_text: string;
            answer: string;
            file_path?: string;
            question_type: string;
        }>;
    };
}

interface FormData {
    [key: string]: any;
}

interface Category {
    name: string;
    order: number;
    questions: Question[];
}

interface TableRow {
    [key: string]: string;
}

interface QualificationResult {
    subject: string;
    grade: string;
}

export default function MultiStepperForm() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormData>({});
    const [files, setFiles] = useState<{ [key: string]: File }>({});
    const [filesMetadata, setFilesMetadata] = useState<{ [key: string]: any }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [canProceed, setCanProceed] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [submittedApplication, setSubmittedApplication] = useState<SubmittedApplication | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; type: string } | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    // State for qualification handling
    const [wassceSittings, setWassceSittings] = useState<number>(1);
    const [alevelSittings, setAlevelSittings] = useState<number>(1);
    const [wassceResults, setWassceResults] = useState<QualificationResult[][]>([[]]);
    const [alevelResults, setAlevelResults] = useState<QualificationResult[][]>([[]]);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (!autoSaveEnabled || isEditMode) return;

        const interval = setInterval(() => {
            if (Object.keys(formData).length > 0 || Object.keys(files).length > 0) {
                saveProgress(false);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [formData, files, currentStep, completedSteps, autoSaveEnabled, isEditMode]);

    useEffect(() => {
        initializeForm();
    }, []);

    useEffect(() => {
        validateCurrentStep();
    }, [formData, currentStep, categories, files]);

    const initializeForm = async () => {
        try {
            // Check if user has already submitted an application
            const submittedResponse = await api.get('/applicant/application/submitted');
            const submittedApp = submittedResponse.data.application;

            if (submittedApp && submittedApp !== null && !Array.isArray(submittedApp)) {
                setSubmittedApplication(submittedApp);
                setIsLoading(false);
                return;
            }

            // Load questions, progress, and profile in parallel
            const [questionsResponse, progressResponse, profileResponse] = await Promise.all([
                api.get('/applicant/questions'),
                api.get('/applicant/application/load-progress'),
                api.get('/applicant/profile')
            ]);

            // Process questions and parse options
            const questions = questionsResponse.data.map((question: Question) => ({
                ...question,
                options: question.options
                    ? typeof question.options === 'string'
                        ? JSON.parse(question.options)
                        : question.options
                    : [],
                conditional_logic: question.conditional_logic
                    ? typeof question.conditional_logic === 'string'
                        ? JSON.parse(question.conditional_logic)
                        : question.conditional_logic
                    : null,
                table_columns: question.table_columns
                    ? question.table_columns.map(col => ({
                        ...col,
                        options: col.options ? (typeof col.options === 'string' ? JSON.parse(col.options) : col.options) : []
                    }))
                    : []
            }));

            // Add new qualification types to the qualification question
            const qualificationQuestion = questions.find(q =>
                q.question_text.toLowerCase().includes('qualification type') ||
                q.question_text.toLowerCase().includes('certificate type')
            );
            if (qualificationQuestion) {
                qualificationQuestion.options = ['WASSCE', 'A-Level', 'Degree', 'Diploma', 'Certificate'];
            }

            const grouped = questions.reduce((acc: { [key: string]: { questions: Question[], order: number } }, question: Question) => {
                const categoryName = question.category;
                if (!acc[categoryName]) {
                    acc[categoryName] = {
                        questions: [],
                        order: question.category_order
                    };
                }
                acc[categoryName].questions.push(question);
                return acc;
            }, {});

            const categoriesArray = Object.keys(grouped)
                .map(categoryName => ({
                    name: categoryName,
                    order: grouped[categoryName].order,
                    questions: grouped[categoryName].questions.sort((a, b) => a.sort_order - b.sort_order)
                }))
                .sort((a, b) => a.order - b.order);

            setCategories(categoriesArray);

            // Load saved progress
            const progress = progressResponse.data;
            let initialFormData = progress.formData && Object.keys(progress.formData).length > 0
                ? progress.formData
                : {};

            // Profile data from backend
            const profileData = profileResponse.data;

            // Map profile data to corresponding questions
            categoriesArray.forEach(category => {
                if (category.name === 'Personal Information') {
                    category.questions.forEach(question => {
                        const fieldId = `question_${question.id}`;
                        if (question.id === 4 && profileData.first_name) { // First Name
                            initialFormData[fieldId] = profileData.first_name;
                        } else if (question.id === 6 && profileData.last_name) { // Last Name
                            initialFormData[fieldId] = profileData.last_name;
                        } else if (question.id === 7 && profileData.date_of_birth) { // Date of Birth
                            initialFormData[fieldId] = profileData.date_of_birth;
                        } else if (question.id === 9 && profileData.nationality) { // Nationality
                            initialFormData[fieldId] = profileData.nationality;
                        } else if (question.id === 14 && profileData.address?.country) { // Country
                            initialFormData[fieldId] = profileData.address.country;
                        } else if (question.id === 15 && profileData.address?.province) { // Region/State
                            initialFormData[fieldId] = profileData.address.province;
                        } else if (question.id === 16 && profileData.address?.town) { // City
                            initialFormData[fieldId] = profileData.address.town;
                        } else if (question.id === 19 && profileData.phone) { // Phone Number
                            initialFormData[fieldId] = profileData.phone;
                        } else if (question.id === 20 && profileData.emergency_contact?.name) { // Emergency Contact Name
                            initialFormData[fieldId] = profileData.emergency_contact.name;
                        } else if (question.id === 22 && profileData.emergency_contact?.phone) { // Emergency Contact Phone
                            initialFormData[fieldId] = profileData.emergency_contact.phone;
                        }
                    });
                }
            });

            setFormData(initialFormData);
            setCurrentStep(progress.currentStep || 0);
            setCompletedSteps(progress.completedSteps || []);
            setFilesMetadata(progress.filesMetadata || {});
            setLastSaved(progress.lastSaved);

            if (progress.lastSaved) {
                toast.success('Previous progress loaded successfully');
            }
            if (Object.keys(initialFormData).length > 0) {
                toast.success('Profile data loaded successfully');
            }
        } catch (error) {
            console.error('Failed to initialize form:', error);
            toast.error('Failed to load application form or profile');
        } finally {
            setIsLoading(false);
        }
    };

    const saveProgress = useCallback(async (showNotification = true) => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const formDataObj = new FormData();
            formDataObj.append('formData', JSON.stringify(formData));
            formDataObj.append('currentStep', currentStep.toString());
            formDataObj.append('completedSteps', JSON.stringify(completedSteps));

            Object.keys(files).forEach(key => {
                if (files[key] && !filesMetadata[key]) {
                    formDataObj.append(key, files[key]);
                }
            });

            await api.post('/applicant/application/save-progress', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setLastSaved(new Date().toISOString());
            if (showNotification) {
                toast.success('Progress saved successfully');
            }
        } catch (error) {
            if (showNotification) {
                toast.error('Failed to save progress');
            }
        } finally {
            setIsSaving(false);
        }
    }, [formData, files, filesMetadata, currentStep, completedSteps, isSaving]);

    const validateCurrentStep = () => {
        if (categories.length === 0 || !categories[currentStep]) return;

        const currentCategory = categories[currentStep];
        const requiredQuestions = currentCategory.questions.filter(q => q.is_required && shouldShowQuestion(q));
        let isValid = requiredQuestions.every(question => {
            const value = formData[`question_${question.id}`];
            if (question.question_type === 'file') {
                return true; // Skip file validation for non-qualification file uploads
            }
            if (question.question_type === 'multiple_select') {
                return Array.isArray(value) && value.length > 0;
            }
            if (question.question_type === 'table') {
                const tableData = Array.isArray(value) ? value : [];
                return tableData.length > 0 && tableData.every(row =>
                    question.table_columns?.every(col =>
                        !col.is_required || (row[col.name] && row[col.name].toString().trim() !== '')
                    )
                );
            }
            return value !== undefined && value !== null && value.toString().trim() !== '';
        });

        // Special validation for table mins
        if (currentCategory.name === 'Academic History') {
            const schoolQuestion = currentCategory.questions.find(q => q.question_text === 'Schools Attended');
            if (schoolQuestion) {
                const tableData = formData[`question_${schoolQuestion.id}`] || [];
                if (tableData.length === 0) isValid = false;
            }
        }

        if (currentCategory.name === 'Additional Information') {
            const refQuestion = currentCategory.questions.find(q => q.question_text === 'References (at least 2)');
            if (refQuestion) {
                const tableData = formData[`question_${refQuestion.id}`] || [];
                if (tableData.length < 2) isValid = false;
            }
        }

        // Validate Financial Information category
        if (currentCategory.name === 'Financial Information') {
            const fundingQuestion = currentCategory.questions.find(q => q.question_text === 'Method of Funding');
            const funding = formData[`question_${fundingQuestion?.id}`];
            let isFinancialValid = true;
            if (funding === 'Sponsor') {
                const nameQuestion = currentCategory.questions.find(q => q.question_text.includes('Sponsor Name'));
                const relQuestion = currentCategory.questions.find(q => q.question_text.includes('Sponsor Relationship'));
                const phoneQuestion = currentCategory.questions.find(q => q.question_text.includes('Sponsor Phone'));
                const hasSponsorName = formData[`question_${nameQuestion?.id}`]?.trim();
                const hasSponsorRelationship = formData[`question_${relQuestion?.id}`]?.trim();
                const hasSponsorPhone = formData[`question_${phoneQuestion?.id}`]?.trim();
                isFinancialValid = hasSponsorName && hasSponsorRelationship && hasSponsorPhone;
            }
            isValid = isValid && isFinancialValid;
        }

        // Validate qualification-specific fields
        const qualificationType = formData[`question_${currentCategory.questions.find(q => q.question_text.toLowerCase().includes('qualification type'))?.id}`];
        if (qualificationType === 'WASSCE') {
            const isWassceValid = Array.from({ length: wassceSittings }, (_, sittingIndex) => {
                const sittingKey = sittingIndex + 1;
                const hasResults = wassceResults[sittingIndex]?.length > 0;
                const hasScratchCardPin = formData[`wassce_sitting_${sittingKey}_scratch_card_pin`]?.trim();
                const hasScratchCardNumber = formData[`wassce_sitting_${sittingKey}_scratch_card_number`]?.trim();
                const hasSchoolName = formData[`wassce_sitting_${sittingKey}_school_name`]?.trim();
                const hasDistrict = formData[`wassce_sitting_${sittingKey}_district`]?.trim();
                const hasCountry = formData[`wassce_sitting_${sittingKey}_country`]?.trim();
                const hasYearSat = formData[`wassce_sitting_${sittingKey}_year_sat`]?.trim();
                const hasFile = files[`question_wassce_sitting_${sittingKey}_result`] || filesMetadata[`question_wassce_sitting_${sittingKey}_result`];
                return hasResults && hasScratchCardPin && hasScratchCardNumber && hasSchoolName && hasDistrict && hasCountry && hasYearSat && hasFile;
            }).every(Boolean);
            isValid = isValid && isWassceValid;
        } else if (['Degree', 'Diploma', 'Certificate'].includes(qualificationType)) {
            const qualKey = qualificationType.toLowerCase();
            const hasGraduationYear = formData[`${qualKey}_graduation_year`]?.trim();
            const hasInstitutionName = formData[`${qualKey}_institution_name`]?.trim();
            const hasDistrict = formData[`${qualKey}_district`]?.trim();
            const hasCountry = formData[`${qualKey}_country`]?.trim();
            // Certificate and testimonial files are optional, so exclude from validation
            const isQualValid = hasGraduationYear && hasInstitutionName && hasDistrict && hasCountry;
            isValid = isValid && isQualValid;
        }

        setCanProceed(isValid);
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const nextStep = () => {
        if (canProceed && currentStep < categories.length - 1) {
            setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
            setCurrentStep(currentStep + 1);
        }
    };

    const goToStep = (step: number) => {
        if (step >= 0 && step < categories.length && (step <= currentStep || completedSteps.includes(step))) {
            setCurrentStep(step);
        }
    };

    const submitApplication = async () => {
        if (!canProceed) return;
        setIsSubmitting(true);

        try {
            const formDataObj = new FormData();
            formDataObj.append('formData', JSON.stringify(formData));
            Object.keys(files).forEach(key => {
                if (files[key] && !filesMetadata[key]) {
                    formDataObj.append(key, files[key]);
                }
            });

            const response = await api.post('/applicant/application/submit', formDataObj, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSubmittedApplication(response.data.application);
            setIsEditMode(false);
            toast.success('Application submitted successfully');
        } catch (error) {
            console.error('Failed to submit application:', error);
            toast.error('Failed to submit application');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditApplication = async () => {
        setIsEditMode(true);
        setSubmittedApplication(null);
        await initializeForm();
    };

    const handlePrint = () => {
        if (printRef.current) {
            const printContent = printRef.current.innerHTML;
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
          <html>
            <head>
              <title>Print Application</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .category-title { font-size: 1.5rem; margin: 1rem 0; }
                .question { margin-bottom: 1rem; }
                .question-text { font-weight: bold; }
                .answer { margin-left: 1rem; }
                .file-info { color: blue; }
              </style>
            </head>
            <body>
              <h1>Application Form</h1>
              ${printContent}
            </body>
          </html>
        `);
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    const handleInputChange = (questionId: number | string, value: string | string[] | number) => {
        setFormData(prev => ({
            ...prev,
            [`question_${questionId}`]: value
        }));
    };

    const handleQualificationChange = (questionId: number, value: string) => {
        handleInputChange(questionId, value);

        // Reset sitting counts, results, and related fields when qualification type changes
        setWassceSittings(1);
        setWassceResults([[]]);
        setAlevelSittings(1);
        setAlevelResults([[]]);
        setFormData(prev => {
            const newFormData = { ...prev };
            Object.keys(newFormData).forEach(key => {
                if (key.startsWith('wassce_sitting_') || key.startsWith('alevel_sitting_') ||
                    key.startsWith('degree_') || key.startsWith('diploma_') || key.startsWith('certificate_')) {
                    delete newFormData[key];
                }
            });
            return newFormData;
        });
        setFiles(prev => {
            const newFiles = { ...prev };
            Object.keys(newFiles).forEach(key => {
                if (key.startsWith('wassce_sitting_') || key.startsWith('alevel_sitting_') ||
                    key.startsWith('degree_') || key.startsWith('diploma_') || key.startsWith('certificate_')) {
                    delete newFiles[key];
                }
            });
            return newFiles;
        });
        setFilesMetadata(prev => {
            const newMetadata = { ...prev };
            Object.keys(newMetadata).forEach(key => {
                if (key.startsWith('wassce_sitting_') || key.startsWith('alevel_sitting_') ||
                    key.startsWith('degree_') || key.startsWith('diploma_') || key.startsWith('certificate_')) {
                    delete newMetadata[key];
                }
            });
            return newMetadata;
        });
    };

    const handleSittingsChange = (type: 'WASSCE' | 'A-Level', sittings: number) => {
        if (type === 'WASSCE') {
            setWassceSittings(sittings);
            setWassceResults(Array(sittings).fill(null).map(() => []));
            // Clear formData and files for unused sittings
            setFormData(prev => {
                const newFormData = { ...prev };
                for (let i = sittings + 1; i <= 2; i++) {
                    delete newFormData[`wassce_sitting_${i}_scratch_card_pin`];
                    delete newFormData[`wassce_sitting_${i}_scratch_card_number`];
                    delete newFormData[`wassce_sitting_${i}_school_name`];
                    delete newFormData[`wassce_sitting_${i}_district`];
                    delete newFormData[`wassce_sitting_${i}_country`];
                    delete newFormData[`wassce_sitting_${i}_year_sat`];
                    delete newFormData[`wassce_results_sitting_${i}`];
                    delete newFormData[`wassce_sitting_${i}_testimonial`];
                }
                return newFormData;
            });
            setFiles(prev => {
                const newFiles = { ...prev };
                for (let i = sittings + 1; i <= 2; i++) {
                    delete newFiles[`question_wassce_sitting_${i}_result`];
                    delete newFiles[`question_wassce_sitting_${i}_testimonial`];
                }
                return newFiles;
            });
            setFilesMetadata(prev => {
                const newMetadata = { ...prev };
                for (let i = sittings + 1; i <= 2; i++) {
                    delete newMetadata[`question_wassce_sitting_${i}_result`];
                    delete newMetadata[`question_wassce_sitting_${i}_testimonial`];
                }
                return newMetadata;
            });
        } else {
            setAlevelSittings(sittings);
            setAlevelResults(Array(sittings).fill(null).map(() => []));
            setFormData(prev => {
                const newFormData = { ...prev };
                for (let i = sittings + 1; i <= 3; i++) {
                    delete newFormData[`alevel_results_sitting_${i}`];
                }
                return newFormData;
            });
        }
    };

    const addSubjectGrade = (type: 'WASSCE' | 'A-Level', sittingIndex: number) => {
        if (type === 'WASSCE') {
            const newResults = [...wassceResults];
            newResults[sittingIndex] = [...(newResults[sittingIndex] || []), { subject: '', grade: '' }];
            setWassceResults(newResults);

            // Update form data
            setFormData(prev => ({
                ...prev,
                [`wassce_results_sitting_${sittingIndex + 1}`]: newResults[sittingIndex]
            }));
        } else {
            const newResults = [...alevelResults];
            newResults[sittingIndex] = [...(newResults[sittingIndex] || []), { subject: '', grade: '' }];
            setAlevelResults(newResults);

            // Update form data
            setFormData(prev => ({
                ...prev,
                [`alevel_results_sitting_${sittingIndex + 1}`]: newResults[sittingIndex]
            }));
        }
    };

    const updateSubjectGrade = (type: 'WASSCE' | 'A-Level', sittingIndex: number, resultIndex: number, field: 'subject' | 'grade', value: string) => {
        if (type === 'WASSCE') {
            const newResults = [...wassceResults];
            if (!newResults[sittingIndex]) newResults[sittingIndex] = [];
            if (!newResults[sittingIndex][resultIndex]) newResults[sittingIndex][resultIndex] = { subject: '', grade: '' };
            newResults[sittingIndex][resultIndex][field] = value;
            setWassceResults(newResults);

            // Update form data
            setFormData(prev => ({
                ...prev,
                [`wassce_results_sitting_${sittingIndex + 1}`]: newResults[sittingIndex]
            }));
        } else {
            const newResults = [...alevelResults];
            if (!newResults[sittingIndex]) newResults[sittingIndex] = [];
            if (!newResults[sittingIndex][resultIndex]) newResults[sittingIndex][resultIndex] = { subject: '', grade: '' };
            newResults[sittingIndex][resultIndex][field] = value;
            setAlevelResults(newResults);

            // Update form data
            setFormData(prev => ({
                ...prev,
                [`alevel_results_sitting_${sittingIndex + 1}`]: newResults[sittingIndex]
            }));
        }
    };

    const removeSubjectGrade = (type: 'WASSCE' | 'A-Level', sittingIndex: number, resultIndex: number) => {
        if (type === 'WASSCE') {
            const newResults = [...wassceResults];
            newResults[sittingIndex] = newResults[sittingIndex].filter((_, idx) => idx !== resultIndex);
            setWassceResults(newResults);

            // Update form data
            setFormData(prev => ({
                ...prev,
                [`wassce_results_sitting_${sittingIndex + 1}`]: newResults[sittingIndex]
            }));
        } else {
            const newResults = [...alevelResults];
            newResults[sittingIndex] = newResults[sittingIndex].filter((_, idx) => idx !== resultIndex);
            setAlevelResults(newResults);

            // Update form data
            setFormData(prev => ({
                ...prev,
                [`alevel_results_sitting_${sittingIndex + 1}`]: newResults[sittingIndex]
            }));
        }
    };

    const validateFileSize = (file: File): boolean => {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            toast.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
            return false;
        }
        return true;
    };

    const handleFileChange = (questionId: number | string, file: File) => {
        if (!validateFileSize(file)) {
            return;
        }

        setFiles(prev => ({
            ...prev,
            [`question_${questionId}`]: file
        }));
        setFilesMetadata(prev => ({
            ...prev,
            [`question_${questionId}`]: {
                filename: file.name,
                original_name: file.name
            }
        }));
        setFormData(prev => ({
            ...prev,
            [`question_${questionId}`]: file.name
        }));
        if (autoSaveEnabled) {
            saveProgress();
        }
        toast.success(`File "${file.name}" uploaded successfully`);
    };

    const removeFile = (questionId: number | string) => {
        setFiles(prev => {
            const newFiles = { ...prev };
            delete newFiles[`question_${questionId}`];
            return newFiles;
        });
        setFilesMetadata(prev => {
            const newMetadata = { ...prev };
            delete newMetadata[`question_${questionId}`];
            return newMetadata;
        });
        setFormData(prev => {
            const newFormData = { ...prev };
            delete newFormData[`question_${questionId}`];
            return newFormData;
        });
    };

    const handleTableInputChange = (questionId: number, rowIndex: number, columnName: string, value: string) => {
        const currentData = formData[`question_${questionId}`] || [];
        const newData = [...currentData];

        if (!newData[rowIndex]) {
            newData[rowIndex] = {};
        }
        newData[rowIndex][columnName] = value;

        setFormData(prev => ({
            ...prev,
            [`question_${questionId}`]: newData
        }));
    };

    const addTableRow = (questionId: number, columns: Array<{ name: string }>) => {
        const currentData = formData[`question_${questionId}`] || [];
        const question = categories.flatMap(c => c.questions).find(q => q.id === questionId);
        if (question && question.question_text.toLowerCase().includes('employment history') && currentData.length >= 3) {
            toast.error('You can add up to 3 employment entries only.');
            return;
        }
        const newRow: TableRow = {};
        columns.forEach(col => (newRow[col.name] = ''));

        setFormData(prev => ({
            ...prev,
            [`question_${questionId}`]: [...currentData, newRow]
        }));
    };

    const removeTableRow = (questionId: number, rowIndex: number) => {
        const currentData = formData[`question_${questionId}`] || [];
        const newData = currentData.filter((_, index) => index !== rowIndex);

        setFormData(prev => ({
            ...prev,
            [`question_${questionId}`]: newData
        }));
    };

    const handleFilePreview = (file: File | string) => {
        if (file instanceof File) {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('image/') ? 'image' : 'pdf';
            setPreviewFile({ url, type });
        } else {
            const url = `/api/files/${file}`;
            const type = file.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image';
            setPreviewFile({ url, type });
        }
    };

    const renderQualificationResults = (question: Question) => {
        const qualificationType = formData[`question_${question.id}`];

        if (qualificationType === 'WASSCE') {
            return (
                <div className="mt-4 space-y-6">
                    <div>
                        <Label className="text-base font-medium">Number of Sittings</Label>
                        <Select
                            value={wassceSittings.toString()}
                            onValueChange={(value) => handleSittingsChange('WASSCE', parseInt(value))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select number of sittings" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Sitting</SelectItem>
                                <SelectItem value="2">2 Sittings</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {Array.from({ length: wassceSittings }, (_, sittingIndex) => {
                        const sittingKey = sittingIndex + 1;
                        const selectedFile = files[`question_wassce_sitting_${sittingKey}_result`];
                        const existingFile = filesMetadata[`question_wassce_sitting_${sittingKey}_result`];
                        const selectedTestimonial = files[`question_wassce_sitting_${sittingKey}_testimonial`];
                        const existingTestimonial = filesMetadata[`question_wassce_sitting_${sittingKey}_testimonial`];
                        return (
                            <div key={sittingIndex} className="space-y-4">
                                <h4 className="text-lg font-medium">WASSCE Sitting {sittingIndex + 1}</h4>

                                <Table className="border">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Subject</TableHead>
                                            <TableHead>Grade</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(wassceResults[sittingIndex] || []).map((result, resultIndex) => (
                                            <TableRow key={resultIndex}>
                                                <TableCell>
                                                    <Select
                                                        value={result.subject}
                                                        onValueChange={(value) => updateSubjectGrade('WASSCE', sittingIndex, resultIndex, 'subject', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select subject" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {WASSCE_SUBJECTS.map((subject) => (
                                                                <SelectItem key={subject} value={subject}>
                                                                    {subject}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Select
                                                        value={result.grade}
                                                        onValueChange={(value) => updateSubjectGrade('WASSCE', sittingIndex, resultIndex, 'grade', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select grade" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {WASSCE_GRADES.map((grade) => (
                                                                <SelectItem key={grade} value={grade}>
                                                                    {grade}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeSubjectGrade('WASSCE', sittingIndex, resultIndex)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => addSubjectGrade('WASSCE', sittingIndex)}
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Subject
                                </Button>

                                <div className="space-y-2">
                                    <Label htmlFor={`wassce_sitting_${sittingKey}_school_name`} className="text-base font-medium flex items-center gap-2">
                                        School Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`wassce_sitting_${sittingKey}_school_name`}
                                        type="text"
                                        value={formData[`wassce_sitting_${sittingKey}_school_name`] || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            [`wassce_sitting_${sittingKey}_school_name`]: e.target.value
                                        }))}
                                        placeholder="Enter school name"
                                        className="w-full"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`wassce_sitting_${sittingKey}_district`} className="text-base font-medium flex items-center gap-2">
                                        District <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`wassce_sitting_${sittingKey}_district`}
                                        type="text"
                                        value={formData[`wassce_sitting_${sittingKey}_district`] || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            [`wassce_sitting_${sittingKey}_district`]: e.target.value
                                        }))}
                                        placeholder="Enter district"
                                        className="w-full"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`wassce_sitting_${sittingKey}_country`} className="text-base font-medium flex items-center gap-2">
                                        Country <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`wassce_sitting_${sittingKey}_country`}
                                        type="text"
                                        value={formData[`wassce_sitting_${sittingKey}_country`] || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            [`wassce_sitting_${sittingKey}_country`]: e.target.value
                                        }))}
                                        placeholder="Enter country"
                                        className="w-full"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`wassce_sitting_${sittingKey}_year_sat`} className="text-base font-medium flex items-center gap-2">
                                        Year Sat <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`wassce_sitting_${sittingKey}_year_sat`}
                                        type="number"
                                        value={formData[`wassce_sitting_${sittingKey}_year_sat`] || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            [`wassce_sitting_${sittingKey}_year_sat`]: e.target.value
                                        }))}
                                        placeholder="Enter year (e.g., 2023)"
                                        className="w-full"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`wassce_sitting_${sittingKey}_scratch_card_pin`} className="text-base font-medium flex items-center gap-2">
                                        Scratch Card PIN <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`wassce_sitting_${sittingKey}_scratch_card_pin`}
                                        type="text"
                                        value={formData[`wassce_sitting_${sittingKey}_scratch_card_pin`] || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            [`wassce_sitting_${sittingKey}_scratch_card_pin`]: e.target.value
                                        }))}
                                        placeholder="Enter scratch card PIN"
                                        className="w-full"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`wassce_sitting_${sittingKey}_scratch_card_number`} className="text-base font-medium flex items-center gap-2">
                                        Scratch Card Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id={`wassce_sitting_${sittingKey}_scratch_card_number`}
                                        type="text"
                                        value={formData[`wassce_sitting_${sittingKey}_scratch_card_number`] || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            [`wassce_sitting_${sittingKey}_scratch_card_number`]: e.target.value
                                        }))}
                                        placeholder="Enter scratch card number"
                                        className="w-full"
                                        required
                                    />
                                    <p className="text-sm text-gray-500">
                                        Please use a new or unused scratch card.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`wassce_sitting_${sittingKey}_result`} className="text-base font-medium flex items-center gap-2">
                                        {wassceSittings === 1 ? 'WASSCE Result' : `WASSCE Result ${sittingKey}`} <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                                <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                                            </div>
                                            <Input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileChange(`wassce_sitting_${sittingKey}_result`, file);
                                                }}
                                                className="hidden"
                                                required={!(selectedFile || existingFile)}
                                            />
                                        </label>
                                    </div>
                                    {(selectedFile || existingFile) && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileIcon className="w-5 h-5 text-blue-600" />
                                                <span className="text-sm font-medium">
                          {selectedFile ? selectedFile.name : existingFile?.filename}
                        </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleFilePreview(selectedFile || existingFile?.filename)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeFile(`wassce_sitting_${sittingKey}_result`)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor={`wassce_sitting_${sittingKey}_testimonial`} className="text-base font-medium flex items-center gap-2">
                                        WASSCE Testimonial
                                    </Label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex-1">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                                <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                                            </div>
                                            <Input
                                                type="file"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileChange(`wassce_sitting_${sittingKey}_testimonial`, file);
                                                }}
                                                className="hidden"
                                                required={false}
                                            />
                                        </label>
                                    </div>
                                    {(selectedTestimonial || existingTestimonial) && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FileIcon className="w-5 h-5 text-blue-600" />
                                                <span className="text-sm font-medium">
                          {selectedTestimonial ? selectedTestimonial.name : existingTestimonial?.filename}
                        </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleFilePreview(selectedTestimonial || existingTestimonial?.filename)}
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Preview
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeFile(`wassce_sitting_${sittingKey}_testimonial`)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        } else if (qualificationType === 'A-Level') {
            return (
                <div className="mt-4 space-y-6">
                    <div>
                        <Label className="text-base font-medium">Number of Sittings</Label>
                        <Select
                            value={alevelSittings.toString()}
                            onValueChange={(value) => handleSittingsChange('A-Level', parseInt(value))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select number of sittings" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Sitting</SelectItem>
                                <SelectItem value="2">2 Sittings</SelectItem>
                                <SelectItem value="3">3 Sittings</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {Array.from({ length: alevelSittings }, (_, sittingIndex) => (
                        <div key={sittingIndex} className="space-y-4">
                            <h4 className="text-lg font-medium">A-Level Sitting {sittingIndex + 1}</h4>

                            <Table className="border">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Grade</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(alevelResults[sittingIndex] || []).map((result, resultIndex) => (
                                        <TableRow key={resultIndex}>
                                            <TableCell>
                                                <Select
                                                    value={result.subject}
                                                    onValueChange={(value) => updateSubjectGrade('A-Level', sittingIndex, resultIndex, 'subject', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select subject" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {A_LEVEL_SUBJECTS.map((subject) => (
                                                            <SelectItem key={subject} value={subject}>
                                                                {subject}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={result.grade}
                                                    onValueChange={(value) => updateSubjectGrade('A-Level', sittingIndex, resultIndex, 'grade', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select grade" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {A_LEVEL_GRADES.map((grade) => (
                                                            <SelectItem key={grade} value={grade}>
                                                                {grade}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeSubjectGrade('A-Level', sittingIndex, resultIndex)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => addSubjectGrade('A-Level', sittingIndex)}
                                className="flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Subject
                            </Button>
                        </div>
                    ))}
                </div>
            );
        } else if (['Degree', 'Diploma', 'Certificate'].includes(qualificationType)) {
            const qualKey = qualificationType.toLowerCase();
            const selectedFile = files[`question_${qualKey}_certificate`];
            const existingFile = filesMetadata[`question_${qualKey}_certificate`];
            const selectedTestimonial = files[`question_${qualKey}_testimonial`];
            const existingTestimonial = filesMetadata[`question_${qualKey}_testimonial`];
            return (
                <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor={`${qualKey}_graduation_year`} className="text-base font-medium flex items-center gap-2">
                            Graduation Year <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`${qualKey}_graduation_year`}
                            type="number"
                            value={formData[`${qualKey}_graduation_year`] || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                [`${qualKey}_graduation_year`]: e.target.value
                            }))}
                            placeholder="Enter graduation year (e.g., 2023)"
                            className="w-full"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${qualKey}_institution_name`} className="text-base font-medium flex items-center gap-2">
                            College/University Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`${qualKey}_institution_name`}
                            type="text"
                            value={formData[`${qualKey}_institution_name`] || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                [`${qualKey}_institution_name`]: e.target.value
                            }))}
                            placeholder="Enter college or university name"
                            className="w-full"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${qualKey}_district`} className="text-base font-medium flex items-center gap-2">
                            District <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`${qualKey}_district`}
                            type="text"
                            value={formData[`${qualKey}_district`] || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                [`${qualKey}_district`]: e.target.value
                            }))}
                            placeholder="Enter district"
                            className="w-full"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${qualKey}_country`} className="text-base font-medium flex items-center gap-2">
                            Country <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`${qualKey}_country`}
                            type="text"
                            value={formData[`${qualKey}_country`] || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                [`${qualKey}_country`]: e.target.value
                            }))}
                            placeholder="Enter country"
                            className="w-full"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${qualKey}_certificate`} className="text-base font-medium flex items-center gap-2">
                            Academic Certificate/Transcript
                        </Label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                                </div>
                                <Input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileChange(`${qualKey}_certificate`, file);
                                    }}
                                    className="hidden"
                                    required={false}
                                />
                            </label>
                        </div>
                        {(selectedFile || existingFile) && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium">
                    {selectedFile ? selectedFile.name : existingFile?.filename}
                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFilePreview(selectedFile || existingFile?.filename)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeFile(`${qualKey}_certificate`)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`${qualKey}_testimonial`} className="text-base font-medium flex items-center gap-2">
                            Academic Testimonial
                        </Label>
                        <div className="flex items-center gap-4">
                            <label className="flex-1">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                                </div>
                                <Input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileChange(`${qualKey}_testimonial`, file);
                                    }}
                                    className="hidden"
                                    required={false}
                                />
                            </label>
                        </div>
                        {(selectedTestimonial || existingTestimonial) && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium">
                    {selectedTestimonial ? selectedTestimonial.name : existingTestimonial?.filename}
                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFilePreview(selectedTestimonial || existingTestimonial?.filename)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeFile(`${qualKey}_testimonial`)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return null;
    };

    const shouldShowQuestion = (question: Question) => {
        if (!question.conditional_logic) return true;
        const { question_id, value } = question.conditional_logic;
        const dependentValue = formData[`question_${question_id}`];
        return dependentValue === value;
    };

    const renderField = (question: Question) => {
        const value = formData[`question_${question.id}`] || '';
        const fieldId = `question_${question.id}`;
        const safeOptions = Array.isArray(question.options)
            ? question.options
            : typeof question.options === 'string'
                ? JSON.parse(question.options)
                : [];

        // Check if this is a qualification type question
        const isQualificationType = question.question_text.toLowerCase().includes('qualification type') ||
            question.question_text.toLowerCase().includes('certificate type');

        switch (question.question_type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'tel':
                return (
                    <Input
                        id={fieldId}
                        type={question.question_type === 'phone' || question.question_type === 'tel' ? 'tel' : question.question_type}
                        value={value}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        placeholder={`Enter your ${question.question_text.toLowerCase()}`}
                        className="w-full"
                        required={question.is_required}
                    />
                );

            case 'textarea':
                return (
                    <Textarea
                        id={fieldId}
                        value={value}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        placeholder={`Enter ${question.question_text.toLowerCase()}`}
                        rows={4}
                        className="w-full"
                        required={question.is_required}
                    />
                );

            case 'date':
                return (
                    <Input
                        id={fieldId}
                        type="date"
                        value={value}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        className="w-full"
                        required={question.is_required}
                    />
                );

            case 'number':
                return (
                    <Input
                        id={fieldId}
                        type="number"
                        value={value}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        placeholder={`Enter ${question.question_text.toLowerCase()}`}
                        className="w-full"
                        required={question.is_required}
                    />
                );

            case 'single_select':
                return (
                    <div>
                        <Select
                            value={value}
                            onValueChange={(selectedValue) =>
                                isQualificationType
                                    ? handleQualificationChange(question.id, selectedValue)
                                    : handleInputChange(question.id, selectedValue)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                                {safeOptions.map((option: string) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {isQualificationType && (['WASSCE', 'A-Level', 'Degree', 'Diploma', 'Certificate'].includes(value)) && renderQualificationResults(question)}
                    </div>
                );

            case 'multiple_select': {
                const selectedValues = Array.isArray(value) ? value : [];
                return (
                    <div className="space-y-2">
                        {safeOptions.map((option: string, idx: number) => (
                            <label key={idx} className="flex items-center space-x-2">
                                <Checkbox
                                    checked={selectedValues.includes(option)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            handleInputChange(question.id, [...selectedValues, option]);
                                        } else {
                                            handleInputChange(question.id, selectedValues.filter(v => v !== option));
                                        }
                                    }}
                                />
                                <span>{option}</span>
                            </label>
                        ))}
                    </div>
                );
            }

            case 'file': {
                const selectedFile = files[fieldId];
                const existingFile = filesMetadata[fieldId];
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-4">
                            <label className="flex-1">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                                    <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                                </div>
                                <Input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileChange(question.id, file);
                                    }}
                                    className="hidden"
                                    required={question.is_required && !(selectedFile || existingFile)}
                                />
                            </label>
                        </div>
                        {(selectedFile || existingFile) && (
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileIcon className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium">
                    {selectedFile ? selectedFile.name : existingFile?.filename}
                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleFilePreview(selectedFile || existingFile?.filename)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Preview
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeFile(question.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            }

            case 'table': {
                const tableData = Array.isArray(value) ? value : [];
                const columns = question.table_columns || [];
                const isEmploymentHistory = question.question_text.toLowerCase().includes('employment history');
                return (
                    <div className="space-y-4">
                        <Table className="border">
                            <TableHeader>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableHead key={column.name}>
                                            {column.name}
                                            {column.is_required && <span className="text-red-500">*</span>}
                                        </TableHead>
                                    ))}
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableData.map((row: TableRow, rowIndex: number) => (
                                    <TableRow key={rowIndex}>
                                        {columns.map((column) => (
                                            <TableCell key={column.name}>
                                                {column.type === 'select' ? (
                                                    <Select
                                                        value={row[column.name] || ''}
                                                        onValueChange={(value) => handleTableInputChange(question.id, rowIndex, column.name, value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {column.options?.map((option: string) => (
                                                                <SelectItem key={option} value={option}>
                                                                    {option}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : column.type === 'textarea' ? (
                                                    <Textarea
                                                        value={row[column.name] || ''}
                                                        onChange={(e) => handleTableInputChange(question.id, rowIndex, column.name, e.target.value)}
                                                        rows={2}
                                                    />
                                                ) : (
                                                    <Input
                                                        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : column.type === 'email' ? 'email' : column.type === 'tel' ? 'tel' : 'text'}
                                                        value={row[column.name] || ''}
                                                        onChange={(e) => handleTableInputChange(question.id, rowIndex, column.name, e.target.value)}
                                                        required={column.is_required}
                                                    />
                                                )}
                                            </TableCell>
                                        ))}
                                        <TableCell>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeTableRow(question.id, rowIndex)}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => addTableRow(question.id, columns)}
                            disabled={isEmploymentHistory && tableData.length >= 3}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {isEmploymentHistory ? 'Add Employment' : 'Add Row'}
                        </Button>
                    </div>
                );
            }

            default:
                return (
                    <Input
                        id={fieldId}
                        type="text"
                        value={value}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        placeholder={`Enter ${question.question_text.toLowerCase()}`}
                        className="w-full"
                        required={question.is_required}
                    />
                );
        }
    };

    if (isLoading) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-t-blue-600 border-r-blue-600 border-b-purple-600 border-l-purple-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (submittedApplication && !isEditMode) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader className="bg-green-50 border-b">
                        <CardTitle className="text-2xl text-green-800 flex items-center gap-3">
                            <Check className="w-8 h-8" />
                            Application Submitted Successfully
                        </CardTitle>
                        <p className="text-green-600">
                            Submitted on: {submittedApplication.submitted_at ? new Date(submittedApplication.submitted_at).toLocaleDateString() : 'Unknown date'}
                        </p>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex gap-4 mb-6">
                            <Button onClick={handleEditApplication} className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Edit Application
                            </Button>
                            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                                <Printer className="w-4 h-4" />
                                Print Application
                            </Button>
                        </div>

                        <div ref={printRef}>
                            <h2 className="text-xl font-bold mb-4">Application Details</h2>
                            {submittedApplication.categories ? (
                                Object.keys(submittedApplication.categories).map(categoryName => (
                                    <div key={categoryName} className="category mb-6">
                                        <h3 className="category-title">{categoryName}</h3>
                                        {submittedApplication.categories[categoryName].map((response: any) => (
                                            <div key={response.question_id} className="question">
                                                <div className="question-text">{response.question_text}</div>
                                                <div className="answer">
                                                    {response.file_path ? (
                                                        <span className="file-info">File: {response.file_path}</span>
                                                    ) : (
                                                        response.answer || 'No answer provided'
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            ) : (
                                <p>No application data available</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (categories.length === 0 || !categories[currentStep]) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Loading application form...</p>
            </div>
        );
    }

    const currentCategory = categories[currentStep];
    const progress = ((currentStep + 1) / categories.length) * 100;
    const isLastStep = currentStep === categories.length - 1;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>File Preview</DialogTitle>
                    </DialogHeader>
                    {previewFile && (
                        <div className="flex justify-center">
                            {previewFile.type === 'image' ? (
                                <img src={previewFile.url} alt="Preview" className="max-w-full h-auto" />
                            ) : (
                                <iframe
                                    src={previewFile.url}
                                    className="w-full h-96 border"
                                    title="PDF Preview"
                                />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {lastSaved ? (
                        <span>Last saved: {new Date(lastSaved).toLocaleString()}</span>
                    ) : (
                        <span>No progress saved yet</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveProgress(true)}
                        disabled={isSaving}
                        className="flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Progress'}
                    </Button>
                    {isLastStep && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            className="flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" />
                            Print Form
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex justify-between mb-8 overflow-x-auto pb-4">
                {categories.map((category, index) => {
                    if (!category) return null;

                    const isCompleted = completedSteps.includes(index);
                    const isCurrent = currentStep === index;
                    const isAccessible = index <= currentStep || completedSteps.includes(index);

                    return (
                        <div
                            key={category.name || index}
                            className={`flex flex-col items-center cursor-pointer min-w-0 flex-1 px-2 ${
                                isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                            }`}
                            onClick={() => isAccessible && goToStep(index)}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                                isCompleted
                                    ? 'bg-green-500 text-white'
                                    : isCurrent
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-300 text-gray-600'
                            }`}>
                                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
                            </div>
                            <span className={`text-xs mt-2 text-center font-medium ${
                                isCurrent ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                {category.name || `Step ${index + 1}`}
              </span>
                        </div>
                    );
                })}
            </div>

            <div ref={printRef} className="print-content">
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                        <CardTitle className="text-2xl text-gray-800 flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                completedSteps.includes(currentStep) ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                            }`}>
                                {completedSteps.includes(currentStep) ? <Check className="w-5 h-5" /> : currentStep + 1}
                            </div>
                            {currentCategory.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form className="space-y-6">
                            {currentCategory.questions
                                .filter(question => shouldShowQuestion(question))
                                .map((question) => (
                                    <div key={question.id} className="space-y-2">
                                        <Label
                                            htmlFor={`question_${question.id}`}
                                            className="text-base font-medium flex items-center gap-2"
                                        >
                                            {question.question_text}
                                            {question.is_required && <span className="text-red-500">*</span>}
                                        </Label>
                                        {renderField(question)}
                                    </div>
                                ))}
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center mt-6">
                <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </Button>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="auto-save"
                            checked={autoSaveEnabled}
                            onCheckedChange={(checked) => setAutoSaveEnabled(!!checked)}
                        />
                        <Label htmlFor="auto-save">Auto-save progress</Label>
                    </div>
                    {isLastStep ? (
                        <Button
                            onClick={submitApplication}
                            disabled={isSubmitting || !canProceed}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        >
                            <Check className="w-4 h-4" />
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </Button>
                    ) : (
                        <Button
                            onClick={nextStep}
                            disabled={!canProceed}
                            className="flex items-center gap-2"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}