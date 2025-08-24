import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/services/api';
import {
    Upload,
    ChevronLeft,
    ChevronRight,
    Check,
    FileIcon,
    X,
    Save,
    Clock,
    Printer,
    Eye,
    Edit,
    Plus,
    Trash2
} from 'lucide-react';

const WASSCE_SUBJECTS = [
    'Mathematics','English Language','Physics','Chemistry','Biology','History','Geography','Economics','Literature in English','French',
    'Government','Religious Studies','Agricultural Science','Technical Drawing','Visual Arts','Music','Computer Studies','Physical Education'
];
const A_LEVEL_SUBJECTS = [
    'Mathematics','Further Mathematics','Physics','Chemistry','Biology','History','Geography','Economics','Literature in English','French',
    'Government','Psychology','Sociology','Art','Music'
];
const WASSCE_GRADES = ['A1','A2','B2','B3','C4','C5','C6','D7','E8','F9'];
const A_LEVEL_GRADES = ['A','B','C','D','E'];

interface Question {
    id: number;
    category: string;
    category_id: number;
    category_order: number;
    section: string;
    question_text: string;
    question_type: string;
    options?: string[] | string;
    validation_rules?: Record<string, unknown>;
    conditional_logic?: { question_id: number; value: string; show_question_ids?: number[] } | null;
    is_required: boolean;
    sort_order: number;
    table_columns?: Array<{ id: number; name: string; type: string; is_required: boolean; options?: string[] | string }>;
}

interface SubmittedApplication {
    id: number;
    application_number?: string;
    submitted_at: string;
    categories: {
        [key: string]: Array<{
            question_id: number;
            question_text: string;
            answer: string;
            file_path?: string;
            question_type: string;
        }>
    };
}

type FormState = Record<string, any>;

interface Category {
    name: string;
    order: number;
    questions: Question[];
}

interface TableRowData { [key: string]: string }

interface QualificationResult { subject: string; grade: string }

interface FileMeta {
    filename: string;
    original_name: string;
    file_path?: string;
    size?: number;
    type?: string;
    uploaded_at?: string;
}

export default function MultiStepperForm() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<FormState>({});
    const [files, setFiles] = useState<Record<string, File>>({});
    const [filesMetadata, setFilesMetadata] = useState<Record<string, FileMeta>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [canProceed, setCanProceed] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
    const [submittedApplication, setSubmittedApplication] = useState<SubmittedApplication | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [previewFile, setPreviewFile] = useState<{ url: string; type: string; name?: string }>({ url: '', type: '' });
    const [applicationNumber, setApplicationNumber] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const [wassceSittings, setWassceSittings] = useState<number>(1);
    const [alevelSittings, setAlevelSittings] = useState<number>(1);
    const [wassceResults, setWassceResults] = useState<QualificationResult[][]>([[]]);
    const [alevelResults, setAlevelResults] = useState<QualificationResult[][]>([[]]);

    const safeJsonParse = <T,>(text: string, fallback: T): T => {
        try { return JSON.parse(text) as T } catch { return fallback }
    };
    const extractFilename = (path: string): string => {
        try { return path?.split('/').pop() || path } catch { return path }
    };
    const isImage = (name: string) => /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
    const isPdf = (name: string) => /\.pdf$/i.test(name);
    const resolveFileUrl = (meta?: FileMeta): string => {
        if (!meta) return '';
        if (meta.file_path?.startsWith('http')) return meta.file_path;
        if (meta.file_path) return meta.file_path;
        return `/uploads/${meta.filename}`;
    };

    const saveProgress = useCallback(
        async (showNotification = true) => {
            if (isSaving) return;
            setIsSaving(true);
            try {
                const fd = new FormData();
                fd.append('formData', JSON.stringify(formData));
                fd.append('currentStep', currentStep.toString());
                fd.append('completedSteps', JSON.stringify(completedSteps));

                Object.keys(files).forEach(k => {
                    const f = files[k];
                    if (f && !filesMetadata[k]?.file_path) {
                        fd.append(k, f);
                    }
                });

                const response = await api.post('/applicant/application/save-progress', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.files_metadata) {
                    setFilesMetadata(prev => ({
                        ...prev,
                        ...response.data.files_metadata
                    }));
                }

                const now = new Date().toISOString();
                setLastSaved(now);
                if (showNotification) toast.success('Progress saved');
            } catch (error) {
                console.error('Save progress error:', error);
                if (showNotification) toast.error('Save failed');
            } finally {
                setIsSaving(false);
            }
        },
        [formData, files, filesMetadata, currentStep, completedSteps, isSaving]
    );

    useEffect(() => {
        if (!autoSaveEnabled || isEditMode) return;
        const interval = setInterval(() => {
            if (Object.keys(formData).length > 0 || Object.keys(files).length > 0) {
                saveProgress(false);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [formData, files, currentStep, completedSteps, autoSaveEnabled, isEditMode, saveProgress]);

    useEffect(() => {
        if (isEditMode) {
            setCurrentStep(0);
            setCompletedSteps([]);
        }
    }, [isEditMode]);

    useEffect(() => {
        initializeForm();
    }, [isEditMode]);

    useEffect(() => {
        validateCurrentStep();
    }, [formData, currentStep, categories, files, filesMetadata, wassceResults, alevelResults, wassceSittings, alevelSittings]);

    useEffect(() => {
        if (Object.keys(formData).length > 0 && !isLoading) {
            const wassceKeys = Object.keys(formData).filter(k => k.startsWith('wassce_results_sitting_'));
            if (wassceKeys.length > 0) {
                const max = Math.max(...wassceKeys.map(k => parseInt(k.split('_')[3], 10)));
                setWassceSittings(max);
                const restored = Array.from({ length: max }, (_, idx) => {
                    const data = formData[`wassce_results_sitting_${idx + 1}`];
                    if (Array.isArray(data)) return data as QualificationResult[];
                    if (typeof data === 'string') return safeJsonParse<QualificationResult[]>(data, []);
                    return [];
                });
                setWassceResults(restored);
            }
            const alevelKeys = Object.keys(formData).filter(k => k.startsWith('alevel_results_sitting_'));
            if (alevelKeys.length > 0) {
                const max = Math.max(...alevelKeys.map(k => parseInt(k.split('_')[3], 10)));
                setAlevelSittings(max);
                const restored = Array.from({ length: max }, (_, idx) => {
                    const data = formData[`alevel_results_sitting_${idx + 1}`];
                    if (Array.isArray(data)) return data as QualificationResult[];
                    if (typeof data === 'string') return safeJsonParse<QualificationResult[]>(data, []);
                    return [];
                });
                setAlevelResults(restored);
            }
        }
    }, [formData, isLoading]);

    // const initializeForm = async () => {
    //     try {
    //         setIsLoading(true);
    //         const [questionsResponse, profileResponse, submittedResponse, draftResponse] = await Promise.all([
    //             api.get('/applicant/questions'),
    //             api.get('/applicant/profile'),
    //             api.get('/applicant/application/submitted'),
    //             api.get('/applicant/application/load-progress').catch(() => ({ data: null }))
    //         ]);
    //
    //         const rawQuestions: Question[] = (questionsResponse.data || []) as Question[];
    //         const questions: Question[] = rawQuestions.map(q => {
    //             let opts = q.options;
    //             if (typeof opts === 'string') {
    //                 const parsed = safeJsonParse<string[]>(opts, []);
    //                 opts = parsed;
    //             }
    //             let logic = q.conditional_logic;
    //             if (typeof logic === 'string') logic = safeJsonParse(logic, null);
    //             let tableCols = q.table_columns;
    //             if (typeof tableCols === 'string') tableCols = safeJsonParse(tableCols, []);
    //             return { ...q, options: opts, conditional_logic: logic, table_columns: tableCols };
    //         });
    //
    //         const qualificationQuestion = questions.find(q =>
    //             q.question_text.toLowerCase().includes('qualification type') ||
    //             q.question_text.toLowerCase().includes('certificate type')
    //         );
    //         if (qualificationQuestion) {
    //             qualificationQuestion.options = ['WASSCE','A-Level','Degree','Diploma','Certificate'];
    //         }
    //
    //         const grouped = questions.reduce<Record<string, { questions: Question[]; order: number }>>((acc, q) => {
    //             if (!acc[q.category]) acc[q.category] = { questions: [], order: q.category_order };
    //             acc[q.category].questions.push(q);
    //             return acc;
    //         }, {});
    //         const categoriesArray: Category[] = Object.keys(grouped)
    //             .map(name => ({
    //                 name,
    //                 order: grouped[name].order,
    //                 questions: grouped[name].questions.sort((a, b) => a.sort_order - b.sort_order)
    //             }))
    //             .sort((a, b) => a.order - b.order);
    //         setCategories(categoriesArray);
    //
    //         let submittedApp: SubmittedApplication | null = null;
    //         if (submittedResponse.data?.application && !Array.isArray(submittedResponse.data.application)) {
    //             submittedApp = submittedResponse.data.application as SubmittedApplication;
    //             setApplicationNumber(submittedApp.application_number || null);
    //         }
    //
    //         if (submittedApp && !isEditMode) {
    //             setSubmittedApplication(submittedApp);
    //             setIsLoading(false);
    //             return;
    //         }
    //
    //         const profileData = profileResponse.data || {};
    //
    //         let initialFormData: FormState = {};
    //         let initialFilesMetadata: Record<string, FileMeta> = {};
    //         let restoredCurrentStep = 0;
    //         let restoredCompletedSteps: number[] = [];
    //         let restoredLastSaved: string | null = null;
    //
    //         if (isEditMode && submittedApp) {
    //             setApplicationNumber(submittedApp.application_number || null);
    //             Object.values(submittedApp.categories).forEach(answerArr => {
    //                 answerArr.forEach(ans => {
    //                     const key = `question_${ans.question_id}`;
    //                     if (ans.question_type === 'file') {
    //                         if (ans.file_path) {
    //                             const fname = extractFilename(ans.file_path);
    //                             initialFormData[key] = fname;
    //                             initialFilesMetadata[key] = {
    //                                 filename: fname,
    //                                 original_name: fname,
    //                                 file_path: ans.file_path
    //                             };
    //                         }
    //                     } else if (ans.question_type === 'multiple_select') {
    //                         let parsed: any = [];
    //                         if (ans.answer?.trim().startsWith('[')) {
    //                             parsed = safeJsonParse(ans.answer, []);
    //                         } else if (ans.answer?.includes(',')) {
    //                             parsed = ans.answer.split(',').map(s => s.trim()).filter(Boolean);
    //                         } else if (ans.answer) {
    //                             parsed = [ans.answer];
    //                         }
    //                         initialFormData[key] = parsed;
    //                     } else if (ans.question_type === 'table') {
    //                         let parsed = safeJsonParse<TableRowData[]>(ans.answer, []);
    //                         initialFormData[key] = parsed;
    //                     } else {
    //                         initialFormData[key] = ans.answer;
    //                     }
    //                 });
    //             });
    //         } else if (draftResponse.data?.draft) {
    //             const draft = draftResponse.data.draft;
    //             if (draft.formData) initialFormData = safeJsonParse<FormState>(draft.formData, {});
    //             if (draft.filesMetadata) initialFilesMetadata = safeJsonParse<Record<string, FileMeta>>(draft.filesMetadata, {});
    //             if (draft.currentStep !== undefined) restoredCurrentStep = draft.currentStep;
    //             if (draft.completedSteps) restoredCompletedSteps = safeJsonParse<number[]>(draft.completedSteps, []);
    //             if (draft.updated_at) restoredLastSaved = draft.updated_at;
    //         }
    //
    //         const profileMappings: Record<string, string[]> = {
    //             first_name: ['first name'],
    //             last_name: ['last name'],
    //             middle_name: ['middle name'],
    //             email: ['email'],
    //             phone: ['phone'],
    //             date_of_birth: ['date of birth','dob'],
    //             gender: ['gender','sex'],
    //             country: ['country','nationality'],
    //             address: ['address','residential address']
    //         };
    //         categoriesArray.forEach(cat => {
    //             cat.questions.forEach(q => {
    //                 const lower = q.question_text.toLowerCase();
    //                 Object.entries(profileMappings).forEach(([field, keys]) => {
    //                     if (keys.some(k => lower.includes(k))) {
    //                         if (!initialFormData[`question_${q.id}`] && profileData[field]) {
    //                             initialFormData[`question_${q.id}`] = profileData[field];
    //                         }
    //                     }
    //                 });
    //             });
    //         });
    //
    //         setFormData(initialFormData);
    //         setFilesMetadata(initialFilesMetadata);
    //
    //         if (!isEditMode && restoredLastSaved) {
    //             setCurrentStep(restoredCurrentStep);
    //             setCompletedSteps(restoredCompletedSteps);
    //             setLastSaved(restoredLastSaved);
    //             toast.success('Draft restored');
    //         } else if (isEditMode) {
    //             toast.success('Application loaded for editing');
    //         } else {
    //             toast.success('Form initialized');
    //         }
    //
    //     } catch (e) {
    //         console.error('Initialization error', e);
    //         toast.error('Failed to load form');
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };

    const initializeForm = async () => {
        try {
            setIsLoading(true);
            const [questionsResponse, profileResponse, submittedResponse, draftResponse] = await Promise.all([
                api.get('/applicant/questions'),
                api.get('/applicant/profile'),
                api.get('/applicant/application/submitted'),
                api.get('/applicant/application/load-progress').catch(() => ({ data: null }))
            ]);

            const rawQuestions: Question[] = (questionsResponse.data || []) as Question[];
            const questions: Question[] = rawQuestions.map(q => {
                let opts = q.options;
                if (typeof opts === 'string') {
                    const parsed = safeJsonParse<string[]>(opts, []);
                    opts = parsed;
                }
                let logic = q.conditional_logic;
                if (typeof logic === 'string') logic = safeJsonParse(logic, null);
                let tableCols = q.table_columns;
                if (typeof tableCols === 'string') tableCols = safeJsonParse(tableCols, []);
                return { ...q, options: opts, conditional_logic: logic, table_columns: tableCols };
            });

            const qualificationQuestion = questions.find(q =>
                q.question_text.toLowerCase().includes('qualification type') ||
                q.question_text.toLowerCase().includes('certificate type')
            );
            if (qualificationQuestion) {
                qualificationQuestion.options = ['WASSCE','A-Level','Degree','Diploma','Certificate'];
            }

            const grouped = questions.reduce<Record<string, { questions: Question[]; order: number }>>((acc, q) => {
                if (!acc[q.category]) acc[q.category] = { questions: [], order: q.category_order };
                acc[q.category].questions.push(q);
                return acc;
            }, {});
            const categoriesArray: Category[] = Object.keys(grouped)
                .map(name => ({
                    name,
                    order: grouped[name].order,
                    questions: grouped[name].questions.sort((a, b) => a.sort_order - b.sort_order)
                }))
                .sort((a, b) => a.order - b.order);
            setCategories(categoriesArray);

            let submittedApp: SubmittedApplication | null = null;
            if (submittedResponse.data?.application && !Array.isArray(submittedResponse.data.application)) {
                submittedApp = submittedResponse.data.application as SubmittedApplication;
                setApplicationNumber(submittedApp.application_number || null);
            }

            if (submittedApp && !isEditMode) {
                setSubmittedApplication(submittedApp);
                setIsLoading(false);
                return;
            }

            const profileData = profileResponse.data || {};

            let initialFormData: FormState = {};
            let initialFilesMetadata: Record<string, FileMeta> = {};
            let restoredCurrentStep = 0;
            let restoredCompletedSteps: number[] = [];
            let restoredLastSaved: string | null = null;

            // Handle Edit Mode - Load from submitted application
            if (isEditMode && submittedApp) {
                setApplicationNumber(submittedApp.application_number || null);
                Object.values(submittedApp.categories).forEach(answerArr => {
                    answerArr.forEach(ans => {
                        const key = `question_${ans.question_id}`;
                        if (ans.question_type === 'file') {
                            if (ans.file_path) {
                                const fname = extractFilename(ans.file_path);
                                initialFormData[key] = fname;
                                initialFilesMetadata[key] = {
                                    filename: fname,
                                    original_name: fname,
                                    file_path: ans.file_path
                                };
                            }
                        } else if (ans.question_type === 'multiple_select') {
                            let parsed: any = [];
                            if (ans.answer?.trim().startsWith('[')) {
                                parsed = safeJsonParse(ans.answer, []);
                            } else if (ans.answer?.includes(',')) {
                                parsed = ans.answer.split(',').map(s => s.trim()).filter(Boolean);
                            } else if (ans.answer) {
                                parsed = [ans.answer];
                            }
                            initialFormData[key] = parsed;
                        } else if (ans.question_type === 'table') {
                            let parsed = safeJsonParse<TableRowData[]>(ans.answer, []);
                            initialFormData[key] = parsed;
                        } else {
                            initialFormData[key] = ans.answer;
                        }
                    });
                });
            }
            // Handle Draft Mode - Load from saved progress
            else if (draftResponse.data?.draft) {
                const draft = draftResponse.data.draft;

                // Parse form data
                if (draft.formData) {
                    const parsedFormData = safeJsonParse<FormState>(draft.formData, {});
                    initialFormData = { ...parsedFormData };
                }

                // Parse and restore files metadata - THIS IS THE KEY PART
                if (draft.filesMetadata) {
                    const parsedFilesMetadata = safeJsonParse<Record<string, FileMeta>>(draft.filesMetadata, {});

                    // Process each file metadata entry
                    Object.entries(parsedFilesMetadata).forEach(([key, meta]) => {
                        if (meta && typeof meta === 'object' && meta.file_path) {
                            // Store the complete metadata
                            initialFilesMetadata[key] = {
                                filename: meta.filename || '',
                                original_name: meta.original_name || meta.filename || '',
                                file_path: meta.file_path,
                                size: meta.size,
                                type: meta.type,
                                uploaded_at: meta.uploaded_at
                            };

                            // IMPORTANT: Update formData to show the filename
                            // This ensures the file input shows it has a file
                            initialFormData[key] = meta.original_name || meta.filename || 'File uploaded';
                        }
                    });
                }

                // Restore step information
                if (draft.currentStep !== undefined) restoredCurrentStep = draft.currentStep;
                if (draft.completedSteps) restoredCompletedSteps = safeJsonParse<number[]>(draft.completedSteps, []);
                if (draft.updated_at) restoredLastSaved = draft.updated_at;
            }

            // Apply profile data mappings (only if field is empty)
            const profileMappings: Record<string, string[]> = {
                first_name: ['first name'],
                last_name: ['last name'],
                middle_name: ['middle name'],
                email: ['email'],
                phone: ['phone'],
                date_of_birth: ['date of birth','dob'],
                gender: ['gender','sex'],
                country: ['country','nationality'],
                address: ['address','residential address']
            };

            categoriesArray.forEach(cat => {
                cat.questions.forEach(q => {
                    const lower = q.question_text.toLowerCase();
                    Object.entries(profileMappings).forEach(([field, keys]) => {
                        if (keys.some(k => lower.includes(k))) {
                            const questionKey = `question_${q.id}`;
                            if (!initialFormData[questionKey] && profileData[field]) {
                                initialFormData[questionKey] = profileData[field];
                            }
                        }
                    });
                });
            });

            // Set all state at once
            setFormData(initialFormData);
            setFilesMetadata(initialFilesMetadata);
            setFiles({}); // Clear local files since uploaded files are on server

            // Set navigation state
            if (!isEditMode && restoredLastSaved) {
                setCurrentStep(restoredCurrentStep);
                setCompletedSteps(restoredCompletedSteps);
                setLastSaved(restoredLastSaved);

                // Log what was restored for debugging
                console.log('Restored files metadata:', initialFilesMetadata);
                toast.success('Draft restored successfully');
            } else if (isEditMode) {
                // Reset navigation for edit mode
                setCurrentStep(0);
                setCompletedSteps([]);
                toast.success('Application loaded for editing');
            } else {
                toast.success('Form initialized');
            }

        } catch (e) {
            console.error('Initialization error', e);
            toast.error('Failed to load form');
        } finally {
            setIsLoading(false);
        }
    };

    const shouldShowQuestion = (question: Question) => {
        if (!question.conditional_logic) return true;
        const { question_id, value } = question.conditional_logic;
        const dep = formData[`question_${question_id}`];
        return dep === value;
    };

    const validateCurrentStep = () => {
        if (!categories[currentStep]) return;
        const currentCategory = categories[currentStep];
        const requiredQuestions = currentCategory.questions.filter(q => q.is_required && shouldShowQuestion(q));
        let valid = requiredQuestions.every(q => {
            const val = formData[`question_${q.id}`];
            if (q.question_type === 'file') {
                const meta = filesMetadata[`question_${q.id}`];
                const file = files[`question_${q.id}`];
                return !!(meta?.file_path || file);
            }
            if (q.question_type === 'multiple_select') return Array.isArray(val) && val.length > 0;
            if (q.question_type === 'table') {
                const rows = Array.isArray(val) ? val as TableRowData[] : [];
                return rows.length > 0 && rows.every(r =>
                    q.table_columns?.every(c => c.is_required ? (r[c.name] ?? '').toString().trim() !== '' : true)
                );
            }
            return val !== undefined && val !== null && val.toString().trim() !== '';
        });

        if (currentCategory.name === 'Academic History') {
            const schoolQ = currentCategory.questions.find(q => q.question_text.toLowerCase().includes('schools attended'));
            if (schoolQ) {
                const rows = formData[`question_${schoolQ.id}`];
                if (!Array.isArray(rows) || rows.length === 0) valid = false;
            }
        }
        if (currentCategory.name === 'Additional Information') {
            const refQ = currentCategory.questions.find(q => q.question_text.toLowerCase().includes('references'));
            if (refQ) {
                const rows = formData[`question_${refQ.id}`];
                if (!Array.isArray(rows) || rows.length < 2) valid = false;
            }
        }
        if (currentCategory.name === 'Financial Information') {
            const fundingQ = currentCategory.questions.find(q => q.question_text === 'Method of Funding');
            const funding = fundingQ ? formData[`question_${fundingQ.id}`] : '';
            if (funding === 'Sponsor') {
                const required = ['name','relationship','phone'];
                required.forEach(key => {
                    const match = currentCategory.questions.find(q => q.question_text.toLowerCase().includes(`sponsor ${key}`));
                    if (match) {
                        const v = (formData[`question_${match.id}`] || '').toString().trim();
                        if (!v) valid = false;
                    }
                });
            }
        }

        const qualQuestion = currentCategory.questions.find(q =>
            q.question_text.toLowerCase().includes('qualification type') ||
            q.question_text.toLowerCase().includes('certificate type')
        );
        const qualificationType = qualQuestion ? formData[`question_${qualQuestion.id}`] : undefined;

        if (qualificationType === 'WASSCE') {
            const wassceValid = Array.from({ length: wassceSittings }, (_, idx) => {
                const sit = idx + 1;
                const resultsOk = wassceResults[idx]?.length > 0 && wassceResults[idx].every(r => r.subject && r.grade);
                const pin = (formData[`wassce_sitting_${sit}_scratch_card_pin`] || '').toString().trim();
                const num = (formData[`wassce_sitting_${sit}_scratch_card_number`] || '').toString().trim();
                const school = (formData[`wassce_sitting_${sit}_school_name`] || '').toString().trim();
                const dist = (formData[`wassce_sitting_${sit}_district`] || '').toString().trim();
                const country = (formData[`wassce_sitting_${sit}_country`] || '').toString().trim();
                const year = (formData[`wassce_sitting_${sit}_year_sat`] || '').toString().trim();
                const statementMeta = filesMetadata[`question_wassce_sitting_${sit}_statement`];
                const statementFile = files[`question_wassce_sitting_${sit}_statement`];
                const fileOk = !!statementMeta?.file_path || !!statementFile;
                return resultsOk && pin && num && school && dist && country && year && fileOk;
            }).every(Boolean);
            valid = valid && wassceValid;
        } else if (['Degree','Diploma','Certificate'].includes(String(qualificationType))) {
            const key = String(qualificationType).toLowerCase();
            const grad = (formData[`${key}_graduation_year`] || '').toString().trim();
            const inst = (formData[`${key}_institution_name`] || '').toString().trim();
            const dist = (formData[`${key}_district`] || '').toString().trim();
            const ct = (formData[`${key}_country`] || '').toString().trim();
            if (!(grad && inst && dist && ct)) valid = false;
        }

        setCanProceed(valid);
    };

    const prevStep = () => currentStep > 0 && setCurrentStep(s => s - 1);
    const nextStep = () => {
        if (!canProceed) return;
        if (currentStep < categories.length - 1) {
            setCompletedSteps(prev => [...new Set([...prev, currentStep])]);
            setCurrentStep(s => s + 1);
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
            const fd = new FormData();
            fd.append('formData', JSON.stringify(formData));

            Object.keys(files).forEach(k => {
                if (files[k] && !filesMetadata[k]?.file_path) {
                    fd.append(k, files[k]);
                }
            });

            const res = await api.post('/applicant/application/submit', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSubmittedApplication(res.data.application);
            setApplicationNumber(res.data.application_number || res.data.application?.application_number);
            setIsEditMode(false);
            toast.success('Application submitted');
        } catch (e) {
            console.error(e);
            toast.error('Submit failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditApplication = () => {
        setIsEditMode(true);
        setSubmittedApplication(null);
        setWassceSittings(1);
        setAlevelSittings(1);
        setWassceResults([[]]);
        setAlevelResults([[]]);
        setFormData({});
        setFiles({});
        setFilesMetadata({});
        initializeForm();
    };

    const handlePrint = () => {
        if (!categories.length && !submittedApplication) return;

        // Use submitted application data if available, otherwise use current form data
        const printData = submittedApplication || {
            categories: categories.reduce((acc, cat) => {
                acc[cat.name] = cat.questions
                    .filter(shouldShowQuestion)
                    .map(q => ({
                        question_id: q.id,
                        question_text: q.question_text,
                        answer: formData[`question_${q.id}`] || '',
                        question_type: q.question_type,
                        file_path: filesMetadata[`question_${q.id}`]?.file_path
                    }));
                return acc;
            }, {} as Record<string, any>)
        };

        const html = `
    <html>
      <head>
        <title>Application Print</title>
        <style>
          body { font-family: Arial, sans-serif; font-size:12px; line-height:1.4; color:#111; }
          h1 { font-size:20px; margin-bottom:8px; }
          h2 { background:#f1f5f9; padding:4px 8px; margin-top:18px; font-size:16px; }
          .q { margin:6px 0; }
          .label { font-weight:600; }
          table { border-collapse: collapse; width:100%; margin:8px 0; }
          th, td { border:1px solid #999; padding:4px 6px; font-size:11px; }
          .file-block { border:1px solid #ddd; padding:6px; margin:4px 0; }
          .file-preview img { max-width:260px; max-height:180px; display:block; margin:4px 0; }
          .flex-grid { display:flex; flex-wrap:wrap; gap:8px; }
          .tag { background:#e2e8f0; padding:2px 6px; border-radius:4px; font-size:11px; }
          .answer-text { white-space:pre-wrap; }
          @media print { .page-break { page-break-after:always; } }
        </style>
      </head>
      <body>
        <h1>Application Summary</h1>
        <div><strong>Application ID:</strong> ${applicationNumber || 'Draft'}</div>
        <div><strong>Printed:</strong> ${new Date().toLocaleString()}</div>
        <div><strong>Status:</strong> ${submittedApplication ? 'Submitted' : 'Draft'}</div>
        ${Object.entries(printData.categories).map(([catName, answers]) => `
          <section>
            <h2>${catName}</h2>
            ${answers.map((ans: any) => {
            if (ans.question_type === 'table') {
                const rows = Array.isArray(ans.answer) ? ans.answer :
                    typeof ans.answer === 'string' ? safeJsonParse(ans.answer, []) : [];
                if (!rows.length) return '';

                const question = categories.flatMap(c => c.questions).find(q => q.id === ans.question_id);
                const cols = question?.table_columns || [];

                return `
                      <div class="q">
                        <div class="label">${ans.question_text}</div>
                        <table>
                          <thead>
                            <tr>${cols.map(c => `<th>${c.name}</th>`).join('')}</tr>
                          </thead>
                          <tbody>
                            ${rows.map((row: any) => `
                              <tr>${cols.map(c => `<td>${(row[c.name] || '').toString().replace(/</g,'&lt;')}</td>`).join('')}</tr>
                            `).join('')}
                          </tbody>
                        </table>
                      </div>
                    `;
            }

            if (ans.question_type === 'multiple_select') {
                const arr = Array.isArray(ans.answer) ? ans.answer :
                    typeof ans.answer === 'string' ? ans.answer.split(',').map(s => s.trim()) : [];
                return `
                      <div class="q">
                        <div class="label">${ans.question_text}</div>
                        <div class="flex-grid">
                          ${arr.map(item => `<span class="tag">${item.replace(/</g,'&lt;')}</span>`).join('')}
                        </div>
                      </div>
                    `;
            }

            if (ans.question_type === 'file') {
                const meta = filesMetadata[`question_${ans.question_id}`];
                const fUrl = resolveFileUrl(meta);

                if (!meta && !ans.file_path) return `
                      <div class="q">
                        <div class="label">${ans.question_text}</div>
                        <div>No file uploaded</div>
                      </div>
                    `;

                const fileUrl = ans.file_path || fUrl;
                const fileName = meta?.original_name || extractFilename(ans.file_path || '');
                const embed = fileUrl && isImage(fileName) ?
                    `<div class="file-preview"><img src="${fileUrl}" alt="${fileName}"/></div>` : '';

                return `
                      <div class="q">
                        <div class="label">${ans.question_text}</div>
                        <div class="file-block">
                          <div><strong>File:</strong> ${fileName}</div>
                          ${embed}
                        </div>
                      </div>
                    `;
            }

            return `
                  <div class="q">
                    <div class="label">${ans.question_text}</div>
                    <div class="answer-text">${(ans.answer || '').toString().replace(/</g,'&lt;')}</div>
                  </div>
                `;
        }).join('')}
          </section>
        `).join('')}
      </body>
    </html>
    `;

        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 400);
    };

    const handleInputChange = (questionId: number | string, value: any) => {
        setFormData(prev => ({ ...prev, [`question_${questionId}`]: value }));
    };

    const handleQualificationChange = (questionId: number, value: string) => {
        handleInputChange(questionId, value);
        setWassceSittings(1);
        setAlevelSittings(1);
        setWassceResults([[]]);
        setAlevelResults([[]]);
        setFormData(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(k => {
                if (k.startsWith('wassce_') || k.startsWith('alevel_') || k.startsWith('degree_') ||
                    k.startsWith('diploma_') || k.startsWith('certificate_')) delete next[k];
            });
            return next;
        });
        setFiles(prev => {
            const nf = { ...prev };
            Object.keys(nf).forEach(k => {
                if (k.includes('_wassce_') || k.includes('_alevel_') || k.includes('_degree_') ||
                    k.includes('_diploma_') || k.includes('_certificate_')) delete nf[k];
            });
            return nf;
        });
        setFilesMetadata(prev => {
            const nm = { ...prev };
            Object.keys(nm).forEach(k => {
                if (k.includes('_wassce_') || k.includes('_alevel_') || k.includes('_degree_') ||
                    k.includes('_diploma_') || k.includes('_certificate_')) delete nm[k];
            });
            return nm;
        });
    };

    const handleSittingsChange = (type: 'WASSCE' | 'A-Level', sittings: number) => {
        if (type === 'WASSCE') {
            setWassceSittings(sittings);
            setWassceResults(Array.from({ length: sittings }, () => []));
        } else {
            setAlevelSittings(sittings);
            setAlevelResults(Array.from({ length: sittings }, () => []));
        }
    };

    const addSubjectGrade = (type: 'WASSCE' | 'A-Level', sittingIndex: number) => {
        if (type === 'WASSCE') {
            const copy = [...wassceResults];
            copy[sittingIndex] = [...(copy[sittingIndex] || []), { subject: '', grade: '' }];
            setWassceResults(copy);
            setFormData(prev => ({ ...prev, [`wassce_results_sitting_${sittingIndex + 1}`]: copy[sittingIndex] }));
        } else {
            const copy = [...alevelResults];
            copy[sittingIndex] = [...(copy[sittingIndex] || []), { subject: '', grade: '' }];
            setAlevelResults(copy);
            setFormData(prev => ({ ...prev, [`alevel_results_sitting_${sittingIndex + 1}`]: copy[sittingIndex] }));
        }
    };

    const updateSubjectGrade = (
        type: 'WASSCE' | 'A-Level',
        sittingIndex: number,
        resultIndex: number,
        field: 'subject' | 'grade',
        value: string
    ) => {
        if (type === 'WASSCE') {
            const copy = [...wassceResults];
            if (!copy[sittingIndex]) copy[sittingIndex] = [];
            if (!copy[sittingIndex][resultIndex]) copy[sittingIndex][resultIndex] = { subject: '', grade: '' };
            copy[sittingIndex][resultIndex][field] = value;
            setWassceResults(copy);
            setFormData(prev => ({ ...prev, [`wassce_results_sitting_${sittingIndex + 1}`]: copy[sittingIndex] }));
        } else {
            const copy = [...alevelResults];
            if (!copy[sittingIndex]) copy[sittingIndex] = [];
            if (!copy[sittingIndex][resultIndex]) copy[sittingIndex][resultIndex] = { subject: '', grade: '' };
            copy[sittingIndex][resultIndex][field] = value;
            setAlevelResults(copy);
            setFormData(prev => ({ ...prev, [`alevel_results_sitting_${sittingIndex + 1}`]: copy[sittingIndex] }));
        }
    };

    const removeSubjectGrade = (type: 'WASSCE' | 'A-Level', sittingIndex: number, resultIndex: number) => {
        if (type === 'WASSCE') {
            const copy = [...wassceResults];
            copy[sittingIndex] = copy[sittingIndex].filter((_, i) => i !== resultIndex);
            setWassceResults(copy);
            setFormData(prev => ({ ...prev, [`wassce_results_sitting_${sittingIndex + 1}`]: copy[sittingIndex] }));
        } else {
            const copy = [...alevelResults];
            copy[sittingIndex] = copy[sittingIndex].filter((_, i) => i !== resultIndex);
            setAlevelResults(copy);
            setFormData(prev => ({ ...prev, [`alevel_results_sitting_${sittingIndex + 1}`]: copy[sittingIndex] }));
        }
    };

    const validateFileSize = (file: File): boolean => {
        const max = 10 * 1024 * 1024;
        if (file.size > max) {
            toast.error(`File "${file.name}" too large (max 10MB)`);
            return false;
        }
        return true;
    };

    // const handleFileChange = async (questionId: number | string, file: File) => {
    //     if (!validateFileSize(file)) return;
    //
    //     const key = `question_${questionId}`;
    //
    //     try {
    //         const fd = new FormData();
    //         fd.append('file', file);
    //
    //         const response = await api.post('/applicant/application/upload-file', fd, {
    //             headers: { 'Content-Type': 'multipart/form-data' }
    //         });
    //
    //         if (response.data.success && response.data.file_metadata) {
    //             const metadata = response.data.file_metadata;
    //
    //             setFilesMetadata(prev => ({
    //                 ...prev,
    //                 [key]: metadata
    //             }));
    //
    //             setFormData(prev => ({
    //                 ...prev,
    //                 [key]: metadata.original_name
    //             }));
    //
    //             setFiles(prev => {
    //                 const newFiles = { ...prev };
    //                 delete newFiles[key];
    //                 return newFiles;
    //             });
    //
    //             toast.success(`File "${file.name}" uploaded successfully`);
    //         }
    //     } catch (error) {
    //         console.error('File upload error:', error);
    //         setFiles(prev => ({ ...prev, [key]: file }));
    //         setFilesMetadata(prev => ({
    //             ...prev,
    //             [key]: {
    //                 filename: file.name,
    //                 original_name: file.name
    //             }
    //         }));
    //         setFormData(prev => ({ ...prev, [key]: file.name }));
    //         toast.warning(`File "${file.name}" queued for upload`);
    //     }
    // };
    const handleFileChange = async (questionId: number | string, file: File) => {
        if (!validateFileSize(file)) return;

        const key = typeof questionId === 'number' ? `question_${questionId}` : `question_${questionId}`;

        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('question_key', key); // Send the question key

            const response = await api.post('/applicant/application/upload-file', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success && response.data.file_metadata) {
                const metadata = response.data.file_metadata;

                setFilesMetadata(prev => ({
                    ...prev,
                    [key]: metadata
                }));

                setFormData(prev => ({
                    ...prev,
                    [key]: metadata.original_name
                }));

                // Remove from local files since it's uploaded
                setFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles[key];
                    return newFiles;
                });

                toast.success(`File "${file.name}" uploaded successfully`);
            }
        } catch (error) {
            console.error('File upload error:', error);
            // Fallback to local storage
            setFiles(prev => ({ ...prev, [key]: file }));
            setFilesMetadata(prev => ({
                ...prev,
                [key]: {
                    filename: file.name,
                    original_name: file.name
                }
            }));
            setFormData(prev => ({ ...prev, [key]: file.name }));
            toast.warning(`File "${file.name}" queued for upload`);
        }
    };

    const removeFile = (questionId: number | string) => {
        const key = `question_${questionId}`;
        setFiles(prev => {
            const n = { ...prev }; delete n[key]; return n;
        });
        setFilesMetadata(prev => {
            const n = { ...prev }; delete n[key]; return n;
        });
        setFormData(prev => {
            const n = { ...prev }; delete n[key]; return n;
        });
    };

    const handleTableInputChange = (questionId: number, rowIndex: number, columnName: string, value: string) => {
        const key = `question_${questionId}`;
        const current = Array.isArray(formData[key]) ? ([...(formData[key] as TableRowData[])] as TableRowData[]) : [];
        if (!current[rowIndex]) current[rowIndex] = {};
        current[rowIndex][columnName] = value;
        setFormData(prev => ({ ...prev, [key]: current }));
    };

    const addTableRow = (questionId: number, columns: Array<{ name: string }>) => {
        const key = `question_${questionId}`;
        const current = Array.isArray(formData[key]) ? ([...(formData[key] as TableRowData[])] as TableRowData[]) : [];
        const qDef = categories.flatMap(c => c.questions).find(q => q.id === questionId);
        const isEmployment = qDef?.question_text.toLowerCase().includes('employment history');
        if (isEmployment && current.length >= 3) {
            toast.error('Maximum 3 employment entries');
            return;
        }
        const newRow: TableRowData = {};
        columns.forEach(c => (newRow[c.name] = ''));
        setFormData(prev => ({ ...prev, [key]: [...current, newRow] }));
    };

    const removeTableRow = (questionId: number, rowIndex: number) => {
        const key = `question_${questionId}`;
        const current = Array.isArray(formData[key]) ? ([...(formData[key] as TableRowData[])] as TableRowData[]) : [];
        setFormData(prev => ({ ...prev, [key]: current.filter((_, i) => i !== rowIndex) }));
    };

    const handleFilePreview = (file: File | string | undefined) => {
        if (!file) return;
        if (file instanceof File) {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('image/') ? 'image' : (file.type === 'application/pdf' ? 'pdf' : 'other');
            setPreviewFile({ url, type, name: file.name });
        } else {
            const url = file;
            const lower = url.toLowerCase();
            const type = lower.endsWith('.pdf') ? 'pdf' : (/\.(png|jpe?g|gif|webp|svg)$/.test(lower) ? 'image' : 'other');
            setPreviewFile({ url, type, name: extractFilename(url) });
        }
    };

    const renderWassceSection = (sit: number, idx: number, resultList: QualificationResult[]) => {
        const statementMeta = filesMetadata[`question_wassce_sitting_${sit}_statement`];
        const statementFile = files[`question_wassce_sitting_${sit}_statement`];

        return (
            <div key={sit} className="border rounded-lg p-4 space-y-4">
                <div className="font-semibold">Sitting {sit}</div>
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor={`wassce_pin_${sit}`}>Scratch Card PIN</Label>
                        <Input
                            id={`wassce_pin_${sit}`}
                            placeholder="Enter PIN"
                            value={formData[`wassce_sitting_${sit}_scratch_card_pin`] || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    [`wassce_sitting_${sit}_scratch_card_pin`]: value
                                }));
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`wassce_number_${sit}`}>Scratch Card Number</Label>
                        <Input
                            id={`wassce_number_${sit}`}
                            placeholder="Enter Number"
                            value={formData[`wassce_sitting_${sit}_scratch_card_number`] || ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFormData(prev => ({
                                    ...prev,
                                    [`wassce_sitting_${sit}_scratch_card_number`]: value
                                }));
                            }}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`wassce_year_${sit}`}>Year Sat</Label>
                    <Input
                        id={`wassce_year_${sit}`}
                        placeholder="e.g., 2023"
                        value={formData[`wassce_sitting_${sit}_year_sat`] || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({
                                ...prev,
                                [`wassce_sitting_${sit}_year_sat`]: value
                            }));
                        }}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`wassce_school_${sit}`}>School Name</Label>
                    <Input
                        id={`wassce_school_${sit}`}
                        placeholder="Enter School Name"
                        value={formData[`wassce_sitting_${sit}_school_name`] || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({
                                ...prev,
                                [`wassce_sitting_${sit}_school_name`]: value
                            }));
                        }}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`wassce_district_${sit}`}>District</Label>
                    <Input
                        id={`wassce_district_${sit}`}
                        placeholder="Enter District"
                        value={formData[`wassce_sitting_${sit}_district`] || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({
                                ...prev,
                                [`wassce_sitting_${sit}_district`]: value
                            }));
                        }}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`wassce_country_${sit}`}>Country</Label>
                    <Input
                        id={`wassce_country_${sit}`}
                        placeholder="Enter Country"
                        value={formData[`wassce_sitting_${sit}_country`] || ''}
                        onChange={(e) => {
                            const value = e.target.value;
                            setFormData(prev => ({
                                ...prev,
                                [`wassce_sitting_${sit}_country`]: value
                            }));
                        }}
                    />
                </div>
            </div>
        <div>
            <div className="flex items-center justify-between mb-2">
                <Label>Subjects & Grades</Label>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addSubjectGrade('WASSCE', idx)}
                >
                    <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
            </div>
            <div className="space-y-3">
                {resultList.map((r, i) => (
                    <div key={i} className="flex gap-2 items-center">
                        <Select
                            value={r.subject}
                            onValueChange={v => updateSubjectGrade('WASSCE', idx, i, 'subject', v)}
                        >
                            <SelectTrigger className="w-56"><SelectValue placeholder="Subject" /></SelectTrigger>
                            <SelectContent>
                                {WASSCE_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select
                            value={r.grade}
                            onValueChange={v => updateSubjectGrade('WASSCE', idx, i, 'grade', v)}
                        >
                            <SelectTrigger className="w-32"><SelectValue placeholder="Grade" /></SelectTrigger>
                            <SelectContent>
                                {WASSCE_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeSubjectGrade('WASSCE', idx, i)}
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                    </div>
                ))}
                {!resultList.length && <div className="text-sm text-muted-foreground">No subjects added yet.</div>}
            </div>
        </div>
        <div className="space-y-2">
            <Label>Statement of Results (Image/PDF)</Label>
            <div className="flex items-center gap-4">
                <Input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) handleFileChange(`wassce_sitting_${sit}_statement`, f);
                    }}
                />
                {(statementFile || statementMeta) && (
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleFilePreview(statementMeta?.file_path || statementFile)}
                        >
                            <Eye className="w-4 h-4 mr-1" /> Preview
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFile(`wassce_sitting_${sit}_statement`)}
                        >
                            <X className="w-4 h-4 mr-1" /> Remove
                        </Button>
                    </div>
                )}
            </div>
            {statementMeta?.file_path && !statementFile && (
                <div className="text-xs text-green-600">
                    Existing file: {statementMeta.original_name}
                </div>
            )}
        </div>
    </div>
    );
    };

    const renderQualificationResults = (question: Question) => {
        const qualificationType = formData[`question_${question.id}`];
        if (qualificationType === 'WASSCE') {
            return (
                <div className="mt-4 space-y-6">
                    <div className="space-y-2">
                        <Label>Number of Sittings (max 2)</Label>
                        <Select
                            value={String(wassceSittings)}
                            onValueChange={v => handleSittingsChange('WASSCE', parseInt(v, 10))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                {[1,2].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {Array.from({ length: wassceSittings }, (_, idx) => {
                        const sit = idx + 1;
                        const resultList = wassceResults[idx] || [];
                        return renderWassceSection(sit, idx, resultList);
                    })}
                </div>
            );
        }
        if (qualificationType === 'A-Level') {
            return (
                <div className="mt-4 space-y-6">
                    <div className="space-y-2">
                        <Label>Number of Sittings (max 3)</Label>
                        <Select
                            value={String(alevelSittings)}
                            onValueChange={v => handleSittingsChange('A-Level', parseInt(v, 10))}
                        >
                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                                {[1,2,3].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {Array.from({ length: alevelSittings }, (_, idx) => {
                        const sit = idx + 1;
                        const resultList = alevelResults[idx] || [];
                        return (
                            <div key={sit} className="border rounded-lg p-4 space-y-4">
                                <div className="font-semibold">Sitting {sit}</div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <Label>Subjects & Grades</Label>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => addSubjectGrade('A-Level', idx)}
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {resultList.map((r, i) => (
                                            <div key={i} className="flex gap-2 items-center">
                                                <Select
                                                    value={r.subject}
                                                    onValueChange={v => updateSubjectGrade('A-Level', idx, i, 'subject', v)}
                                                >
                                                    <SelectTrigger className="w-56"><SelectValue placeholder="Subject" /></SelectTrigger>
                                                    <SelectContent>
                                                        {A_LEVEL_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={r.grade}
                                                    onValueChange={v => updateSubjectGrade('A-Level', idx, i, 'grade', v)}
                                                >
                                                    <SelectTrigger className="w-32"><SelectValue placeholder="Grade" /></SelectTrigger>
                                                    <SelectContent>
                                                        {A_LEVEL_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removeSubjectGrade('A-Level', idx, i)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        ))}
                                        {!resultList.length && <div className="text-sm text-muted-foreground">No subjects added yet.</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }
        if (['Degree','Diploma','Certificate'].includes(String(qualificationType))) {
            const qualKey = String(qualificationType).toLowerCase();
            const certMeta = filesMetadata[`question_${qualKey}_certificate`];
            const certFile = files[`question_${qualKey}_certificate`];
            const testMeta = filesMetadata[`question_${qualKey}_testimonial`];
            const testFile = files[`question_${qualKey}_testimonial`];
            return (
                <div className="mt-4 space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            placeholder="Institution Name"
                            value={formData[`${qualKey}_institution_name`] || ''}
                            onChange={e => handleInputChange(`${qualKey}_institution_name`, e.target.value)}
                        />
                        <Input
                            placeholder="District"
                            value={formData[`${qualKey}_district`] || ''}
                            onChange={e => handleInputChange(`${qualKey}_district`, e.target.value)}
                        />
                        <Input
                            placeholder="Country"
                            value={formData[`${qualKey}_country`] || ''}
                            onChange={e => handleInputChange(`${qualKey}_country`, e.target.value)}
                        />
                        <Input
                            placeholder="Graduation Year"
                            value={formData[`${qualKey}_graduation_year`] || ''}
                            onChange={e => handleInputChange(`${qualKey}_graduation_year`, e.target.value)}
                        />
                    </div>
                    <div className="space-y-3">
                        <Label>Certificate (Image/PDF)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileChange(`${qualKey}_certificate`, f);
                                }}
                            />
                            {(certFile || certMeta) && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleFilePreview(certMeta?.file_path || certFile)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> Preview
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeFile(`${qualKey}_certificate`)}
                                    >
                                        <X className="w-4 h-4 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                        </div>
                        {certMeta?.file_path && !certFile && <div className="text-xs text-green-600">Existing file: {certMeta.original_name}</div>}
                    </div>
                    <div className="space-y-3">
                        <Label>Testimonial (Image/PDF)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="file"
                                accept=".pdf,image/*"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileChange(`${qualKey}_testimonial`, f);
                                }}
                            />
                            {(testFile || testMeta) && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleFilePreview(testMeta?.file_path || testFile)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> Preview
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => removeFile(`${qualKey}_testimonial`)}
                                    >
                                        <X className="w-4 h-4 mr-1" /> Remove
                                    </Button>
                                </div>
                            )}
                        </div>
                        {testMeta?.file_path && !testFile && <div className="text-xs text-green-600">Existing file: {testMeta.original_name}</div>}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderField = (question: Question) => {
        const value = formData[`question_${question.id}`];
        const fieldId = `question_${question.id}`;
        const safeOptions: string[] = Array.isArray(question.options)
            ? question.options as string[]
            : typeof question.options === 'string'
                ? safeJsonParse<string[]>(question.options as string, [])
                : [];
        const isQualificationType =
            question.question_text.toLowerCase().includes('qualification type') ||
            question.question_text.toLowerCase().includes('certificate type');

        switch (question.question_type) {
            case 'text':
            case 'email':
            case 'phone':
            case 'tel':
            case 'date':
            case 'number':
                return (
                    <Input
                        type={question.question_type === 'text' ? 'text' : question.question_type === 'phone' ? 'tel' : question.question_type}
                        value={value || ''}
                        onChange={e => handleInputChange(question.id, e.target.value)}
                        placeholder={question.question_text}
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        value={value || ''}
                        onChange={e => handleInputChange(question.id, e.target.value)}
                        placeholder={question.question_text}
                    />
                );
            case 'single_select':
                return (
                    <div className="space-y-2">
                        <Select
                            value={value || ''}
                            onValueChange={v => {
                                if (isQualificationType) handleQualificationChange(question.id, v);
                                else handleInputChange(question.id, v);
                            }}
                        >
                            <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                            <SelectContent>
                                {safeOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        {isQualificationType && renderQualificationResults(question)}
                    </div>
                );
            case 'multiple_select': {
                const selectedValues: string[] = Array.isArray(value) ? value : [];
                return (
                    <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                            {safeOptions.map(opt => {
                                const checked = selectedValues.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                            let next: string[];
                                            if (checked) next = selectedValues.filter(v => v !== opt);
                                            else next = [...selectedValues, opt];
                                            handleInputChange(question.id, next);
                                        }}
                                        className={`px-3 py-1 rounded border text-sm ${checked ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            }
            case 'file': {
                const selectedFile = files[fieldId];
                const existingFile = filesMetadata[fieldId];
                return (
                    <div className="space-y-3">
                        <Input
                            type="file"
                            onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) handleFileChange(question.id, f);
                            }}
                        />
                        {(selectedFile || existingFile) && (
                            <div className="flex items-center gap-3 flex-wrap">
                                {selectedFile && (
                                    <div className="flex items-center gap-2 bg-yellow-100 px-2 py-1 rounded">
                                        <FileIcon className="w-4 h-4" />
                                        <span className="text-xs">{selectedFile.name}</span>
                                        <span className="text-xs text-orange-600">(Uploading...)</span>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleFilePreview(selectedFile)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeFile(question.id)}
                                        >
                                            <X className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                )}
                                {!selectedFile && existingFile && (
                                    <div className="flex items-center gap-2 bg-emerald-50 px-2 py-1 rounded">
                                        <FileIcon className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs">{existingFile.original_name}</span>
                                        <span className="text-xs text-green-600">✓ Uploaded</span>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleFilePreview(existingFile.file_path || existingFile.filename)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => removeFile(question.id)}
                                        >
                                            <X className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            }
            case 'table': {
                const tableData: TableRowData[] = Array.isArray(value) ? value : [];
                const columns = question.table_columns || [];
                const isEmployment = question.question_text.toLowerCase().includes('employment history');
                return (
                    <div className="space-y-4">
                        <div className="overflow-x-auto border rounded">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {columns.map(c => (
                                            <TableHead key={c.id}>
                                                {c.name} {c.is_required && <span className="text-red-500">*</span>}
                                            </TableHead>
                                        ))}
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableData.map((row, rowIdx) => (
                                        <TableRow key={rowIdx}>
                                            {columns.map(c => (
                                                <TableCell key={c.id}>
                                                    {c.type === 'select' && c.options ? (
                                                        <Select
                                                            value={row[c.name] || ''}
                                                            onValueChange={v => handleTableInputChange(question.id, rowIdx, c.name, v)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={`Select ${c.name}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {(Array.isArray(c.options) ? c.options : []).map(opt => (
                                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : c.type === 'textarea' ? (
                                                        <Textarea
                                                            value={row[c.name] || ''}
                                                            onChange={e => handleTableInputChange(question.id, rowIdx, c.name, e.target.value)}
                                                            placeholder={c.name}
                                                        />
                                                    ) : (
                                                        <Input
                                                            value={row[c.name] || ''}
                                                            onChange={e => handleTableInputChange(question.id, rowIdx, c.name, e.target.value)}
                                                            placeholder={c.name}
                                                        />
                                                    )}
                                                </TableCell>
                                            ))}
                                            <TableCell>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removeTableRow(question.id, rowIdx)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!tableData.length && (
                                        <TableRow>
                                            <TableCell colSpan={columns.length + 1} className="text-center text-sm text-muted-foreground">
                                                No entries
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addTableRow(question.id, columns.map(c => ({ name: c.name })))}
                            disabled={isEmployment && tableData.length >= 3}
                        >
                            <Plus className="w-4 h-4 mr-1" /> Add Row
                        </Button>
                    </div>
                );
            }
            default:
                return (
                    <Input
                        value={value || ''}
                        onChange={e => handleInputChange(question.id, e.target.value)}
                        placeholder={question.question_text}
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
            <div className="max-w-4xl mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div>
                                <div className="text-xl">Submitted Application</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Application ID: {applicationNumber || submittedApplication.application_number || submittedApplication.id}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handlePrint}>
                                    <Printer className="w-4 h-4 mr-1" /> Print
                                </Button>
                                <Button variant="secondary" size="sm" onClick={handleEditApplication}>
                                    <Edit className="w-4 h-4 mr-1" /> Edit Application
                                </Button>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent ref={printRef} className="space-y-8">
                        {Object.entries(submittedApplication.categories).map(([cat, answers]) => (
                            <div key={cat}>
                                <h2 className="font-semibold text-lg mb-3">{cat}</h2>
                                <div className="space-y-4">
                                    {answers.map(a => {
                                        const question = categories
                                            .flatMap(c => c.questions)
                                            .find(q => q.id === a.question_id);
                                        return (
                                            <div key={a.question_id} className="border rounded p-3">
                                                <div className="text-sm font-medium mb-1">{a.question_text}</div>
                                                {a.question_type === 'file' && a.file_path ? (
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleFilePreview(a.file_path)}
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" /> View
                                                        </Button>
                                                        <span className="text-xs break-all">{extractFilename(a.file_path)}</span>
                                                    </div>
                                                ) : a.question_type === 'multiple_select' ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {safeJsonParse<string[]>(a.answer, []).map(v => (
                                                            <span key={v} className="px-2 py-0.5 rounded bg-gray-100 text-xs">{v}</span>
                                                        ))}
                                                    </div>
                                                ) : a.question_type === 'table' && question ? (
                                                    <div className="overflow-x-auto">
                                                        {(() => {
                                                            const rows = safeJsonParse<TableRowData[]>(a.answer, []);
                                                            if (!rows.length) return <em className="text-xs text-muted-foreground">No rows</em>;
                                                            const cols = question.table_columns || [];
                                                            return (
                                                                <Table className="w-full text-xs border">
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            {cols.map(c => (
                                                                                <TableHead key={c.id} className="border px-1 py-0.5 text-left">{c.name}</TableHead>
                                                                            ))}
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {rows.map((r, i) => (
                                                                            <TableRow key={i}>
                                                                                {cols.map(c => (
                                                                                    <TableCell key={c.id} className="border px-1 py-0.5">{r[c.name] || ''}</TableCell>
                                                                                ))}
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm whitespace-pre-wrap">{a.answer || <span className="text-muted-foreground">—</span>}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Dialog open={!!previewFile?.url} onOpenChange={() => setPreviewFile({ url: '', type: '' })}>
                    <DialogContent className="max-w-4xl">
                        <DialogHeader>
                            <DialogTitle>File Preview</DialogTitle>
                        </DialogHeader>
                        {previewFile.type === 'image' && (
                            <img src={previewFile.url} alt={previewFile.name} className="w-full h-auto max-h-[70vh] object-contain" />
                        )}
                        {previewFile.type === 'pdf' && (
                            <iframe src={previewFile.url} title="File Preview" className="w-full h-[70vh]" />
                        )}
                        {previewFile.url && !['image','pdf'].includes(previewFile.type) && (
                            <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                                Download File
                            </a>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center justify-between">
                        <div>
                            <div>{categories[currentStep]?.name || 'Application Form'}</div>
                            {applicationNumber && (
                                <div className="text-sm text-muted-foreground mt-1">
                                    Application ID: {applicationNumber}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => saveProgress()}
                                disabled={isSaving}
                            >
                                <Save className="w-4 h-4 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handlePrint}
                            >
                                <Printer className="w-4 h-4 mr-1" /> Print
                            </Button>
                        </div>
                    </CardTitle>
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-wrap items-center gap-2">
                            {categories.map((c, i) => {
                                const done = completedSteps.includes(i);
                                const active = i === currentStep;
                                return (
                                    <button
                                        key={c.name}
                                        onClick={() => goToStep(i)}
                                        className={`px-3 py-1 rounded text-xs font-medium border flex items-center gap-1
                      ${active ? 'bg-blue-600 text-white border-blue-600'
                                            : done ? 'bg-green-100 text-green-700 border-green-300'
                                                : 'bg-white hover:bg-gray-50'}
                    `}
                                    >
                                        {done ? <Check className="w-3 h-3" /> : i + 1}
                                        <span className="truncate max-w-[110px]">{c.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {lastSaved ? <>Last Saved: {new Date(lastSaved).toLocaleTimeString()}</> : 'Not yet saved'}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <Checkbox
                                    checked={autoSaveEnabled}
                                    onCheckedChange={v => setAutoSaveEnabled(!!v)}
                                    id="autosave"
                                />
                                <label htmlFor="autosave">Auto-Save</label>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6">
                        {categories[currentStep]?.questions
                            .filter(shouldShowQuestion)
                            .map(q => (
                                <div key={q.id} className="space-y-2">
                                    <Label className="font-medium text-sm flex items-center gap-1">
                                        {q.question_text}
                                        {q.is_required && <span className="text-red-500">*</span>}
                                    </Label>
                                    {renderField(q)}
                                </div>
                            ))}
                    </form>
                    <div className="flex justify-between mt-8">
                        <Button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 0}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>
                        {currentStep < categories.length - 1 ? (
                            <Button
                                type="button"
                                onClick={nextStep}
                                disabled={!canProceed}
                                className="flex items-center gap-2"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                disabled={!canProceed || isSubmitting}
                                onClick={submitApplication}
                                className="flex items-center gap-2"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                {!isSubmitting && <Check className="w-4 h-4" />}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!previewFile?.url} onOpenChange={() => setPreviewFile({ url: '', type: '' })}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>File Preview</DialogTitle>
                    </DialogHeader>
                    {previewFile.type === 'image' && (
                        <img
                            src={previewFile.url}
                            alt={previewFile.name}
                            className="w-full h-auto max-h-[70vh] object-contain"
                        />
                    )}
                    {previewFile.type === 'pdf' && (
                        <iframe src={previewFile.url} title="File Preview" className="w-full h-[70vh]" />
                    )}
                    {previewFile.url && !['image','pdf'].includes(previewFile.type) && (
                        <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">
                            Download File
                        </a>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}