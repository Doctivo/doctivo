import { DoctorRepository } from '../repositories/doctor.repository';
import { sendTransactionalEmail } from '@/app/actions/auth-actions'; // This should ideally be moved to an EmailService later

export const DoctorService = {
  async getDoctors(specialty?: string, searchQuery?: string) {
    return await DoctorRepository.findDoctors(specialty, searchQuery);
  },

  async getDoctorById(id: string) {
    return await DoctorRepository.findById(id);
  },

  async getSpecialties() {
    return await DoctorRepository.findSpecialties();
  },

  async getDoctorAttendants(doctorId: string) {
    return await DoctorRepository.findAttendantsByDoctorId(doctorId);
  },

  async addAttendant(attendantData: any, doctorId: string) {
    const doctor = await DoctorRepository.findById(doctorId);
    if (!doctor) {
      throw new Error('Managing doctor not found.');
    }

    const attendantId = `ATT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await DoctorRepository.addAttendant(attendantId, attendantData, doctorId);

    if (attendantData.email) {
      const welcomeHtml = `
        <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 500px; margin: auto; border: 1px solid #e2e8f0; border-radius: 24px; background-color: #ffffff;">
          <h2 style="color: #2563eb; text-align: center;">Welcome to Doctivo</h2>
          <p>Hello <strong>${attendantData.name}</strong>,</p>
          <p>You have been added as an attendant for Dr. ${doctor.name}.</p>
          <p><strong>Your Attendant ID:</strong> ${attendantId}</p>
          <p>Login at <a href="https://doctivo.in/login">doctivo.in/login</a></p>
        </div>
      `;
      await sendTransactionalEmail(attendantData.email, attendantData.name, 'Welcome to Doctivo!', welcomeHtml);
    }

    return attendantId;
  },

  async updateDoctorSchedule(doctorId: string, defaultSchedule: any, customSchedule: any) {
    await DoctorRepository.updateSchedule(doctorId, defaultSchedule, customSchedule);
  },

  async updateDoctorServices(doctorId: string, services: string[]) {
    await DoctorRepository.updateServices(doctorId, services);
  }
};
