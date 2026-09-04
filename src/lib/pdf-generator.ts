import { Appointment } from '@/types';
import type { jsPDF } from 'jspdf';

/**
 * Professional Doctivo Digital Ticket Generator.
 * Enriched with patient vitals and symptoms while keeping Rx space clear.
 */
export const generateProfessionalPDF = async (appointment: Appointment): Promise<jsPDF> => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4'
  });

  const blue = '#007cc3';
  const lime = '#a6ce39';
  const dark = '#1e293b';
  const gray = '#94a3b8';
  const light = '#f8fafc';

  // --- HEADER DESIGN ---
  pdf.setFillColor(blue);
  pdf.moveTo(0, 0);
  pdf.lineTo(210, 0);
  pdf.lineTo(210, 31.5);
  pdf.curveTo(157.5, 18.3, 78.75, 63, 0, 44.6);
  pdf.lineTo(0, 0);
  pdf.fill();

  pdf.setFillColor(lime);
  pdf.moveTo(0, 49.8);
  pdf.curveTo(47.2, 36.7, 118.1, 68.2, 210, 34.1);
  pdf.lineTo(210, 40.6);
  pdf.curveTo(118.1, 74.8, 47.2, 43.3, 0, 56.4);
  pdf.lineTo(0, 49.8);
  pdf.fill();

  // --- LOGO (TOP LEFT) - Enhanced Size ---
  try {
    const logoUrl = '/logo.png';
    pdf.addImage(logoUrl, 'JPEG', 15, 6, 25, 25);
  } catch (e) {
    console.warn('Could not add logo to PDF:', e);
  }

  // --- BRANDING (Right Aligned) ---
  pdf.setTextColor('#ffffff');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.text('DOCTIVO', 195, 15, { align: 'right' });
  
  pdf.setTextColor('#000000');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.text('Healthcare Simplified', 195, 20, { align: 'right' });

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Medical Road, Gorakhpur, UP - 273001', 195, 28, { align: 'right' });
  pdf.text('Phone: +91 73079 86604', 195, 32, { align: 'right' });

  // --- DOCUMENT BODY ---
  pdf.setTextColor(blue);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BOOKING TICKET', 15, 65);
  pdf.setDrawColor(blue);
  pdf.setLineWidth(0.5);
  pdf.line(15, 67, 85, 67);

  // Security & Queue Bar (Compact but highlighted)
  pdf.setFillColor(dark);
  pdf.roundedRect(15, 75, 180, 18, 4, 4, 'F');
  
  pdf.setTextColor('#ffffff');
  pdf.setFontSize(8);
  pdf.text('TOKEN NUMBER', 25, 83);
  pdf.setFontSize(18);
  pdf.text(`#${appointment.tokenNumber || 1}`, 25, 90);

  pdf.setFontSize(8);
  pdf.text('VERIFICATION OTP', 110, 83);
  pdf.setFontSize(18);
  pdf.text(String(appointment.visit_otp || '123456'), 110, 90);

  pdf.setFontSize(8);
  pdf.text('TIME SLOT', 165, 83);
  pdf.setFontSize(12);
  pdf.text(String(appointment.time || ''), 165, 90);

  // Patient Info Block
  const infoY = 105;
  pdf.setTextColor(gray);
  pdf.setFontSize(8);
  pdf.text('PATIENT IDENTITY', 15, infoY);
  
  pdf.setTextColor(dark);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(String(appointment.patientName || 'Unknown Patient').toUpperCase(), 15, infoY + 6);

  // Vitals Row
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const vitalsText = `Age: ${appointment.patientAge || 'N/A'}  |  Gender: ${appointment.patientGender || 'N/A'}  |  Blood Group: ${appointment.patientBloodGroup || 'N/A'}`;
  pdf.text(vitalsText, 15, infoY + 12);

  // Divider
  pdf.setDrawColor(240, 240, 240);
  pdf.line(15, infoY + 15, 195, infoY + 15);

  // Symptoms Block
  pdf.setTextColor(gray);
  pdf.setFontSize(8);
  pdf.text('PRESENTING SYMPTOMS', 15, infoY + 22);
  pdf.setTextColor(dark);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  const symptomsText = String(appointment.current_symptoms || 'General Medical Consultation / Routine Checkup');
  const splitSymptoms = pdf.splitTextToSize(symptomsText, 175);
  pdf.text(splitSymptoms, 15, infoY + 27);

  // Medical Info (Doctor/Date/ID)
  const medicalY = 155;
  pdf.setDrawColor(light);
  pdf.setFillColor(light);
  pdf.roundedRect(15, medicalY, 180, 25, 4, 4, 'F');

  pdf.setTextColor(gray);
  pdf.setFontSize(7);
  pdf.text('REFERRING DOCTOR', 25, medicalY + 8);
  pdf.setTextColor(dark);
  pdf.setFontSize(11);
  pdf.text(String(appointment.doctorName || ''), 25, medicalY + 16);

  pdf.setTextColor(gray);
  pdf.setFontSize(7);
  pdf.text('APPOINTMENT DATE', 110, medicalY + 8);
  pdf.setTextColor(dark);
  pdf.setFontSize(11);
  pdf.text(String(appointment.date || ''), 110, medicalY + 16);

  pdf.setTextColor(gray);
  pdf.setFontSize(7);
  pdf.text('BOOKING ID', 165, medicalY + 8);
  pdf.setTextColor(dark);
  pdf.setFontSize(9);
  pdf.text(`#${String(appointment.id || '').slice(-6).toUpperCase()}`, 165, medicalY + 16);

  // Rx SECTION (Ample clean space)
  const rxY = 195;
  pdf.setTextColor('#e2e8f0');
  pdf.setFontSize(40);
  pdf.setFont('times', 'italic');
  pdf.text('Rx', 15, rxY);

  // FOOTER DESIGN
  const footerBaseY = 265;
  pdf.setFillColor(lime);
  pdf.moveTo(210, 297);
  pdf.lineTo(0, 297);
  pdf.lineTo(0, footerBaseY + 13.1);
  pdf.curveTo(52.5, footerBaseY + 7.8, 118.1, footerBaseY + 31.5, 210, footerBaseY + 10.5);
  pdf.lineTo(210, 297);
  pdf.fill();
  
  pdf.setFillColor(blue);
  pdf.moveTo(210, 297);
  pdf.lineTo(105, 297);
  pdf.curveTo(144.3, footerBaseY + 18.3, 170.6, footerBaseY + 23.6, 210, footerBaseY + 15.7);
  pdf.lineTo(210, 297);
  pdf.fill();

  pdf.setTextColor('#ffffff');
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Valid for visit at Doctivo Clinics. Please present this ticket at counter.', 15, 293);

  return pdf;
};

export const getPDFBlob = async (appointment: Appointment): Promise<Blob> => {
  const pdf = await generateProfessionalPDF(appointment);
  return pdf.output('blob');
};

export const getPDFBase64 = async (appointment: Appointment): Promise<string> => {
  const pdf = await generateProfessionalPDF(appointment);
  return pdf.output('datauristring');
};
