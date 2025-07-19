import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import api from '@/services/api';
import DocumentUpload from './DocumentUpload';

interface FormData {
    program_type: string;
    education: {
        highest_qualification: string;
        institution: string;
        graduation_year: string;
        gpa: string;
    }[];
    work_experience: {
        employer: string;
        position: string;
        start_date: string;
        end_date: string;
        description: string;
    }[];
    personal_statement: string;
    references: {
        name: string;
        position: string;
        institution: string;
        email: string;
        phone: string;
    }[];
}

export default function MultiStepForm() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [applicationId, setApplicationId] = useState<number | null>(null);
    const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
        defaultValues: {
            education: [{ highest_qualification: '', institution: '', graduation_year: '', gpa: '' }],
            work_experience: [{ employer: '', position: '', start_date: '', end_date: '', description: '' }],
            references: [{ name: '', position: '', institution: '', email: '', phone: '' }]
        }
    });

    const onSubmit = async (data: FormData) => {
        try {
            setIsSubmitting(true);
            const response = await api.post('/applicant/application', data);
            setApplicationId(response.data.id);
            toast({ title: 'Success', description: 'Application saved successfully' });
            setStep(step + 1);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to submit application', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addEducation = () => {
        const educationFields = document.getElementById('education-fields');
        const newEducation = document.createElement('div');
        newEducation.className = 'border-t border-gray-200 mt-4 pt-4';
        newEducation.innerHTML = `
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-gray-700 font-medium">Qualification</label>
                    <input name="education[${document.querySelectorAll('.education-entry').length}].highest_qualification" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
                <div>
                    <label class="text-gray-700 font-medium">Institution</label>
                    <input name="education[${document.querySelectorAll('.education-entry').length}].institution" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
            </div>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="text-gray-700 font-medium">Graduation Year</label>
                    <input name="education[${document.querySelectorAll('.education-entry').length}].graduation_year" type="number" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
                <div>
                    <label class="text-gray-700 font-medium">GPA/Grade</label>
                    <input name="education[${document.querySelectorAll('.education-entry').length}].gpa" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
            </div>
        `;
        educationFields?.appendChild(newEducation);
    };

    const addExperience = () => {
        const experienceFields = document.getElementById('experience-fields');
        const newExperience = document.createElement('div');
        newExperience.className = 'border-t border-gray-200 mt-4 pt-4';
        newExperience.innerHTML = `
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-gray-700 font-medium">Employer</label>
                    <input name="work_experience[${document.querySelectorAll('.experience-entry').length}].employer" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
                <div>
                    <label class="text-gray-700 font-medium">Position</label>
                    <input name="work_experience[${document.querySelectorAll('.experience-entry').length}].position" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
            </div>
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-gray-700 font-medium">Start Date</label>
                    <input name="work_experience[${document.querySelectorAll('.experience-entry').length}].start_date" type="date" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
                <div>
                    <label class="text-gray-700 font-medium">End Date</label>
                    <input name="work_experience[${document.querySelectorAll('.experience-entry').length}].end_date" type="date" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
            </div>
            <div>
                <label class="text-gray-700 font-medium">Description</label>
                <textarea name="work_experience[${document.querySelectorAll('.experience-entry').length}].description" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md"></textarea>
            </div>
        `;
        experienceFields?.appendChild(newExperience);
    };

    const addReference = () => {
        const referenceFields = document.getElementById('reference-fields');
        const newReference = document.createElement('div');
        newReference.className = 'border-t border-gray-200 mt-4 pt-4';
        newReference.innerHTML = `
            <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="text-gray-700 font-medium">Name</label>
                    <input name="references[${document.querySelectorAll('.reference-entry').length}].name" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
                <div>
                    <label class="text-gray-700 font-medium">Position</label>
                    <input name="references[${document.querySelectorAll('.reference-entry').length}].position" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
            </div>
            <div class="mb-4">
                <label class="text-gray-700 font-medium">Institution/Organization</label>
                <input name="references[${document.querySelectorAll('.reference-entry').length}].institution" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
            </div>
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <label class="text-gray-700 font-medium">Email</label>
                    <input name="references[${document.querySelectorAll('.reference-entry').length}].email" type="email" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
                <div>
                    <label class="text-gray-700 font-medium">Phone</label>
                    <input name="references[${document.querySelectorAll('.reference-entry').length}].phone" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md" />
                </div>
            </div>
        `;
        referenceFields?.appendChild(newReference);
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <Card className="border border-gray-200 shadow-sm animate-fadeIn p-6">
                        <h3 className="text-xl font-semibold mb-5">Program Selection</h3>
                        <form className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium" htmlFor="program_type">
                                    Select Program
                                </Label>
                                <Controller
                                    name="program_type"
                                    control={control}
                                    defaultValue=""
                                    rules={{ required: "Program type is required" }}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <SelectTrigger className="h-12 px-4 border-gray-200">
                                                <SelectValue placeholder="Select a program" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="diploma">Diploma in Nursing</SelectItem>
                                                <SelectItem value="bachelors">Bachelor of Science in Nursing</SelectItem>
                                                <SelectItem value="certificate">Certificate in Nursing Assistant</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.program_type && <p className="text-red-500 text-sm">{errors.program_type.message}</p>}
                            </div>

                            <div className="pt-4 flex justify-end">
                                <Button
                                    onClick={() => setStep(2)}
                                    className="h-12 px-6 text-white transition-all"
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
                                    Next: Educational Background
                                </Button>
                            </div>
                        </form>
                    </Card>
                );
            case 2:
                return (
                    <Card className="border border-gray-200 shadow-sm animate-fadeIn p-6">
                        <h3 className="text-xl font-semibold mb-5">Educational Background</h3>
                        <form className="space-y-5">
                            <div id="education-fields">
                                <div className="education-entry">
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="education[0].highest_qualification">
                                                Highest Qualification
                                            </Label>
                                            <Input
                                                {...register(`education.0.highest_qualification`, { required: "Qualification is required" })}
                                                className="h-12 px-4 border-gray-200"
                                            />
                                            {errors.education?.[0]?.highest_qualification && <p className="text-red-500 text-sm">{errors.education[0].highest_qualification.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="education[0].institution">
                                                Institution
                                            </Label>
                                            <Input
                                                {...register(`education.0.institution`, { required: "Institution is required" })}
                                                className="h-12 px-4 border-gray-200"
                                            />
                                            {errors.education?.[0]?.institution && <p className="text-red-500 text-sm">{errors.education[0].institution.message}</p>}
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="education[0].graduation_year">
                                                Graduation Year
                                            </Label>
                                            <Input
                                                {...register(`education.0.graduation_year`, { required: "Graduation year is required" })}
                                                type="number"
                                                className="h-12 px-4 border-gray-200"
                                            />
                                            {errors.education?.[0]?.graduation_year && <p className="text-red-500 text-sm">{errors.education[0].graduation_year.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="education[0].gpa">
                                                GPA/Grade
                                            </Label>
                                            <Input
                                                {...register(`education.0.gpa`, { required: "GPA is required" })}
                                                className="h-12 px-4 border-gray-200"
                                            />
                                            {errors.education?.[0]?.gpa && <p className="text-red-500 text-sm">{errors.education[0].gpa.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="button"
                                    onClick={addEducation}
                                    className="text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    + Add Another Education
                                </Button>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <Button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="h-12 px-6 text-gray-700 border border-gray-300 hover:bg-gray-50"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="h-12 px-6 text-white transition-all"
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
                                    Next: Work Experience
                                </Button>
                            </div>
                        </form>
                    </Card>
                );
            case 3:
                return (
                    <Card className="border border-gray-200 shadow-sm animate-fadeIn p-6">
                        <h3 className="text-xl font-semibold mb-5">Work Experience (Optional)</h3>
                        <form className="space-y-5">
                            <div id="experience-fields">
                                <div className="experience-entry">
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="work_experience[0].employer">
                                                Employer
                                            </Label>
                                            <Input
                                                {...register(`work_experience.0.employer`)}
                                                className="h-12 px-4 border-gray-200"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="work_experience[0].position">
                                                Position
                                            </Label>
                                            <Input
                                                {...register(`work_experience.0.position`)}
                                                className="h-12 px-4 border-gray-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="work_experience[0].start_date">
                                                Start Date
                                            </Label>
                                            <Input
                                                {...register(`work_experience.0.start_date`)}
                                                type="date"
                                                className="h-12 px-4 border-gray-200"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="work_experience[0].end_date">
                                                End Date
                                            </Label>
                                            <Input
                                                {...register(`work_experience.0.end_date`)}
                                                type="date"
                                                className="h-12 px-4 border-gray-200"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-gray-700 font-medium" htmlFor="work_experience[0].description">
                                            Description
                                        </Label>
                                        <Textarea
                                            {...register(`work_experience.0.description`)}
                                            className="border-gray-200"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="button"
                                    onClick={addExperience}
                                    className="text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    + Add Another Experience
                                </Button>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <Button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="h-12 px-6 text-gray-700 border border-gray-300 hover:bg-gray-50"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setStep(4)}
                                    className="h-12 px-6 text-white transition-all"
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
                                    Next: Personal Statement
                                </Button>
                            </div>
                        </form>
                    </Card>
                );
            case 4:
                return (
                    <Card className="border border-gray-200 shadow-sm animate-fadeIn p-6">
                        <h3 className="text-xl font-semibold mb-5">Personal Statement</h3>
                        <form className="space-y-5">
                            <div className="space-y-2">
                                <Label className="text-gray-700 font-medium" htmlFor="personal_statement">
                                    Why do you want to join our program? (Minimum 250 words)
                                </Label>
                                <Textarea
                                    {...register('personal_statement', {
                                        required: "Personal statement is required",
                                        minLength: { value: 250, message: "Please write at least 250 words" }
                                    })}
                                    className="border-gray-200"
                                    rows={8}
                                    placeholder="Write your personal statement here..."
                                />
                                {errors.personal_statement && <p className="text-red-500 text-sm">{errors.personal_statement.message}</p>}
                                <p className="text-sm text-gray-500">Explain your motivation, career goals, and why you are suitable for this program.</p>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <Button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    className="h-12 px-6 text-gray-700 border border-gray-300 hover:bg-gray-50"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setStep(5)}
                                    className="h-12 px-6 text-white transition-all"
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
                                    Next: References
                                </Button>
                            </div>
                        </form>
                    </Card>
                );
            case 5:
                return (
                    <Card className="border border-gray-200 shadow-sm animate-fadeIn p-6">
                        <h3 className="text-xl font-semibold mb-5">References</h3>
                        <form className="space-y-5">
                            <div id="reference-fields">
                                <div className="reference-entry">
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="references[0].name">
                                                Name
                                            </Label>
                                            <Input
                                                {...register(`references.0.name`, { required: "Reference name is required" })}
                                                className="h-12 px-4 border-gray-200"
                                            />
                                            {errors.references?.[0]?.name && <p className="text-red-500 text-sm">{errors.references[0].name.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="references[0].position">
                                                Position
                                            </Label>
                                            <Input
                                                {...register(`references.0.position`, { required: "Position is required" })}
                                                className="h-12 px-4 border-gray-200"
                                            />
                                            {errors.references?.[0]?.position && <p className="text-red-500 text-sm">{errors.references[0].position.message}</p>}
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <Label className="text-gray-700 font-medium" htmlFor="references[0].institution">
                                            Institution/Organization
                                        </Label>
                                        <Input
                                            {...register(`references.0.institution`, { required: "Institution is required" })}
                                            className="h-12 px-4 border-gray-200"
                                        />
                                        {errors.references?.[0]?.institution && <p className="text-red-500 text-sm">{errors.references[0].institution.message}</p>}
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="references[0].email">
                                                Email
                                            </Label>
                                            <Input
                                                {...register(`references.0.email`, {
                                                    required: "Email is required",
                                                    pattern: {
                                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                        message: "Invalid email address"
                                                    }
                                                })}
                                                type="email"
                                                className="h-12 px-4 border-gray-200"
                                            />
                                            {errors.references?.[0]?.email && <p className="text-red-500 text-sm">{errors.references[0].email.message}</p>}
                                        </div>
                                        <div>
                                            <Label className="text-gray-700 font-medium" htmlFor="references[0].phone">
                                                Phone
                                            </Label>
                                            <Input
                                                {...register(`references.0.phone`, { required: "Phone number is required" })}
                                                className="h-12 px-4 border-gray-200"
                                            />
                                            {errors.references?.[0]?.phone && <p className="text-red-500 text-sm">{errors.references[0].phone.message}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="button"
                                    onClick={addReference}
                                    className="text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    + Add Another Reference
                                </Button>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <Button
                                    type="button"
                                    onClick={() => setStep(4)}
                                    className="h-12 px-6 text-gray-700 border border-gray-300 hover:bg-gray-50"
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSubmitting}
                                    className="h-12 px-6 text-white transition-all"
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
                                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                </Button>
                            </div>
                        </form>
                    </Card>
                );
            case 6:
                return (
                    <Card className="border border-gray-200 shadow-sm animate-fadeIn p-6">
                        <h3 className="text-xl font-semibold mb-5">Upload Documents</h3>
                        {applicationId ? (
                            <DocumentUpload applicationId={applicationId} />
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-red-500">Application ID not found. Please try again.</p>
                                <Button
                                    onClick={() => setStep(1)}
                                    className="mt-4"
                                >
                                    Start Over
                                </Button>
                            </div>
                        )}
                    </Card>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center">
                    {[1, 2, 3, 4, 5, 6].map((stepNumber) => (
                        <div key={stepNumber} className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                                    stepNumber === step
                                        ? 'bg-[#2563EB]'
                                        : stepNumber < step
                                            ? 'bg-[#10B981]'
                                            : 'bg-gray-200'
                                }`}
                            >
                                {stepNumber < step ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    stepNumber
                                )}
                            </div>
                            <span className={`text-xs mt-2 ${stepNumber === step ? 'text-[#2563EB] font-medium' : 'text-gray-500'}`}>
                                {stepNumber === 1 && "Program"}
                                {stepNumber === 2 && "Education"}
                                {stepNumber === 3 && "Experience"}
                                {stepNumber === 4 && "Statement"}
                                {stepNumber === 5 && "References"}
                                {stepNumber === 6 && "Documents"}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="relative mt-2">
                    <div className="absolute h-1 top-0 left-0 right-0 bg-gray-200 rounded-full">
                        <div
                            className="absolute h-1 top-0 left-0 bg-[#2563EB] rounded-full transition-all duration-300"
                            style={{ width: `${((step - 1) / 5) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {renderStep()}
        </div>
    );
}