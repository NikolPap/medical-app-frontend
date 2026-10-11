export interface Appointment {
    id: number;
    doctorId?: number; // <-- NEU HINZUGEFÜGT
    doctorEmail: string;
    doctorName: string; 
    doctorSpecialty: string;
    doctorAddress?: string; 
    doctorPhone?: string;   
    
    patientEmail: string;
    patientName: string; 
    patientPhone?: string;   
    patientGender?: string;  
    patientInsurance?: string;
    
    appointmentDate: string; 
    status: string;
}

export interface DoctorSchedule {
    id: number;
    dayOfWeek: string;
    startTime: string; 
    endTime: string;   
}

export interface DoctorHoliday {
    id: number;
    holidayDate: string; 
}

export interface ApiResponse {
    message?: string;
    error?: string;
    token?: string;
    role?: string;
}

export interface DoctorInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;  
  specialty: string; 
  address: string;  
  slotDuration?: number;
}

export interface PendingDoctor {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  specialty: string;
  address: string;
  phoneNumber: string;
}