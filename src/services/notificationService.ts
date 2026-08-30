export interface ReminderPayload {
  pollId: string;
  pollTitle: string;
  deadline: string;
  pollLink: string;
  pendingStudents: Array<{
    rollNumber: string;
    registerNumber?: string;
    studentName: string;
    department?: string;
    section?: string;
    phoneNumber?: string;
    email?: string;
  }>;
}

export const NotificationService = {
  /**
   * Format standard reminder message according to requirements
   */
  formatReminderMessage(data: ReminderPayload): string {
    const studentList = data.pendingStudents.length > 0
      ? data.pendingStudents.map(s => `• ${s.studentName} (${s.registerNumber || s.rollNumber})`).join('\n')
      : 'None';

    return `📢 Reminder

Dear Students,

You have not yet submitted your response for today's poll.

Please complete it before the deadline.

Poll:
${data.pollTitle}

Deadline:
${data.deadline}

Poll Link:
${data.pollLink}

Pending Students (${data.pendingStudents.length}):
${studentList}

Thank you.`;
  },

  /**
   * Dispatch reminder via requested channel.
   * Designed so that WhatsApp Business API or SMS Gateway integrations can be added seamlessly in the future without altering UI code.
   */
  async dispatchReminder(
    channel: 'whatsapp_web' | 'whatsapp_business_api' | 'sms_gateway' | 'clipboard',
    payload: ReminderPayload,
    customMessage?: string
  ) {
    const message = customMessage || this.formatReminderMessage(payload);

    // Record reminder dispatch with server API for analytics/audit logs
    try {
      await fetch(`/api/polls/${payload.pollId}/reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          message,
          recipientCount: payload.pendingStudents.length,
          recipients: payload.pendingStudents.map(s => s.registerNumber || s.rollNumber)
        })
      });
    } catch (e) {
      console.warn('Notification log warning:', e);
    }

    if (channel === 'whatsapp_web') {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      return { success: true, method: 'WhatsApp Web' };
    }

    if (channel === 'clipboard') {
      await navigator.clipboard.writeText(message);
      return { success: true, method: 'Clipboard' };
    }

    if (channel === 'whatsapp_business_api') {
      // Future ready endpoint integration point for Meta WhatsApp Business Cloud API
      console.log('[Future API] Sending via WhatsApp Business API Cloud endpoint...', {
        pollId: payload.pollId,
        message,
        recipients: payload.pendingStudents
      });
      return { success: true, method: 'WhatsApp Business API' };
    }

    if (channel === 'sms_gateway') {
      // Future ready endpoint integration point for Twilio / SMS Gateway
      console.log('[Future API] Sending via SMS Gateway endpoint...', {
        pollId: payload.pollId,
        message,
        recipients: payload.pendingStudents
      });
      return { success: true, method: 'SMS Gateway' };
    }

    return { success: true, method: channel };
  }
};
