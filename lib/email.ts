import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export interface BookingEmailData {
  bookingId: string
  userName: string
  userEmail: string
  shopName: string
  shopEmail?: string
  appointmentDate: string
  appointmentTime: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  notes?: string | null
  shopAddress?: string
  shopPhone?: string
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email")
    return
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@fixwise.com"
  const formattedDate = new Date(data.appointmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.userEmail,
      subject: `Booking ${data.status === "confirmed" ? "Confirmed" : "Received"} - ${data.shopName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Booking ${data.status === "confirmed" ? "Confirmed" : "Received"}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1A2332 0%, #2D3748 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #fff; margin: 0;">FixWise</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1A2332; margin-top: 0;">
                ${data.status === "confirmed" ? "✅ Booking Confirmed!" : "📅 Booking Received"}
              </h2>
              
              <p>Hello ${data.userName},</p>
              
              <p>
                ${data.status === "confirmed" 
                  ? "Great news! Your booking has been confirmed by the repair shop." 
                  : "Your booking request has been received and is pending confirmation from the repair shop."}
              </p>
              
              <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1A2332;">
                <h3 style="margin-top: 0; color: #1A2332;">Booking Details</h3>
                <p><strong>Shop:</strong> ${data.shopName}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${data.appointmentTime}</p>
                ${data.shopAddress ? `<p><strong>Address:</strong> ${data.shopAddress}</p>` : ""}
                ${data.shopPhone ? `<p><strong>Phone:</strong> ${data.shopPhone}</p>` : ""}
                ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
                <p><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: bold; color: ${
                  data.status === "confirmed" ? "#10b981" : 
                  data.status === "completed" ? "#3b82f6" : 
                  data.status === "cancelled" ? "#ef4444" : "#f59e0b"
                };">${data.status}</span></p>
              </div>
              
              ${data.status === "pending" ? `
                <p style="color: #6b7280; font-size: 14px;">
                  You will receive another email once the shop confirms your booking.
                </p>
              ` : ""}
              
              ${data.status === "confirmed" ? `
                <p style="color: #059669; font-weight: bold;">
                  Please arrive on time for your appointment. If you need to reschedule or cancel, please contact the shop directly.
                </p>
              ` : ""}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                <p>This is an automated email from FixWise. Please do not reply to this email.</p>
                <p>If you have questions, please contact ${data.shopEmail || "the repair shop"} directly.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    // Also send notification to shop owner if email is available
    if (data.shopEmail && data.status === "pending") {
      await resend.emails.send({
        from: fromEmail,
        to: data.shopEmail,
        subject: `New Booking Request - ${data.userName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Booking Request</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #1A2332 0%, #2D3748 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: #fff; margin: 0;">FixWise</h1>
              </div>
              
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                <h2 style="color: #1A2332; margin-top: 0;">📅 New Booking Request</h2>
                
                <p>Hello,</p>
                
                <p>You have received a new booking request for <strong>${data.shopName}</strong>.</p>
                
                <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1A2332;">
                  <h3 style="margin-top: 0; color: #1A2332;">Booking Details</h3>
                  <p><strong>Customer:</strong> ${data.userName}</p>
                  <p><strong>Email:</strong> ${data.userEmail}</p>
                  <p><strong>Date:</strong> ${formattedDate}</p>
                  <p><strong>Time:</strong> ${data.appointmentTime}</p>
                  ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
                  <p><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: bold; color: #f59e0b;">Pending</span></p>
                </div>
                
                <p style="color: #059669; font-weight: bold;">
                  Please log in to your dashboard to confirm or manage this booking.
                </p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                  <p>This is an automated email from FixWise.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      })
    }
  } catch (error) {
    console.error("Error sending booking email:", error)
    // Don't throw - email failures shouldn't break the booking process
  }
}

export async function sendBookingStatusUpdateEmail(data: BookingEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not configured, skipping email")
    return
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@fixwise.com"
  const formattedDate = new Date(data.appointmentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const statusMessages: Record<string, { subject: string; message: string; color: string }> = {
    confirmed: {
      subject: "Booking Confirmed",
      message: "Great news! Your booking has been confirmed.",
      color: "#10b981",
    },
    cancelled: {
      subject: "Booking Cancelled",
      message: "Your booking has been cancelled.",
      color: "#ef4444",
    },
    completed: {
      subject: "Booking Completed",
      message: "Your booking has been marked as completed.",
      color: "#3b82f6",
    },
  }

  const statusInfo = statusMessages[data.status] || {
    subject: "Booking Status Updated",
    message: "Your booking status has been updated.",
    color: "#6b7280",
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: data.userEmail,
      subject: `${statusInfo.subject} - ${data.shopName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${statusInfo.subject}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1A2332 0%, #2D3748 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: #fff; margin: 0;">FixWise</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
              <h2 style="color: #1A2332; margin-top: 0;">
                ${data.status === "confirmed" ? "✅ Booking Confirmed!" : 
                  data.status === "cancelled" ? "❌ Booking Cancelled" : 
                  "✅ Booking Completed"}
              </h2>
              
              <p>Hello ${data.userName},</p>
              
              <p>${statusInfo.message}</p>
              
              <div style="background: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusInfo.color};">
                <h3 style="margin-top: 0; color: #1A2332;">Booking Details</h3>
                <p><strong>Shop:</strong> ${data.shopName}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${data.appointmentTime}</p>
                <p><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: bold; color: ${statusInfo.color};">${data.status}</span></p>
              </div>
              
              ${data.status === "confirmed" ? `
                <p style="color: #059669; font-weight: bold;">
                  Please arrive on time for your appointment. If you need to reschedule or cancel, please contact the shop directly.
                </p>
              ` : data.status === "cancelled" ? `
                <p style="color: #6b7280;">
                  If you need to book a new appointment, please visit our website or contact the shop directly.
                </p>
              ` : ""}
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                <p>This is an automated email from FixWise. Please do not reply to this email.</p>
                <p>If you have questions, please contact ${data.shopEmail || "the repair shop"} directly.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })
  } catch (error) {
    console.error("Error sending status update email:", error)
  }
}

