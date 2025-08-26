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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
    Trash2,
    AlertCircle,
    CheckCircle2,
    FileText,
    Image,
    User,
    GraduationCap,
    Briefcase,
    DollarSign,
    FileCheck,
    Home,
    School,
    Info,
    Loader2,
    Download,
    Shield,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

// Category icons mapping
const CATEGORY_ICONS: Record<string, any> = {
    'Personal Information': User,
    'Academic History': GraduationCap,
    'Academic Qualifications': School,
    'Employment History': Briefcase,
    'Financial Information': DollarSign,
    'Documents': FileText,
    'Additional Information': Info,
    'Review & Submit': FileCheck
};

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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
                if (showNotification) toast.success('Progress saved successfully! ✨');
            } catch (error) {
                console.error('Save progress error:', error);
                if (showNotification) toast.error('Failed to save progress');
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
                qualificationQuestion.options = ['WASSCE', 'A-Level', 'Degree', 'Diploma', 'Certificate'];
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

            // Handle Edit Mode
            if (isEditMode && submittedApp) {
                console.log('Edit mode - loading submitted application:', submittedApp);
                setApplicationNumber(submittedApp.application_number || null);

                Object.values(submittedApp.categories).forEach(answerArr => {
                    answerArr.forEach(ans => {
                        const key = `question_${ans.question_id}`;
                        console.log(`Processing submitted answer for ${key}:`, ans);

                        if (ans.question_type === 'file') {
                            if (ans.answer) {
                                initialFormData[key] = ans.answer;
                            }
                        } else if (ans.question_type === 'multiple_select') {
                            let parsed: any = [];
                            if (ans.answer?.trim().startsWith('[')) {
                                parsed = safeJsonParse(ans.answer, [], `multiple_select_${key}`);
                            } else if (ans.answer?.includes(',')) {
                                parsed = ans.answer.split(',').map(s => s.trim()).filter(Boolean);
                            } else if (ans.answer) {
                                parsed = [ans.answer];
                            }
                            initialFormData[key] = parsed;
                        } else if (ans.question_type === 'table') {
                            const parsed = safeJsonParse<TableRowData[]>(ans.answer, [], `table_${key}`);
                            initialFormData[key] = parsed;
                        } else {
                            initialFormData[key] = ans.answer;
                        }
                    });
                });

                console.log('Edit mode - initial formData from submitted app:', initialFormData);

                if (draftResponse.data?.draft?.filesMetadata) {
                    const draft = draftResponse.data.draft;
                    console.log('Edit mode - loading file metadata from draft:', draft.filesMetadata);

                    try {
                        let cleanedString = draft.filesMetadata;
                        if (typeof cleanedString === 'string') {
                            cleanedString = cleanedString.replace(/\\\//g, '/');
                        }

                        const parsedFilesMetadata = JSON.parse(cleanedString);
                        console.log('Edit mode - parsed file metadata:', parsedFilesMetadata);

                        if (typeof parsedFilesMetadata === 'object' && parsedFilesMetadata !== null) {
                            Object.entries(parsedFilesMetadata).forEach(([key, meta]: [string, any]) => {
                                if (meta && typeof meta === 'object' && meta.original_name) {
                                    const normalizedMeta: FileMeta = {
                                        filename: meta.filename || extractFilename(meta.file_path || ''),
                                        original_name: meta.original_name,
                                        file_path: meta.file_path || '',
                                        size: meta.size || 0,
                                        type: meta.type || '',
                                        uploaded_at: meta.uploaded_at || ''
                                    };

                                    initialFilesMetadata[key] = normalizedMeta;
                                    initialFormData[key] = normalizedMeta.original_name;

                                    console.log(`Edit mode - set file metadata for ${key}:`, normalizedMeta);
                                }
                            });
                        }
                    } catch (parseError) {
                        console.error('Edit mode - file metadata parsing failed:', parseError);
                    }
                }

                console.log('Edit mode - final initialFormData:', initialFormData);
                console.log('Edit mode - final initialFilesMetadata:', initialFilesMetadata);

                const qualificationQuestion = questions.find(q =>
                    q.question_text.toLowerCase().includes('qualification type') ||
                    q.question_text.toLowerCase().includes('certificate type')
                );
                const qualificationType = qualificationQuestion ? initialFormData[`question_${qualificationQuestion.id}`] : undefined;

                if (qualificationType === 'WASSCE') {
                    const wassceKeys = Object.keys(initialFormData).filter(k => k.startsWith('wassce_'));
                    const resultKeys = wassceKeys.filter(k => k.includes('results_sitting_'));
                    const sittingKeys = wassceKeys.filter(k => k.includes('sitting_') && !k.includes('results_sitting_'));

                    if (resultKeys.length > 0) {
                        const maxSitting = Math.max(...resultKeys.map(k => parseInt(k.split('_')[3], 10)));
                        setWassceSittings(maxSitting);
                        const restoredResults = Array.from({ length: maxSitting }, (_, idx) => {
                            const data = initialFormData[`wassce_results_sitting_${idx + 1}`];
                            if (Array.isArray(data)) return data as QualificationResult[];
                            if (typeof data === 'string') return safeJsonParse<QualificationResult[]>(data, [], `wassce_sitting_${idx + 1}`);
                            return [];
                        });
                        setWassceResults(restoredResults);
                        console.log('Edit mode - restored WASSCE results:', restoredResults);
                    }

                    console.log('Edit mode - WASSCE sitting fields found:', sittingKeys);

                } else if (qualificationType === 'A-Level') {
                    const alevelKeys = Object.keys(initialFormData).filter(k => k.startsWith('alevel_results_sitting_'));
                    if (alevelKeys.length > 0) {
                        const maxSitting = Math.max(...alevelKeys.map(k => parseInt(k.split('_')[3], 10)));
                        setAlevelSittings(maxSitting);
                        const restoredResults = Array.from({ length: maxSitting }, (_, idx) => {
                            const data = initialFormData[`alevel_results_sitting_${idx + 1}`];
                            if (Array.isArray(data)) return data as QualificationResult[];
                            if (typeof data === 'string') return safeJsonParse<QualificationResult[]>(data, [], `alevel_sitting_${idx + 1}`);
                            return [];
                        });
                        setAlevelResults(restoredResults);
                        console.log('Edit mode - restored A-Level results:', restoredResults);
                    }
                }
            }
            // Handle Draft Mode
            else if (draftResponse.data?.draft) {
                const draft = draftResponse.data.draft;

                console.log('Raw draft data:', draft);

                if (draft.formData) {
                    console.log('Raw formData:', draft.formData);
                    const parsedFormData = safeJsonParse<FormState>(draft.formData, {});
                    if (Array.isArray(parsedFormData)) {
                        initialFormData = {};
                    } else {
                        initialFormData = parsedFormData;
                    }
                    console.log('Parsed formData:', initialFormData);
                }

                if (draft.filesMetadata) {
                    console.log('Raw filesMetadata string:', draft.filesMetadata);
                    console.log('Type of filesMetadata:', typeof draft.filesMetadata);

                    try {
                        let cleanedString = draft.filesMetadata;

                        if (typeof cleanedString === 'string') {
                            cleanedString = cleanedString.replace(/\\\//g, '/');
                            console.log('Cleaned filesMetadata string:', cleanedString);
                        }

                        const parsedFilesMetadata = JSON.parse(cleanedString);
                        console.log('Successfully parsed filesMetadata:', parsedFilesMetadata);
                        console.log('Keys found:', Object.keys(parsedFilesMetadata));

                        if (typeof parsedFilesMetadata === 'object' && parsedFilesMetadata !== null) {
                            Object.entries(parsedFilesMetadata).forEach(([key, meta]: [string, any]) => {
                                console.log(`Processing file metadata for key: ${key}`, meta);

                                if (meta && typeof meta === 'object' && meta.original_name) {
                                    const normalizedMeta: FileMeta = {
                                        filename: meta.filename || extractFilename(meta.file_path || ''),
                                        original_name: meta.original_name,
                                        file_path: meta.file_path || '',
                                        size: meta.size || 0,
                                        type: meta.type || '',
                                        uploaded_at: meta.uploaded_at || ''
                                    };

                                    console.log(`Normalized metadata for ${key}:`, normalizedMeta);

                                    initialFilesMetadata[key] = normalizedMeta;
                                    initialFormData[key] = normalizedMeta.original_name;

                                    console.log(`Set formData[${key}] = ${normalizedMeta.original_name}`);
                                } else {
                                    console.warn(`Invalid metadata structure for key ${key}:`, meta);
                                }
                            });

                            console.log('Final initialFilesMetadata object:', initialFilesMetadata);
                            console.log('Number of files loaded:', Object.keys(initialFilesMetadata).length);
                        } else {
                            console.error('Parsed filesMetadata is not a valid object:', parsedFilesMetadata);
                        }

                    } catch (parseError) {
                        console.error('JSON parsing failed:', parseError);
                        console.error('Failed to parse string:', draft.filesMetadata);

                        try {
                            const alternativeParsed = eval('(' + draft.filesMetadata + ')');
                            console.log('Alternative parsing succeeded:', alternativeParsed);
                            initialFilesMetadata = alternativeParsed;
                        } catch (altError) {
                            console.error('Alternative parsing also failed:', altError);
                        }
                    }
                } else {
                    console.log('No filesMetadata found in draft');
                }

                if (draft.currentStep !== undefined) restoredCurrentStep = draft.currentStep;
                if (draft.completedSteps) restoredCompletedSteps = safeJsonParse<number[]>(draft.completedSteps, []);
                if (draft.updated_at) restoredLastSaved = draft.updated_at;
            }

            // Apply profile data mappings
            const profileMappings: Record<string, string[]> = {
                first_name: ['first name'],
                last_name: ['last name'],
                middle_name: ['middle name'],
                email: ['email'],
                phone: ['phone'],
                date_of_birth: ['date of birth', 'dob'],
                gender: ['gender', 'sex'],
                country: ['country', 'nationality'],
                address: ['address', 'residential address']
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

            setFilesMetadata(initialFilesMetadata);
            setFormData(initialFormData);
            setFiles({});

            if (!isEditMode) {
                setCurrentStep(restoredCurrentStep);
                setCompletedSteps(restoredCompletedSteps);
            } else {
                setCurrentStep(0);
                setCompletedSteps([]);
            }

            setLastSaved(restoredLastSaved);

            setTimeout(() => {
                setFilesMetadata(prev => ({ ...prev, ...initialFilesMetadata }));
            }, 100);

            console.log('Initialized formData:', initialFormData);
            console.log('Initialized filesMetadata:', initialFilesMetadata);
            console.log('Files should be visible now:', Object.keys(initialFilesMetadata));

            if (isEditMode) {
                toast.success('Application loaded for editing', {
                    description: 'You can now modify your application',
                    icon: <Edit className="w-4 h-4" />
                });
            } else if (restoredLastSaved) {
                toast.success('Draft restored successfully', {
                    description: 'Your progress has been loaded',
                    icon: <CheckCircle2 className="w-4 h-4" />
                });
            } else {
                toast.success('Application form ready', {
                    description: 'Let\'s get started!',
                    icon: <Sparkles className="w-4 h-4" />
                });
            }

        } catch (e) {
            console.error('Initialization error', e);
            toast.error('Failed to load form', {
                description: 'Please refresh the page and try again'
            });
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
        const errors: Record<string, string> = {};

        let valid = requiredQuestions.every(q => {
            const val = formData[`question_${q.id}`];
            const key = `question_${q.id}`;

            if (q.question_type === 'file') {
                const meta = filesMetadata[key];
                const file = files[key];
                const isValid = !!(meta?.file_path || file);
                if (!isValid) errors[key] = 'File is required';
                return isValid;
            }
            if (q.question_type === 'multiple_select') {
                const isValid = Array.isArray(val) && val.length > 0;
                if (!isValid) errors[key] = 'Please select at least one option';
                return isValid;
            }
            if (q.question_type === 'table') {
                const rows = Array.isArray(val) ? val as TableRowData[] : [];
                const isValid = rows.length > 0 && rows.every(r =>
                    q.table_columns?.every(c => c.is_required ? (r[c.name] ?? '').toString().trim() !== '' : true)
                );
                if (!isValid) errors[key] = 'Please complete all required fields';
                return isValid;
            }
            const isValid = val !== undefined && val !== null && val.toString().trim() !== '';
            if (!isValid) errors[key] = 'This field is required';
            return isValid;
        });

        if (currentCategory.name === 'Academic History') {
            const schoolQ = currentCategory.questions.find(q => q.question_text.toLowerCase().includes('schools attended'));
            if (schoolQ) {
                const rows = formData[`question_${schoolQ.id}`];
                if (!Array.isArray(rows) || rows.length === 0) {
                    valid = false;
                    errors[`question_${schoolQ.id}`] = 'Please add at least one school';
                }
            }
        }
        if (currentCategory.name === 'Additional Information') {
            const refQ = currentCategory.questions.find(q => q.question_text.toLowerCase().includes('references'));
            if (refQ) {
                const rows = formData[`question_${refQ.id}`];
                if (!Array.isArray(rows) || rows.length < 2) {
                    valid = false;
                    errors[`question_${refQ.id}`] = 'Please provide at least 2 references';
                }
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
                        if (!v) {
                            valid = false;
                            errors[`question_${match.id}`] = 'Sponsor information required';
                        }
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

                if (!resultsOk) errors[`wassce_results_${sit}`] = 'Please add subjects and grades';
                if (!pin) errors[`wassce_sitting_${sit}_scratch_card_pin`] = 'PIN required';
                if (!fileOk) errors[`wassce_sitting_${sit}_statement`] = 'Statement required';

                return resultsOk && pin && num && school && dist && country && year && fileOk;
            }).every(Boolean);
            valid = valid && wassceValid;
        } else if (['Degree','Diploma','Certificate'].includes(String(qualificationType))) {
            const key = String(qualificationType).toLowerCase();
            const grad = (formData[`${key}_graduation_year`] || '').toString().trim();
            const inst = (formData[`${key}_institution_name`] || '').toString().trim();
            const dist = (formData[`${key}_district`] || '').toString().trim();
            const ct = (formData[`${key}_country`] || '').toString().trim();
            if (!(grad && inst && dist && ct)) {
                valid = false;
                if (!inst) errors[`${key}_institution_name`] = 'Institution required';
                if (!grad) errors[`${key}_graduation_year`] = 'Graduation year required';
            }
        }

        setFieldErrors(errors);
        setCanProceed(valid);
    };

    const prevStep = () => currentStep > 0 && setCurrentStep(s => s - 1);
    const nextStep = () => {
        if (!canProceed) {
            toast.error('Please complete all required fields', {
                description: 'Check for any missing information'
            });
            return;
        }
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
            toast.success('Application submitted successfully! 🎉', {
                description: 'Your application has been received'
            });
        } catch (e) {
            console.error(e);
            toast.error('Submission failed', {
                description: 'Please try again or contact support'
            });
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
       <title>Application - ${applicationNumber || 'Draft'}</title>
       <style>
         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
         body { 
           font-family: 'Inter', sans-serif; 
           font-size: 12px; 
           line-height: 1.6; 
           color: #1a1a1a;
           max-width: 800px;
           margin: 0 auto;
           padding: 20px;
         }
         .header {
           border-bottom: 3px solid #3b82f6;
           padding-bottom: 20px;
           margin-bottom: 30px;
         }
         h1 { 
           font-size: 28px; 
           font-weight: 700;
           color: #1e293b;
           margin: 0 0 10px 0;
         }
         .meta {
           display: flex;
           gap: 30px;
           font-size: 13px;
           color: #64748b;
         }
         .meta-item {
           display: flex;
           align-items: center;
           gap: 8px;
         }
         .meta-label {
           font-weight: 600;
           color: #475569;
         }
         h2 { 
           background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
           color: white;
           padding: 10px 16px;
           margin-top: 30px;
           font-size: 16px;
           border-radius: 8px;
           font-weight: 600;
         }
         .question-block {
           margin: 16px 0;
           padding: 12px;
           border: 1px solid #e2e8f0;
           border-radius: 6px;
           background: #fafafa;
         }
         .question-label {
           font-weight: 600;
           color: #334155;
           margin-bottom: 6px;
           font-size: 13px;
         }
         .answer {
           color: #1e293b;
           font-size: 12px;
           white-space: pre-wrap;
           word-wrap: break-word;
         }
         .empty-answer {
           color: #94a3b8;
           font-style: italic;
         }
         table { 
           border-collapse: collapse; 
           width: 100%; 
           margin: 12px 0;
           font-size: 11px;
         }
         th { 
           background: #f1f5f9;
           border: 1px solid #cbd5e1;
           padding: 8px;
           text-align: left;
           font-weight: 600;
           color: #475569;
         }
         td { 
           border: 1px solid #e2e8f0;
           padding: 8px;
           color: #1e293b;
         }
         .file-info {
           display: inline-flex;
           align-items: center;
           gap: 8px;
           padding: 6px 12px;
           background: #eff6ff;
           border: 1px solid #3b82f6;
           border-radius: 6px;
           color: #1e40af;
           font-size: 11px;
         }
         .tag {
           display: inline-block;
           background: #e0e7ff;
           color: #3730a3;
           padding: 4px 10px;
           border-radius: 4px;
           font-size: 11px;
           margin: 2px;
         }
         .footer {
           margin-top: 40px;
           padding-top: 20px;
           border-top: 1px solid #e2e8f0;
           text-align: center;
           font-size: 11px;
           color: #64748b;
         }
         @media print { 
           body { padding: 0; }
           .page-break { page-break-after: always; }
           h2 { break-inside: avoid; }
           .question-block { break-inside: avoid; }
         }
         .header-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

.logo {
  width: 80px;
  height: 80px;
}

.header-title {
  font-size: 2rem;
  font-weight: 800;
  text-align: center;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent;
  text-shadow: 2px 2px 5px rgba(0,0,0,0.15);
  letter-spacing: 2px;
}

/* Force gradient colors in print */
@media print {
    .school-header {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        background: linear-gradient(to right, #3b82f6, #8b5cf6, #ec4899) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        text-fill-color: transparent !important;
    }
}
       </style>
     </head>
     <body>
       <div class="header">
       <div class="header-container">
  <img src="https://msn.edu.sl/nursingschoollogo.jpg" alt="MSN" class="logo" />
  <h3 class="header-title">Mattru School of Nursing</h3>
</div>

         <h1>Application Summary</h1>
         <div class="meta">
           <div class="meta-item">
             <span class="meta-label">Application ID:</span>
             <span>${applicationNumber || 'Draft'}</span>
           </div>
           <div class="meta-item">
             <span class="meta-label">Date:</span>
             <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
           </div>
           <div class="meta-item">
             <span class="meta-label">Status:</span>
             <span style="color: ${submittedApplication ? '#10b981' : '#f59e0b'}; font-weight: 600;">
               ${submittedApplication ? '✓ Submitted' : '○ Draft'}
             </span>
           </div>
         </div>
       </div>
       
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
                     <div class="question-block">
                       <div class="question-label">${ans.question_text}</div>
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
                     <div class="question-block">
                       <div class="question-label">${ans.question_text}</div>
                       <div>
                         ${arr.map(item => `<span class="tag">${item.replace(/</g,'&lt;')}</span>`).join('')}
                       </div>
                     </div>
                   `;
            }

            if (ans.question_type === 'file') {
                const meta = filesMetadata[`question_${ans.question_id}`];
                const fileName = meta?.original_name || extractFilename(ans.file_path || '') || 'No file uploaded';

                return `
                     <div class="question-block">
                       <div class="question-label">${ans.question_text}</div>
                       <div class="file-info">
                         📎 ${fileName}
                       </div>
                     </div>
                   `;
            }

            return `
                 <div class="question-block">
                   <div class="question-label">${ans.question_text}</div>
                   <div class="answer">${ans.answer ? (ans.answer.toString().replace(/</g,'&lt;')) : '<span class="empty-answer">Not provided</span>'}</div>
                 </div>
               `;
        }).join('')}
         </section>
       `).join('')}
       
       <div class="footer">
         <p>Generated on ${new Date().toLocaleString()} • Application System v2.0</p>
       </div>
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
        setFieldErrors(prev => {
            const next = { ...prev };
            delete next[`question_${questionId}`];
            return next;
        });
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
            toast.error(`File too large`, {
                description: `"${file.name}" exceeds 10MB limit`
            });
            return false;
        }
        return true;
    };

    const handleFileChange = async (questionId: number | string, file: File) => {
        if (!validateFileSize(file)) return;

        const key = typeof questionId === 'number' ? `question_${questionId}` : `question_${questionId}`;

        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('question_key', key);

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

                setFiles(prev => {
                    const newFiles = { ...prev };
                    delete newFiles[key];
                    return newFiles;
                });

                toast.success('File uploaded', {
                    description: file.name,
                    icon: <CheckCircle2 className="w-4 h-4" />
                });
            }
        } catch (error) {
            console.error('File upload error:', error);
            setFiles(prev => ({ ...prev, [key]: file }));
            setFilesMetadata(prev => ({
                ...prev,
                [key]: {
                    filename: file.name,
                    original_name: file.name
                }
            }));
            setFormData(prev => ({ ...prev, [key]: file.name }));
            toast.warning('File queued for upload', {
                description: 'Will be uploaded when you save'
            });
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

        while (current.length <= rowIndex) {
            current.push({});
        }

        current[rowIndex][columnName] = value;

        setFormData(prev => ({ ...prev, [key]: current }));
        console.log(`Updated table ${key} row ${rowIndex} column ${columnName}:`, value);
        console.log('Full table data:', current);
    };

    const addTableRow = (questionId: number, columns: Array<{ name: string }>) => {
        const key = `question_${questionId}`;
        const current = Array.isArray(formData[key]) ? ([...(formData[key] as TableRowData[])] as TableRowData[]) : [];
        const qDef = categories.flatMap(c => c.questions).find(q => q.id === questionId);
        const isEmployment = qDef?.question_text.toLowerCase().includes('employment history');
        if (isEmployment && current.length >= 3) {
            toast.error('Maximum 3 employment entries allowed');
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
            <motion.div
                key={sit}
                className="border-2 border-gray-100 rounded-xl p-6 space-y-6 bg-gradient-to-br from-blue-50/30 to-purple-50/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
            >
                <div className="flex items-center gap-2 font-semibold text-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-sm">
                        {sit}
                    </div>
                    <span>Sitting {sit}</span>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor={`wassce_pin_${sit}`} className="text-sm font-medium flex items-center gap-1">
                            Scratch Card PIN
                            <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id={`wassce_pin_${sit}`}
                            placeholder="Enter PIN"
                            className={fieldErrors[`wassce_sitting_${sit}_scratch_card_pin`] ? 'border-red-500' : ''}
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
                    <div className="space-y-2">
                        <Label htmlFor={`wassce_number_${sit}`} className="text-sm font-medium flex items-center gap-1">
                            Scratch Card Number
                            <span className="text-red-500">*</span>
                        </Label>
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
                    <div className="space-y-2">
                        <Label htmlFor={`wassce_year_${sit}`} className="text-sm font-medium flex items-center gap-1">
                            Year Sat
                            <span className="text-red-500">*</span>
                        </Label>
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
                    <div className="space-y-2">
                        <Label htmlFor={`wassce_school_${sit}`} className="text-sm font-medium flex items-center gap-1">
                            School Name
                            <span className="text-red-500">*</span>
                        </Label>
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
                    <div className="space-y-2">
                        <Label htmlFor={`wassce_district_${sit}`} className="text-sm font-medium flex items-center gap-1">
                            District
                            <span className="text-red-500">*</span>
                        </Label>
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
                    <div className="space-y-2">
                        <Label htmlFor={`wassce_country_${sit}`} className="text-sm font-medium flex items-center gap-1">
                            Country
                            <span className="text-red-500">*</span>
                        </Label>
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

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Subjects & Grades</Label>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => addSubjectGrade('WASSCE', idx)}
                            className="hover:bg-blue-50 border-blue-200"
                        >
                            <Plus className="w-3 h-3 mr-1" /> Add Subject
                        </Button>
                    </div>

                    {fieldErrors[`wassce_results_${sit}`] && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors[`wassce_results_${sit}`]}
                        </p>
                    )}

                    <div className="space-y-3">
                        {resultList.map((r, i) => (
                            <motion.div
                                key={i}
                                className="flex gap-2 items-center"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Select
                                    value={r.subject}
                                    onValueChange={v => updateSubjectGrade('WASSCE', idx, i, 'subject', v)}
                                >
                                    <SelectTrigger className="w-56 hover:border-blue-400 focus:border-blue-500 transition-colors">
                                        <SelectValue placeholder="Select Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {WASSCE_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={r.grade}
                                    onValueChange={v => updateSubjectGrade('WASSCE', idx, i, 'grade', v)}
                                >
                                    <SelectTrigger className="w-32 hover:border-blue-400 focus:border-blue-500 transition-colors">
                                        <SelectValue placeholder="Grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {WASSCE_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => removeSubjectGrade('WASSCE', idx, i)}
                                    className="hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </motion.div>
                        ))}
                        {!resultList.length && (
                            <div className="text-sm text-gray-500 py-8 text-center border-2 border-dashed rounded-lg">
                                No subjects added yet. Click "Add Subject" to begin.
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-1">
                        Statement of Results (Image/PDF)
                        <span className="text-red-500">*</span>
                    </Label>
                    {fieldErrors[`wassce_sitting_${sit}_statement`] && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {fieldErrors[`wassce_sitting_${sit}_statement`]}
                        </p>
                    )}
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="relative">
                            <Input
                                type="file"
                                accept=".pdf,image/*"
                                className="cursor-pointer"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileChange(`wassce_sitting_${sit}_statement`, f);
                                }}
                            />
                        </div>
                        {(statementFile || statementMeta) && (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                                <FileCheck className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-900">
                                {statementMeta?.original_name || statementFile?.name}
                            </span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleFilePreview(statementMeta?.file_path || statementFile)}
                                    className="hover:bg-blue-100"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeFile(`wassce_sitting_${sit}_statement`)}
                                    className="hover:bg-red-100 hover:text-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderQualificationResults = (question: Question) => {
        const qualificationType = formData[`question_${question.id}`];

        if (qualificationType === 'WASSCE') {
            return (
                <div className="mt-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Number of Sittings (max 2)</Label>
                        <Select
                            value={String(wassceSittings)}
                            onValueChange={v => handleSittingsChange('WASSCE', parseInt(v, 10))}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1,2].map(n => <SelectItem key={n} value={String(n)}>{n} Sitting{n > 1 ? 's' : ''}</SelectItem>)}
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
                <div className="mt-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Number of Sittings (max 3)</Label>
                        <Select
                            value={String(alevelSittings)}
                            onValueChange={v => handleSittingsChange('A-Level', parseInt(v, 10))}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                                {[1,2,3].map(n => <SelectItem key={n} value={String(n)}>{n} Sitting{n > 1 ? 's' : ''}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    {Array.from({ length: alevelSittings }, (_, idx) => {
                        const sit = idx + 1;
                        const resultList = alevelResults[idx] || [];
                        return (
                            <motion.div
                                key={sit}
                                className="border-2 border-gray-100 rounded-xl p-6 space-y-6 bg-gradient-to-br from-purple-50/30 to-pink-50/30"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="flex items-center gap-2 font-semibold text-lg">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-full flex items-center justify-center text-sm">
                                        {sit}
                                    </div>
                                    <span>Sitting {sit}</span>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <Label className="text-sm font-medium">Subjects & Grades</Label>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => addSubjectGrade('A-Level', idx)}
                                            className="hover:bg-purple-50 border-purple-200"
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Add Subject
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {resultList.map((r, i) => (
                                            <motion.div
                                                key={i}
                                                className="flex gap-2 items-center"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                            >
                                                <Select
                                                    value={r.subject}
                                                    onValueChange={v => updateSubjectGrade('A-Level', idx, i, 'subject', v)}
                                                >
                                                    <SelectTrigger className="w-56 hover:border-purple-400 focus:border-purple-500 transition-colors">
                                                        <SelectValue placeholder="Select Subject" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {A_LEVEL_SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Select
                                                    value={r.grade}
                                                    onValueChange={v => updateSubjectGrade('A-Level', idx, i, 'grade', v)}
                                                >
                                                    <SelectTrigger className="w-32 hover:border-purple-400 focus:border-purple-500 transition-colors">
                                                        <SelectValue placeholder="Grade" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {A_LEVEL_GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => removeSubjectGrade('A-Level', idx, i)}
                                                    className="hover:bg-red-50 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </motion.div>
                                        ))}
                                        {!resultList.length && (
                                            <div className="text-sm text-gray-500 py-8 text-center border-2 border-dashed rounded-lg">
                                                No subjects added yet. Click "Add Subject" to begin.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
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
                <motion.div
                    className="mt-6 space-y-6 p-6 bg-gradient-to-br from-amber-50/30 to-orange-50/30 rounded-xl border-2 border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Institution Name *</Label>
                            <Input
                                placeholder="Enter institution name"
                                value={formData[`${qualKey}_institution_name`] || ''}
                                onChange={e => handleInputChange(`${qualKey}_institution_name`, e.target.value)}
                                className={fieldErrors[`${qualKey}_institution_name`] ? 'border-red-500' : ''}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">District *</Label>
                            <Input
                                placeholder="Enter district"
                                value={formData[`${qualKey}_district`] || ''}
                                onChange={e => handleInputChange(`${qualKey}_district`, e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Country *</Label>
                            <Input
                                placeholder="Enter country"
                                value={formData[`${qualKey}_country`] || ''}
                                onChange={e => handleInputChange(`${qualKey}_country`, e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Graduation Year *</Label>
                            <Input
                                placeholder="e.g., 2023"
                                value={formData[`${qualKey}_graduation_year`] || ''}
                                onChange={e => handleInputChange(`${qualKey}_graduation_year`, e.target.value)}
                                className={fieldErrors[`${qualKey}_graduation_year`] ? 'border-red-500' : ''}
                            />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Certificate (Image/PDF)</Label>
                            <div className="space-y-3">
                                <Input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFileChange(`${qualKey}_certificate`, f);
                                    }}
                                />
                                {(certFile || certMeta) && (
                                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                                        <FileCheck className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm text-amber-900 truncate">
                                           {certMeta?.original_name || certFile?.name}
                                       </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleFilePreview(certMeta?.file_path || certFile)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeFile(`${qualKey}_certificate`)}
                                            className="hover:bg-red-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Testimonial (Image/PDF)</Label>
                            <div className="space-y-3">
                                <Input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFileChange(`${qualKey}_testimonial`, f);
                                    }}
                                />
                                {(testFile || testMeta) && (
                                    <div className="flex items-center gap-2 bg-amber-50 px-3 py-2 rounded-lg">
                                        <FileCheck className="w-4 h-4 text-amber-600" />
                                        <span className="text-sm text-amber-900 truncate">
                                           {testMeta?.original_name || testFile?.name}
                                       </span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleFilePreview(testMeta?.file_path || testFile)}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => removeFile(`${qualKey}_testimonial`)}
                                            className="hover:bg-red-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            );
        }

        return null;
    };

    const renderField = (question: Question) => {
        const value = formData[`question_${question.id}`];
        const fieldId = `question_${question.id}`;
        const hasError = !!fieldErrors[fieldId];
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
                    <div className="space-y-1">
                        <Input
                            type={question.question_type === 'text' ? 'text' : question.question_type === 'phone' ? 'tel' : question.question_type}
                            value={value || ''}
                            onChange={e => handleInputChange(question.id, e.target.value)}
                            placeholder={`Enter ${question.question_text.toLowerCase()}`}
                            className={`transition-all ${hasError ? 'border-red-500 focus:border-red-500' : 'hover:border-gray-400'}`}
                        />
                        {hasError && (
                            <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors[fieldId]}
                            </p>
                        )}
                    </div>
                );

            case 'textarea':
                return (
                    <div className="space-y-1">
                        <Textarea
                            value={value || ''}
                            onChange={e => handleInputChange(question.id, e.target.value)}
                            placeholder={`Enter ${question.question_text.toLowerCase()}`}
                            className={`min-h-[100px] transition-all ${hasError ? 'border-red-500' : 'hover:border-gray-400'}`}
                        />
                        {hasError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors[fieldId]}
                            </p>
                        )}
                    </div>
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
                            <SelectTrigger className={`transition-all ${hasError ? 'border-red-500' : 'hover:border-gray-400'}`}>
                                <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                                {safeOptions.map(opt => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {hasError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors[fieldId]}
                            </p>
                        )}
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
                                    <motion.button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                            let next: string[];
                                            if (checked) next = selectedValues.filter(v => v !== opt);
                                            else next = [...selectedValues, opt];
                                            handleInputChange(question.id, next);
                                        }}
                                        className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                            checked
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow-md'
                                                : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {checked && <Check className="w-3 h-3 inline mr-1" />}
                                        {opt}
                                    </motion.button>
                                );
                            })}
                        </div>
                        {hasError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors[fieldId]}
                            </p>
                        )}
                    </div>
                );
            }

            case 'file': {
                const selectedFile = files[fieldId];
                const existingFile = filesMetadata[fieldId];

                return (
                    <div className="space-y-3">
                        <div className="relative">
                            <Input
                                type="file"
                                onChange={e => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileChange(fieldId, f);
                                }}
                                className="cursor-pointer"
                            />
                            <Upload className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {(selectedFile || existingFile) && (
                            <motion.div
                                className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {selectedFile ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                            <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{selectedFile.name}</p>
                                            <p className="text-xs text-gray-500">Uploading...</p>
                                        </div>
                                    </div>
                                ) : existingFile ? (
                                    <div className="flex items-center gap-2 flex-1">
                                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{existingFile.original_name}</p>
                                            <p className="text-xs text-green-600">Uploaded successfully</p>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => handleFilePreview(existingFile?.file_path || selectedFile)}
                                        className="hover:bg-white"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => removeFile(fieldId)}
                                        className="hover:bg-red-50 hover:text-red-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {hasError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors[fieldId]}
                            </p>
                        )}
                    </div>
                );
            }

            case 'table': {
                const tableData = Array.isArray(formData[fieldId]) ? formData[fieldId] as TableRowData[] : [];
                const columns = question.table_columns || [];

                return (
                    <div className="space-y-4">
                        <AnimatePresence>
                            {tableData.map((row, index) => (
                                <motion.div
                                    key={index}
                                    className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="flex-1 grid md:grid-cols-2 gap-3">
                                        {columns.map(col => {
                                            const colKey = `${index}-${col.id}`;

                                            if (col.type === 'select') {
                                                const options = Array.isArray(col.options) ? col.options as string[] :
                                                    typeof col.options === 'string' ? safeJsonParse<string[]>(col.options, []) : [];
                                                return (
                                                    <div key={colKey} className="space-y-1">
                                                        <Label className="text-xs font-medium text-gray-600">
                                                            {col.name}
                                                            {col.is_required && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                        <Select
                                                            value={row[col.name] || ''}
                                                            onValueChange={v => handleTableInputChange(question.id, index, col.name, v)}
                                                        >
                                                            <SelectTrigger className="h-9 text-sm">
                                                                <SelectValue placeholder={`Select ${col.name}`} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {options.map(opt => (
                                                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                );
                                            } else if (col.type === 'textarea') {
                                                return (
                                                    <div key={colKey} className="space-y-1 md:col-span-2">
                                                        <Label className="text-xs font-medium text-gray-600">
                                                            {col.name}
                                                            {col.is_required && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                        <Textarea
                                                            value={row[col.name] || ''}
                                                            onChange={e => handleTableInputChange(question.id, index, col.name, e.target.value)}
                                                            placeholder={`Enter ${col.name}`}
                                                            rows={2}
                                                            className="text-sm"
                                                        />
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div key={colKey} className="space-y-1">
                                                        <Label className="text-xs font-medium text-gray-600">
                                                            {col.name}
                                                            {col.is_required && <span className="text-red-500 ml-1">*</span>}
                                                        </Label>
                                                        <Input
                                                            type={col.type === 'number' ? 'number' : 'text'}
                                                            value={row[col.name] || ''}
                                                            onChange={e => handleTableInputChange(question.id, index, col.name, e.target.value)}
                                                            placeholder={`Enter ${col.name}`}
                                                            className="h-9 text-sm"
                                                        />
                                                    </div>
                                                );
                                            }
                                        })}
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => removeTableRow(question.id, index)}
                                        className="hover:bg-red-50 hover:text-red-600 mt-6"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {tableData.length === 0 && (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-sm text-gray-500 mb-3">No entries yet</p>
                                <p className="text-xs text-gray-400">Click the button below to add your first entry</p>
                            </div>
                        )}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => addTableRow(question.id, columns)}
                            className="w-full hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add {question.question_text.includes('Employment') ? 'Employment' : 'Entry'}
                        </Button>

                        {hasError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors[fieldId]}
                            </p>
                        )}
                    </div>
                );
            }

            default:
                return (
                    <div className="space-y-1">
                        <Input
                            value={value || ''}
                            onChange={e => handleInputChange(question.id, e.target.value)}
                            placeholder={`Enter ${question.question_text.toLowerCase()}`}
                            className={`transition-all ${hasError ? 'border-red-500' : 'hover:border-gray-400'}`}
                        />
                        {hasError && (
                            <p className="text-sm text-red-500 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {fieldErrors[fieldId]}
                            </p>
                        )}
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="w-16 h-16 border-4 border-t-blue-600 border-r-blue-600 border-b-purple-600 border-l-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading application form...</p>
                </motion.div>
            </div>
        );
    }

    if (submittedApplication && !isEditMode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-6">
                <motion.div
                    className="max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={"flex items-center justify-center gap-3 mb-8"}>
                        <img src={"https://msn.edu.sl/nursingschoollogo.jpg"} alt={"MSN"} className="w-20 h-20" />
                        {/*Make this Header beatiful*/}

                        <h3 className="text-3xl font-extrabold text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-md tracking-wide">
                            Mattru School of Nursing
                        </h3>

                    </div>
                    <div className="mb-8 text-center">
                        <motion.div
                            className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                        >

                            <CheckCircle2 className="w-10 h-10 text-white" />

                        </motion.div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Application Submitted Successfully!</h1>
                        <p className="text-gray-600">Your application has been received and is being processed</p>
                    </div>

                    <Card className="shadow-xl border-0 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                            <CardTitle className="text-white flex items-center justify-between">
                                <div>
                                    <div className="text-2xl font-bold mb-2">Application Summary</div>
                                    <div className="flex items-center gap-4 text-blue-100">
                                        <Badge className="bg-white/20 text-white border-0 px-3 py-1">
                                            ID: {applicationNumber || submittedApplication.application_number || submittedApplication.id}
                                        </Badge>
                                        <span className="text-sm">
                                           Submitted: {new Date(submittedApplication.submitted_at).toLocaleDateString()}
                                       </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handlePrint}
                                        className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                                    >
                                        <Printer className="w-4 h-4 mr-1" /> Print
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={handleEditApplication}
                                        className="bg-white text-blue-600 hover:bg-blue-50"
                                    >
                                        <Edit className="w-4 h-4 mr-1" /> Edit
                                    </Button>
                                </div>
                            </CardTitle>
                        </div>

                        <CardContent ref={printRef} className="p-6 space-y-8">
                            {Object.entries(submittedApplication.categories).map(([cat, answers], catIdx) => {
                                const Icon = CATEGORY_ICONS[cat] || FileText;
                                return (
                                    <motion.div
                                        key={cat}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: catIdx * 0.1 }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h2 className="font-semibold text-xl text-gray-800">{cat}</h2>
                                        </div>

                                        <div className="space-y-3 pl-13">
                                            {answers.map((a, idx) => {
                                                const question = categories
                                                    .flatMap(c => c.questions)
                                                    .find(q => q.id === a.question_id);

                                                return (
                                                    <motion.div
                                                        key={a.question_id}
                                                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: idx * 0.05 }}
                                                    >
                                                        <div className="text-sm font-medium text-gray-700 mb-2">
                                                            {a.question_text}
                                                        </div>

                                                        {a.question_type === 'file' && a.file_path ? (
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                                    <FileIcon className="w-4 h-4 text-blue-600" />
                                                                </div>
                                                                <span className="text-sm text-gray-600">{extractFilename(a.file_path)}</span>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleFilePreview(a.file_path)}
                                                                    className="ml-auto"
                                                                >
                                                                    <Eye className="w-4 h-4 mr-1" /> View
                                                                </Button>
                                                            </div>
                                                        ) : a.question_type === 'multiple_select' ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {safeJsonParse<string[]>(a.answer, []).map(v => (
                                                                    <Badge key={v} variant="secondary" className="bg-blue-100 text-blue-700">
                                                                        {v}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : a.question_type === 'table' && question ? (
                                                            <div className="overflow-x-auto">
                                                                {(() => {
                                                                    const rows = safeJsonParse<TableRowData[]>(a.answer, []);
                                                                    if (!rows.length) return <em className="text-xs text-gray-400">No data</em>;
                                                                    const cols = question.table_columns || [];
                                                                    return (
                                                                        <Table className="text-xs">
                                                                            <TableHeader>
                                                                                <TableRow>
                                                                                    {cols.map(c => (
                                                                                        <TableHead key={c.id} className="font-medium">{c.name}</TableHead>
                                                                                    ))}
                                                                                </TableRow>
                                                                            </TableHeader>
                                                                            <TableBody>
                                                                                {rows.map((r, i) => (
                                                                                    <TableRow key={i}>
                                                                                        {cols.map(c => (
                                                                                            <TableCell key={c.id}>{r[c.name] || '—'}</TableCell>
                                                                                        ))}
                                                                                    </TableRow>
                                                                                ))}
                                                                            </TableBody>
                                                                        </Table>
                                                                    );
                                                                })()}
                                                            </div>
                                                        ) : (
                                                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                                                {a.answer || <span className="text-gray-400 italic">Not provided</span>}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.div>

                <Dialog open={!!previewFile?.url} onOpenChange={() => setPreviewFile({ url: '', type: '' })}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <FileIcon className="w-5 h-5" />
                                File Preview
                            </DialogTitle>
                        </DialogHeader>
                        {previewFile.type === 'image' && (
                            <img src={previewFile.url} alt={previewFile.name} className="w-full h-auto rounded-lg" />
                        )}
                        {previewFile.type === 'pdf' && (
                            <iframe src={previewFile.url} title="PDF Preview" className="w-full h-[70vh] rounded-lg" />
                        )}
                        {previewFile.url && !['image','pdf'].includes(previewFile.type) && (
                            <div className="text-center py-8">
                                <Download className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                    Download File
                                </a>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    const progressPercentage = categories.length > 0 ? ((currentStep + 1) / categories.length) * 100 : 0;
    const currentCategory = categories[currentStep];
    const CategoryIcon = currentCategory ? (CATEGORY_ICONS[currentCategory.name] || FileText) : FileText;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header Progress Bar */}
            <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <CategoryIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">
                                    {currentCategory?.name || 'Application Form'}
                                </h1>
                                {applicationNumber && (
                                    <p className="text-xs text-gray-500">
                                        Application ID: {applicationNumber}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {lastSaved && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => saveProgress()}
                                    disabled={isSaving}
                                    className="hover:bg-blue-50"
                                >
                                    {isSaving ? (
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-1" />
                                    )}
                                    {isSaving ? 'Saving...' : 'Save'}
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
                        </div>
                    </div>

                    <div className="relative">
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="absolute -top-1 left-0 right-0 flex justify-between">
                            {categories.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-4 h-4 rounded-full border-2 bg-white transition-all ${
                                        idx < currentStep
                                            ? 'border-green-500 bg-green-500'
                                            : idx === currentStep
                                                ? 'border-blue-600 bg-blue-600'
                                                : 'border-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-6">
                <Card className="shadow-xl border-0">
                    <CardContent className="p-8">
                        <AnimatePresence mode="wait">
                            <motion.form
                                key={currentStep}
                                className="space-y-6"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                {categories[currentStep]?.questions
                                    .filter(shouldShowQuestion)
                                    .map((q, idx) => (
                                        <motion.div
                                            key={q.id}
                                            className="space-y-3"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Label className="font-medium text-gray-700 flex items-center gap-2">
                                                {q.question_text}
                                                {q.is_required && <span className="text-red-500">*</span>}
                                                {q.validation_rules && (
                                                    <Shield className="w-3 h-3 text-gray-400" title="Validated field" />
                                                )}
                                            </Label>
                                            {renderField(q)}
                                        </motion.div>
                                    ))}
                            </motion.form>
                        </AnimatePresence>

                        {/* Navigation */}
                        <div className="flex justify-between mt-10 pt-6 border-t">
                            <Button
                                type="button"
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                variant="outline"
                                className="flex items-center gap-2 hover:bg-gray-50"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        checked={autoSaveEnabled}
                                        onCheckedChange={v => setAutoSaveEnabled(!!v)}
                                        id="autosave"
                                    />
                                    <label htmlFor="autosave" className="text-sm text-gray-600 cursor-pointer">
                                        Auto-save enabled
                                    </label>
                                </div>

                                {currentStep < categories.length - 1 ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={!canProceed}
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all"
                                    >
                                        Next
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        disabled={!canProceed || isSubmitting}
                                        onClick={submitApplication}
                                        className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all px-6"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Application
                                                <CheckCircle2 className="w-4 h-4" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Step Navigation Pills */}
                        <div className="mt-8 flex flex-wrap gap-2 justify-center">
                            {categories.map((c, i) => {
                                const Icon = CATEGORY_ICONS[c.name] || FileText;
                                const isActive = i === currentStep;
                                const isCompleted = completedSteps.includes(i);
                                const isAccessible = i <= currentStep || isCompleted;

                                return (
                                    <motion.button
                                        key={c.name}
                                        onClick={() => goToStep(i)}
                                        disabled={!isAccessible}
                                        className={`
                                           px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all
                                           ${isActive
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                                            : isCompleted
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : isAccessible
                                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    : 'bg-gray-50 text-gray-400 cursor-not-allowed'}
                                       `}
                                        whileHover={isAccessible && !isActive ? { scale: 1.05 } : {}}
                                        whileTap={isAccessible ? { scale: 0.95 } : {}}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 className="w-3 h-3" />
                                        ) : (
                                            <Icon className="w-3 h-3" />
                                        )}
                                        <span className="hidden sm:inline">{c.name}</span>
                                        <span className="sm:hidden">{i + 1}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* File Preview Dialog */}
            <Dialog open={!!previewFile?.url} onOpenChange={() => setPreviewFile({ url: '', type: '' })}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileIcon className="w-5 h-5" />
                            File Preview
                        </DialogTitle>
                    </DialogHeader>
                    {previewFile.type === 'image' && (
                        <img
                            src={previewFile.url}
                            alt={previewFile.name}
                            className="w-full h-auto rounded-lg"
                        />
                    )}
                    {previewFile.type === 'pdf' && (
                        <iframe src={previewFile.url} title="PDF Preview" className="w-full h-[70vh] rounded-lg" />
                    )}
                    {previewFile.url && !['image','pdf'].includes(previewFile.type) && (
                        <div className="text-center py-8">
                            <Download className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <a href={previewFile.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                                Download File
                            </a>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}