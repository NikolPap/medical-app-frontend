export interface Appointment {
    id: number;
    doctorEmail: string;
    doctorName: string; // NEU
    doctorSpecialty: string; // NEU
    patientEmail: string;
    patientName: string; // NEU
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