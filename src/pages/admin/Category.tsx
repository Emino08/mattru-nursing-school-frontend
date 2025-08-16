import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import api from '@/services/api';
import { GripVertical } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    display_order: number;
    is_active: boolean;
}

export default function CategoryManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/admin/categories');
            setCategories(response.data);
        } catch (error) {
            toast.error('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return;

        const items = Array.from(categories);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update display_order values
        const updatedCategories = items.map((item, index) => ({
            ...item,
            display_order: index + 1
        }));

        setCategories(updatedCategories);

        try {
            await api.post('/admin/categories/reorder', {
                categories: updatedCategories.map(cat => ({
                    id: cat.id,
                    display_order: cat.display_order
                }))
            });
            toast.success('Category order updated successfully');
        } catch (error) {
            toast.error('Failed to update category order');
            // Revert on error
            fetchCategories();
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8">Loading categories...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Category Order Management</CardTitle>
                <p className="text-sm text-gray-600">
                    Drag and drop categories to change their display order in the application form
                </p>
            </CardHeader>
            <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="categories">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {categories.map((category, index) => (
                                    <Draggable
                                        key={category.id}
                                        draggableId={category.id.toString()}
                                        index={index}
                                    >
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`flex items-center p-4 mb-2 bg-white border rounded-lg shadow-sm ${
                                                    snapshot.isDragging ? 'shadow-lg' : ''
                                                }`}
                                            >
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="mr-3 text-gray-400"
                                                >
                                                    <GripVertical className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="font-medium">{category.name}</span>
                                                    <span className="ml-2 text-sm text-gray-500">
                                                        (Position: {category.display_order})
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </CardContent>
        </Card>
    );
}