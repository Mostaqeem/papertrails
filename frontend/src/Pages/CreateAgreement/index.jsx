import axiosInstance from '../../axiosConfig';
import AgreementForm from '../../components/Agreement/AgreementForm';
import { useAgreementContext } from '../../context/AgreementContext';
import { useNavigate } from 'react-router-dom';

export default function CreateAgreement() {
  const { agreementData, setAgreementData, isEditing, stopEditing } = useAgreementContext();
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    // Save data to context first
    setAgreementData(data);

    // Immediately navigate to preview screen
    navigate('/agreements/preview');

    // Prepare payload to send to backend
    const payload = {
      title: data.agreementTitle,
      agreement_type: data.type,
      start_date: data.startDate,
      expiry_date: data.expiryDate,
      reminder_time: data.reminderDate,
      department: data.department,
      // status: data.status, // Commented out - status is now automatic
      created_by: 1,  // later, replace with logged-in user's id
    };

    // Send POST request to backend API
    try{
      const responce = await axiosInstance.post('agreements/', payload);
      console.log('✅ Agreement created:', responce.data);
      if (isEditing) {
        stopEditing();
      }
    } catch(err){
      console.error('❌ Error creating agreement:', err);
      throw new Error('Failed to create agreement');
    }
  };

  return <AgreementForm onSubmit={handleSubmit} initialData={agreementData} />;
}
