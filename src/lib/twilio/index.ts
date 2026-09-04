
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const sendOTP = async (to: string, code: string) => {
  try {
    const message = await client.messages.create({
      body: `Your Doctivo verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });
    return { success: true, sid: message.sid };
  } catch (error: any) {
    console.error('Twilio Error:', error);
    return { success: false, error };
  }
};
