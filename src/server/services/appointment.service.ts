import { AppointmentRepository } from '../repositories/appointment.repository';
import { Appointment } from '@/types';
import { sendTransactionalEmail } from '@/actions/auth'; // Should be moved to EmailService

export const AppointmentService = {
  async createAppointment(app: Partial<Appointment>) {
    return await AppointmentRepository.create(app);
  },

  async getUserAppointments(userId: string) {
    return await AppointmentRepository.findByUserId(userId);
  },

  async getAppointmentById(id: string) {
    return await AppointmentRepository.findById(id);
  },

  async getDoctorAppointmentsForDate(doctorId: string, dateStr: string) {
    return await AppointmentRepository.findDoctorAppointmentsForDate(doctorId, dateStr);
  },

  async updateAppointmentStatus(appointmentId: string, status: string) {
    await AppointmentRepository.updateStatus(appointmentId, status);
  },

  async verifyVisitOtp(appointmentId: string, otp: string) {
    await AppointmentRepository.verifyVisitOtp(appointmentId, otp);
  },

  async getBookedSlots(doctorId: string, date: string) {
    return await AppointmentRepository.getBookedSlots(doctorId, date);
  },

  async rescheduleAppointment(appId: string, newDate: string, newTime: string) {
    await AppointmentRepository.reschedule(appId, newDate, newTime);
  }
};
