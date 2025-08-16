import { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import api from '@/services/api';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Question {
    id?: number;
    section: string;
    question_text: string;
    question_type: string;
    options?: string[];
    validation_rules?: Record<string, never>;
    is_required: boolean;
    is_active: boolean;
    sort_order: number;
}

export default function QuestionManagement() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [formData, setFormData] = useState<Question>({
        section: '',
        question_text: '',
        question_type: 'text',
        options: [],
        validation_rules: {},
        is_required: false,
        is_active: true,
        sort_order: 1
    });

    const sections = [
        { value: 'application_fee', label: 'Application Fee' },
        { value: 'personal_info', label: 'Personal Information' },
        { value: 'contact_info', label: 'Contact Information' },
        { value: 'academic_history', label: 'Academic History' },
        { value: 'program_details', label: 'Program Details' },
        { value: 'supporting_docs', label: 'Supporting Documents' },
        { value: 'work_experience', label: 'Work Experience' },
        { value: 'financial_info', label: 'Financial Information' },
        { value: 'additional_info', label: 'Additional Information' },
        { value: 'declarations', label: 'Declarations & Agreements' }
    ];

    const questionTypes = [
        { value: 'text', label: 'Text Input' },
        { value: 'textarea', label: 'Text Area' },
        { value: 'single_select', label: 'Single Select' },
        { value: 'multiple_select', label: 'Multiple Select' },
        { value: 'date', label: 'Date' },
        { value: 'file', label: 'File Upload' },
        { value: 'number', label: 'Number' },
        { value: 'email', label: 'Email' },
        { value: 'phone', label: 'Phone' }
    ];

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await api.get('/admin/questions');
            setQuestions(response.data);
        } catch (error) {
            toast.error('Failed to fetch questions');
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            section: '',
            question_text: '',
            question_type: 'text',
            options: [],
            validation_rules: {},
            is_required: false,
            is_active: true,
            sort_order: 1
        });
        setEditingQuestion(null);
        setShowForm(false);
    };

    const handleSave = async () => {
        try {
            if (editingQuestion) {
                await api.put(`/admin/questions/${editingQuestion.id}`, formData);
                toast.success('Question updated successfully');
            } else {
                await api.post('/admin/questions', formData);
                toast.success('Question created successfully');
            }
            fetchQuestions();
            resetForm();
        } catch (error) {
            toast.error('Failed to save question');
        }
    };

    const handleEdit = (question: Question) => {
        setFormData(question);
        setEditingQuestion(question);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this question?')) {
            try {
                await api.delete(`/admin/questions/${id}`);
                toast.success('Question deleted successfully');
                fetchQuestions();
            } catch (error) {
                toast.error('Failed to delete question');
            }
        }
    };

    const seedDefaultQuestions = async () => {
        try {
            await api.post('/admin/questions/seed');
            toast.success('Default questions seeded successfully');
            fetchQuestions();
        } catch (error) {
            toast.error('Failed to seed default questions');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Question Management</h2>
                <div className="flex gap-2">
                    <Button onClick={seedDefaultQuestions} variant="outline">
                        Seed Default Questions
                    </Button>
                    <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Question
                    </Button>
                </div>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingQuestion ? 'Edit Question' : 'Create New Question'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="section">Section</Label>
                                <Select
                                    value={formData.section}
                                    onValueChange={(value) => setFormData({ ...formData, section: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sections.map(section => (
                                            <SelectItem key={section.value} value={section.value}>
                                                {section.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="question_type">Question Type</Label>
                                <Select
                                    value={formData.question_type}
                                    onValueChange={(value) => setFormData({ ...formData, question_type: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {questionTypes.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="question_text">Question Text</Label>
                            <Input
                                id="question_text"
                                value={formData.question_text}
                                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                                placeholder="Enter question text"
                            />
                        </div>

                        {['single_select', 'multiple_select'].includes(formData.question_type) && (
                            <div>
                                <Label htmlFor="options">Options (comma-separated)</Label>
                                <Textarea
                                    id="options"
                                    value={formData.options?.join(', ') || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        options: e.target.value.split(',').map(opt => opt.trim()).filter(opt => opt)
                                    })}
                                    placeholder="Option 1, Option 2, Option 3"
                                />
                            </div>
                        )}

                        <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_required}
                                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                                />
                                <span>Required</span>
                            </label>

                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <span>Active</span>
                            </label>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={resetForm}>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>
                                <Save className="w-4 h-4 mr-2" />
                                {editingQuestion ? 'Update' : 'Create'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Section</TableHead>
                                <TableHead>Question</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Required</TableHead>
                                <TableHead>Active</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {questions.map((question) => (
                                <TableRow key={question.id}>
                                    <TableCell>
                                        {sections.find(s => s.value === question.section)?.label || question.section}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {question.question_text}
                                    </TableCell>
                                    <TableCell>
                                        {questionTypes.find(t => t.value === question.question_type)?.label || question.question_type}
                                    </TableCell>
                                    <TableCell>{question.is_required ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{question.is_active ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(question)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(question.id!)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}