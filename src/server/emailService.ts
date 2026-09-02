// Email Dispatch & Notification Simulation Service for Hishab Khata
// Handles high-priority system email alerts to Admins & Users

export interface EmailLogEntry {
  id: string;
  to: string;
  from: string;
  subject: string;
  type: 'admin_subscription_alert' | 'user_subscription_approved' | 'user_subscription_rejected' | 'security_alert';
  preview: string;
  htmlContent?: string;
  status: 'sent' | 'queued' | 'delivered';
  metadata?: Record<string, any>;
  sentAt: string;
}

export function sendAdminSubscriptionNotification(
  adminEmails: string[],
  details: {
    userName: string;
    userEmail: string;
    plan: string;
    billingCycle: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    senderNumberOrAccount: string;
    transactionId: string;
    notes?: string;
  }
): EmailLogEntry[] {
  const now = new Date().toISOString();
  const primaryAdmin = 'sultanitbangladesh@gmail.com';
  const targetEmails = Array.from(new Set([primaryAdmin, ...adminEmails].filter(Boolean)));

  return targetEmails.map((toEmail, idx) => {
    const subject = `🔔 [PRO Upgrade Alert] New ${details.paymentMethod.toUpperCase()} Payment (${details.amount} ${details.currency}) from ${details.userName}`;
    const preview = `User ${details.userName} (${details.userEmail}) applied for ${details.billingCycle.toUpperCase()} PRO via ${details.paymentMethod.toUpperCase()}. TrxID: ${details.transactionId}.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <div style="background-color: #0f766e; padding: 20px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Hishab Khata Admin Alert</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">New Subscription Payment Submission</p>
        </div>
        
        <div style="background-color: white; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #cbd5e1;">
          <h2 style="font-size: 16px; color: #0f172a; margin-top: 0;">Payment Verification Required</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 16px 0;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>User Name:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; text-align: right;">${details.userName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>User Email:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; text-align: right;">${details.userEmail}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Plan Tier:</strong></td>
              <td style="padding: 8px 0; color: #0f766e; font-weight: bold; text-align: right;">PRO (${details.billingCycle.toUpperCase()})</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Amount:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold; text-align: right;">${details.amount} ${details.currency}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-weight: bold; text-align: right;">${details.paymentMethod.toUpperCase()}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Sender Account/Mobile:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: bold; text-align: right;">${details.senderNumberOrAccount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 8px 0; color: #64748b;"><strong>Transaction ID (TrxID):</strong></td>
              <td style="padding: 8px 0; color: #0f766e; font-family: monospace; font-size: 15px; font-weight: 800; text-align: right;">${details.transactionId}</td>
            </tr>
            ${details.notes ? `
            <tr>
              <td style="padding: 8px 0; color: #64748b;"><strong>User Notes:</strong></td>
              <td style="padding: 8px 0; color: #334155; text-align: right; font-style: italic;">"${details.notes}"</td>
            </tr>` : ''}
          </table>
          
          <div style="margin-top: 20px; text-align: center;">
            <p style="font-size: 12px; color: #64748b;">Please open the SuperAdmin Panel -> Subscription Payments tab to verify and approve this transaction.</p>
          </div>
        </div>
      </div>
    `;

    return {
      id: `eml-admin-${Date.now()}-${idx}`,
      to: toEmail,
      from: 'billing@hishabkhata.io',
      subject,
      type: 'admin_subscription_alert',
      preview,
      htmlContent,
      status: 'sent',
      metadata: { ...details },
      sentAt: now,
    };
  });
}

export function sendUserApprovalNotification(
  user: { name: string; email: string },
  payment: {
    amount: number;
    currency: string;
    billingCycle: string;
    paymentMethod: string;
    transactionId: string;
  }
): EmailLogEntry {
  const now = new Date().toISOString();
  const subject = `🎉 Congratulations ${user.name}! Your Hishab Khata PRO Subscription is Active`;
  const preview = `Your ${payment.paymentMethod.toUpperCase()} payment of ${payment.amount} ${payment.currency} (TrxID: ${payment.transactionId}) has been verified. Unlimited Wallets & Gemini 3.7 AI are now unlocked!`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="background-color: #0f766e; padding: 24px; border-radius: 12px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 900;">🎉 Welcome to Hishab Khata VIP PRO!</h1>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.95;">Payment Verified & Subscription Activated</p>
      </div>
      
      <div style="background-color: white; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #cbd5e1;">
        <p style="font-size: 15px; color: #1e293b; margin-top: 0;">Dear <strong>${user.name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Thank you for subscribing to Hishab Khata PRO. Your payment of <strong>${payment.amount} ${payment.currency}</strong> via <strong>${payment.paymentMethod.toUpperCase()}</strong> (TrxID: <code>${payment.transactionId}</code>) has been successfully verified and approved by our team.
        </p>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <h3 style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-weight: bold;">Unlocked VIP Benefits:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #15803d; font-size: 13px; line-height: 1.7;">
            <li>Unlimited Multi-Currency Wallets & Accounts</li>
            <li>Unlimited Monthly Transactions & Income/Expense Tracking</li>
            <li>Gemini 3.7 AI Smart Financial Coach & Budget Intelligence</li>
            <li>Full High-Resolution PDF & Excel Export Reports</li>
            <li>Priority 24/7 Support & VIP Status</li>
          </ul>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px;">
          Thank you for choosing Hishab Khata — Smart, Secure, & Modern Accounting.
        </p>
      </div>
    </div>
  `;

  return {
    id: `eml-user-${Date.now()}`,
    to: user.email,
    from: 'support@hishabkhata.io',
    subject,
    type: 'user_subscription_approved',
    preview,
    htmlContent,
    status: 'sent',
    metadata: { ...payment, userName: user.name },
    sentAt: now,
  };
}

export function sendUserRejectionNotification(
  user: { name: string; email: string },
  payment: {
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    adminNotes?: string;
  }
): EmailLogEntry {
  const now = new Date().toISOString();
  const subject = `⚠️ Important Notice: Hishab Khata Subscription Verification`;
  const preview = `Your payment submission (TrxID: ${payment.transactionId}) could not be verified. Reason: ${payment.adminNotes || 'Verification error'}.`;

  return {
    id: `eml-rej-${Date.now()}`,
    to: user.email,
    from: 'billing@hishabkhata.io',
    subject,
    type: 'user_subscription_rejected',
    preview,
    status: 'sent',
    metadata: { ...payment, userName: user.name },
    sentAt: now,
  };
}
