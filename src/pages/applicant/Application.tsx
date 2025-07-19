// import MultiStepForm from '@/components/forms/MultiStepForm';
//
// export default function Application() {
//     return (
//         <div className="space-y-4">
//             <h2 className="text-xl font-semibold">New Application</h2>
//             <MultiStepForm />
//         </div>
//     );
// }
import MultiStepForm from '@/components/forms/MultiStepForm';

export default function Application() {
    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">New Application</h2>
                <div className="bg-blue-100 text-primary px-3 py-1 rounded-full text-sm font-medium">
                    Submit application
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gradient-to-r from-primary-light/10 to-secondary-light/10 p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800">Complete Your Application</h3>
                    <p className="text-gray-600 text-sm mt-1">
                        Please fill out all required information to submit your application
                    </p>
                </div>
                <div className="p-6">
                    <MultiStepForm />
                </div>
            </div>
        </div>
    );
}