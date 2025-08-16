import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import api from '@/services/api';
import { Plus, Trash2, Save, Edit } from 'lucide-react';

interface Question {
    id: number;
    category: string;
    section: string;
    question_text: string;
    question_type: string;
    options?: string[];
    validation_rules?: Record<string, any>;
    conditional_logic?: { question_id: number; value: string; show_question_ids?: number[] } | null;
    is_required: boolean;
    sort_order: number;
    is_active: boolean;
    table_columns?: Array<{ name: string; type: string; is_required: boolean; options?: string[] }>;
}

interface Category {
    id: number;
    name: string;
    display_order: number;
}

export default function AdminQuestionManager() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState({
        category: '',
        section: '',
        question_text: '',
        question_type: 'text',
        options: [] as string[],
        validation_rules: {} as Record<string, any>,
        conditional_logic: null as { question_id: number; value: string; show_question_ids?: number[] } | null,
        is_required: false,
        is_active: true,
        table_columns: [] as Array<{ name: string; type: string; is_required: boolean; options?: string[] }>
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [questionsResponse, categoriesResponse] = await Promise.all([
                api.get('/admin/questions'),
                api.get('/admin/categories')
            ]);
            setQuestions(questionsResponse.data);
            setCategories(categoriesResponse.data);
            setIsLoading(false);
        } catch (error) {
            toast.error('Failed to load questions or categories');
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const addOption = () => {
        setFormData(prev => ({ ...prev, options: [...prev.options, ''] }));
    };

    const removeOption = (index: number) => {
        setFormData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== index)
        }));
    };

    const handleTableColumnChange = (index: number, field: string, value: any) => {
        const newColumns = [...formData.table_columns];
        newColumns[index] = { ...newColumns[index], [field]: value };
        setFormData(prev => ({ ...prev, table_columns: newColumns }));
    };

    const addTableColumn = () => {
        setFormData(prev => ({
            ...prev,
            table_columns: [...prev.table_columns, { name: '', type: 'text', is_required: false, options: [] }]
        }));
    };

    const removeTableColumn = (index: number) => {
        setFormData(prev => ({
            ...prev,
            table_columns: prev.table_columns.filter((_, i) => i !== index)
        }));
    };

    const handleTableColumnOptionChange = (colIndex: number, optIndex: number, value: string) => {
        const newColumns = [...formData.table_columns];
        const column = { ...newColumns[colIndex] };
        column.options = column.options ? [...column.options] : [];
        column.options[optIndex] = value;
        newColumns[colIndex] = column;
        setFormData(prev => ({ ...prev, table_columns: newColumns }));
    };

    const addTableColumnOption = (colIndex: number) => {
        const newColumns = [...formData.table_columns];
        const column = { ...newColumns[colIndex] };
        column.options = column.options ? [...column.options, ''] : [''];
        newColumns[colIndex] = column;
        setFormData(prev => ({ ...prev, table_columns: newColumns }));
    };

    const removeTableColumnOption = (colIndex: number, optIndex: number) => {
        const newColumns = [...formData.table_columns];
        const column = { ...newColumns[colIndex] };
        column.options = column.options ? column.options.filter((_, i) => i !== optIndex) : [];
        newColumns[colIndex] = column;
        setFormData(prev => ({ ...prev, table_columns: newColumns }));
    };

    const handleConditionalLogicChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            conditional_logic: {
                ...prev.conditional_logic,
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                options: ['single_select', 'multiple_select'].includes(formData.question_type) ? formData.options.filter(opt => opt.trim() !== '') : undefined,
                table_columns: formData.question_type === 'table' ? formData.table_columns.map(col => ({
                    ...col,
                    options: col.type === 'select' ? col.options?.filter(opt => opt.trim() !== '') : undefined
                })) : undefined,
                validation_rules: formData.validation_rules || {},
                conditional_logic: formData.conditional_logic || null
            };

            // Validate required fields
            if (!data.category || !data.section || !data.question_text) {
                toast.error('Category, section, and question text are required');
                return;
            }
            if (['single_select', 'multiple_select'].includes(data.question_type) && (!data.options || data.options.length === 0)) {
                toast.error('At least one option is required for select questions');
                return;
            }
            if (data.question_type === 'table' && (!data.table_columns || data.table_columns.length === 0)) {
                toast.error('At least one table column is required for table questions');
                return;
            }

            if (editingId) {
                await api.put(`/admin/questions/${editingId}`, data);
                toast.success('Question updated successfully');
            } else {
                await api.post('/admin/questions', data);
                toast.success('Question created successfully');
            }
            setFormData({
                category: '',
                section: '',
                question_text: '',
                question_type: 'text',
                options: [],
                validation_rules: {},
                conditional_logic: null,
                is_required: false,
                is_active: true,
                table_columns: []
            });
            setEditingId(null);
            fetchData();
        } catch (error) {
            toast.error('Failed to save question');
        }
    };

    const handleEdit = (question: Question) => {
        setEditingId(question.id);
        setFormData({
            category: question.category,
            section: question.section,
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.options || [],
            validation_rules: question.validation_rules || {},
            conditional_logic: question.conditional_logic || null,
            is_required: question.is_required,
            is_active: question.is_active,
            table_columns: question.table_columns || []
        });
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/admin/questions/${id}`);
            toast.success('Question deleted successfully');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete question');
        }
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Questions</CardTitle>
    </CardHeader>
    <CardContent>
    <form onSubmit={handleSubmit} className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label>Category</Label>
        <Select
    value={formData.category}
    onValueChange={(value) => handleInputChange('category', value)}
>
    <SelectTrigger>
        <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
        {categories.map(category => (
                <SelectItem key={category.id} value={category.name}>
                {category.name}
                </SelectItem>
))}
    </SelectContent>
    </Select>
    </div>
    <div>
    <Label>Section</Label>
    <Input
    value={formData.section}
    onChange={(e) => handleInputChange('section', e.target.value)}
    placeholder="Enter section"
    required
    />
    </div>
    </div>
    <div>
    <Label>Question Text</Label>
    <Input
    value={formData.question_text}
    onChange={(e) => handleInputChange('question_text', e.target.value)}
    placeholder="Enter question text"
    required
    />
    </div>
    <div>
    <Label>Question Type</Label>
    <Select
    value={formData.question_type}
    onValueChange={(value) => handleInputChange('question_type', value)}
>
    <SelectTrigger>
        <SelectValue placeholder="Select question type" />
    </SelectTrigger>
    <SelectContent>
    <SelectItem value="text">Text</SelectItem>
        <SelectItem value="textarea">Textarea</SelectItem>
        <SelectItem value="single_select">Single Select</SelectItem>
    <SelectItem value="multiple_select">Multiple Select</SelectItem>
    <SelectItem value="date">Date</SelectItem>
        <SelectItem value="file">File</SelectItem>
        <SelectItem value="number">Number</SelectItem>
        <SelectItem value="email">Email</SelectItem>
        <SelectItem value="phone">Phone</SelectItem>
        <SelectItem value="table">Table</SelectItem>
        </SelectContent>
        </Select>
        </div>
    {(formData.question_type === 'single_select' || formData.question_type === 'multiple_select') && (
        <div>
            <Label>Options</Label>
        {formData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
        <Input
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            placeholder={`Option ${index + 1}`}
            />
            <Button variant="destructive" size="sm" onClick={() => removeOption(index)}>
            <Trash2 className="w-4 h-4" />
                </Button>
                </div>
        ))}
        <Button type="button" variant="outline" onClick={addOption} className="mt-2">
    <Plus className="w-4 h-4 mr-2" />
        Add Option
    </Button>
    </div>
    )}
    {formData.question_type === 'table' && (
        <div>
            <Label>Table Columns</Label>
        {formData.table_columns.map((column, colIndex) => (
            <div key={colIndex} className="space-y-2 border p-4 mb-2 rounded">
        <div className="flex items-center gap-2">
        <Input
            value={column.name}
            onChange={(e) => handleTableColumnChange(colIndex, 'name', e.target.value)}
            placeholder="Column Name"
            required
            />
            <Select
                value={column.type}
            onValueChange={(value) => handleTableColumnChange(colIndex, 'type', value)}
        >
            <SelectTrigger>
                <SelectValue placeholder="Select column type" />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="text">Text</SelectItem>
                <SelectItem value="select">Select</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="textarea">Textarea</SelectItem>
            </SelectContent>
            </Select>
            <Checkbox
            checked={column.is_required}
            onCheckedChange={(checked) => handleTableColumnChange(colIndex, 'is_required', checked)}
        >
            Required
            </Checkbox>
            <Button variant="destructive" size="sm" onClick={() => removeTableColumn(colIndex)}>
            <Trash2 className="w-4 h-4" />
                </Button>
                </div>
            {column.type === 'select' && (
                <div className="ml-4">
                    <Label>Column Options</Label>
                {column.options?.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-2 mb-2">
                <Input
                    value={option}
                    onChange={(e) => handleTableColumnOptionChange(colIndex, optIndex, e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    />
                    <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTableColumnOption(colIndex, optIndex)}
                >
                    <Trash2 className="w-4 h-4" />
                        </Button>
                        </div>
                ))}
                <Button
                    type="button"
                variant="outline"
                onClick={() => addTableColumnOption(colIndex)}
                className="mt-2"
                >
                <Plus className="w-4 h-4 mr-2" />
                    Add Column Option
            </Button>
            </div>
            )}
            </div>
        ))}
        <Button type="button" variant="outline" onClick={addTableColumn} className="mt-2">
    <Plus className="w-4 h-4 mr-2" />
        Add Table Column
    </Button>
    </div>
    )}
    <div>
        <Label>Conditional Logic</Label>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label>Dependent Question ID</Label>
    <Input
    type="number"
    value={formData.conditional_logic?.question_id || ''}
    onChange={(e) => handleConditionalLogicChange('question_id', parseInt(e.target.value))}
    placeholder="Enter question ID"
        />
        </div>
        <div>
        <Label>Trigger Value</Label>
    <Input
    value={formData.conditional_logic?.value || ''}
    onChange={(e) => handleConditionalLogicChange('value', e.target.value)}
    placeholder="Enter trigger value"
        />
        </div>
        </div>
        </div>
        <div className="flex items-center gap-4">
    <Checkbox
        checked={formData.is_required}
    onCheckedChange={(checked) => handleInputChange('is_required', checked)}
>
    Required
    </Checkbox>
    <Checkbox
    checked={formData.is_active}
    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
>
    Active
    </Checkbox>
    </div>
    <Button type="submit" className="flex items-center gap-2">
    <Save className="w-4 h-4" />
        {editingId ? 'Update Question' : 'Create Question'}
        </Button>
        </form>
        </CardContent>
        </Card>

        <Card>
        <CardHeader>
            <CardTitle>Existing Questions</CardTitle>
    </CardHeader>
    <CardContent>
    <Table>
        <TableHeader>
            <TableRow>
                <TableHead>Category</TableHead>
    <TableHead>Section</TableHead>
    <TableHead>Question Text</TableHead>
    <TableHead>Type</TableHead>
    <TableHead>Actions</TableHead>
    </TableRow>
    </TableHeader>
    <TableBody>
    {questions.map((question) => (
            <TableRow key={question.id}>
            <TableCell>{question.category}</TableCell>
            <TableCell>{question.section}</TableCell>
            <TableCell>{question.question_text}</TableCell>
            <TableCell>{question.question_type}</TableCell>
            <TableCell>
            <div className="flex gap-2">
            <Button
                variant="outline"
        size="sm"
        onClick={() => handleEdit(question)}
>
    <Edit className="w-4 h-4" />
        </Button>
        <Button
    variant="destructive"
    size="sm"
    onClick={() => handleDelete(question.id)}
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