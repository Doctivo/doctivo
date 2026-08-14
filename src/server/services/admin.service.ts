import { AdminRepository } from '../repositories/admin.repository';

export const AdminService = {
  async getEmployeePayroll() {
    return await AdminRepository.getEmployeePayroll();
  },

  async adjustPayroll(data: any) {
    await AdminRepository.adjustPayroll(data);
  },

  async settlePayroll(employeeId: string) {
    await AdminRepository.settlePayroll(employeeId);
  },

  async getPayrollLogs() {
    return await AdminRepository.getPayrollLogs();
  },

  async getDoctorsCatalog() {
    return await AdminRepository.getDoctorsCatalog();
  },

  async getDoctorsByStatus(status: 'pending' | 'approved') {
    return await AdminRepository.getDoctorsByStatus(status === 'approved');
  },

  async updateDoctorBilling(doctorId: string, data: any) {
    await AdminRepository.updateDoctorBilling(doctorId, data);
  },

  async getAdminUsers() {
    return await AdminRepository.getAdminUsers();
  },

  async createAdminUser(data: any) {
    const id = `ADM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await AdminRepository.createAdminUser(id, data);
  },

  async deleteAdminUser(adminId: string) {
    await AdminRepository.deleteAdminUser(adminId);
  },

  async getAdminMetrics() {
    return await AdminRepository.getAdminMetrics();
  },

  async getAdminBookings() {
    return await AdminRepository.getAdminBookings();
  },

  async cancelAppointment(appointmentId: string) {
    await AdminRepository.cancelAppointment(appointmentId);
  },

  async getAllUsers(role: string) {
    return await AdminRepository.getAllUsers(role);
  },

  async addDoctorDirectly(data: any) {
    const id = `DOC-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await AdminRepository.addDoctorDirectly(id, data);
  },

  async updateDoctor(doctorId: string, data: any) {
    await AdminRepository.updateDoctor(doctorId, data);
  },

  async deleteDoctor(doctorId: string) {
    await AdminRepository.deleteDoctor(doctorId);
  },

  async setAppSetting(key: string, value: any) {
    await AdminRepository.setAppSetting(key, value);
  },

  async getAppSetting(key: string) {
    const value = await AdminRepository.getAppSetting(key);
    return { success: true, value };
  },

  async logAdminAction(adminId: string, actionType: string, targetId: string, details: any) {
    await AdminRepository.logAdminAction(adminId, actionType, targetId, details);
  }
};
