/**
 * IntriHub Universal Responsive Email Templates
 * Pixel-perfect HTML templates with cross-client support (Gmail, Apple Mail, Outlook, Yahoo).
 */

export interface OtpEmailOptions {
  otp: string;
  purpose?: string;
  minutes?: number;
  language?: string;
}

export function renderOtpEmailHtml({
  otp,
  purpose = "login",
  minutes = 10,
  language = "en",
}: OtpEmailOptions): string {
  const digits = (otp || "000000").replace(/\D/g, "").slice(0, 6).split("");
  // Ensure we have 6 boxes
  while (digits.length < 6) {
    digits.push("•");
  }

  const isHindi = language === "hi";
  const isKannada = language === "kn";

  const titlePre = isHindi ? "आपका लॉगिन" : isKannada ? "ನಿಮ್ಮ ಲಾಗಿನ್" : "Your Login";
  const titleHighlight = isHindi ? "सत्यापन" : isKannada ? "ಪರಿಶೀಲನಾ" : "Verification";
  const titlePost = isHindi ? "कोड" : isKannada ? "ಕೋಡ್" : "Code";

  const subtitle = isHindi
    ? "अपने Intrihub खाते में सुरक्षित रूप से साइन इन करने के लिए नीचे दिए गए 6-अंकों के कोड का उपयोग करें।"
    : isKannada
    ? "ನಿಮ್ಮ Intrihub ಖಾತೆಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಸೈನ್ ಇನ್ ಮಾಡಲು ಕೆಳಗಿನ 6-ಅಂಕಿಯ ಕೋಡ್ ಬಳಸಿ."
    : "Use the 6-digit code below to securely sign into your Intrihub account.";

  const expireText = isHindi
    ? `यह कोड <strong style="color: #0284C7; font-weight: 800;">${minutes} मिनट</strong> में समाप्त हो जाएगा।`
    : isKannada
    ? `ಈ ಕೋಡ್ <strong style="color: #0284C7; font-weight: 800;">${minutes} ನಿಮಿಷಗಳಲ್ಲಿ</strong> ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ.`
    : `This code will expire in <strong style="color: #0284C7; font-weight: 800;">${minutes} minutes</strong>.`;

  const securityWarn = isHindi
    ? "सुरक्षा के लिए, यह कोड कभी किसी के साथ साझा न करें।"
    : isKannada
    ? "ಭದ್ರತೆಗಾಗಿ, ಈ ಕೋಡ್ ಅನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ."
    : "For your security, never share this code with anyone.";

  const badge1 = isHindi ? "खाता सुरक्षित<br />रखें" : isKannada ? "ಖಾತೆ ಸುರಕ್ಷಿತವಾಗಿರಿಸಿ" : "Keep your<br />account safe";
  const badge2 = isHindi ? "कोड साझा<br />ना करें" : isKannada ? "ಕೋಡ್ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ" : "Do not share<br />this code";
  const badge3 = isHindi ? "सिर्फ आपके<br />उपयोग के लिए" : isKannada ? "ನಿಮ್ಮ ಬಳಕೆಗೆ ಮಾತ್ರ" : "This code is<br />for your use only";

  const footerOfficial = isHindi
    ? "IntriHub की एकमात्र आधिकारिक वेबसाइट <a href=\"https://www.intrihub.com\" target=\"_blank\" style=\"color: #38BDF8; font-weight: 700; text-decoration: none;\">www.intrihub.com</a> है। हम किसी अन्य मिलती-जुलती वेबसाइट से संबद्ध नहीं हैं।"
    : isKannada
    ? "IntriHub ನ ಏಕೈಕ ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ <a href=\"https://www.intrihub.com\" target=\"_blank\" style=\"color: #38BDF8; font-weight: 700; text-decoration: none;\">www.intrihub.com</a>. ನಾವು ಬೇರೆ ಯಾವುದೇ ವೆಬ್‌ಸೈಟ್‌ನೊಂದಿಗೆ ಸಂಯೋಜಿತವಾಗಿಲ್ಲ."
    : "IntriHub&apos;s only official website is <a href=\"https://www.intrihub.com\" target=\"_blank\" style=\"color: #38BDF8; font-weight: 700; text-decoration: none;\">www.intrihub.com</a>.<br />We are not affiliated with any other website using a similar name.";

  const footerIgnore = isHindi
    ? "यदि आपने इस सत्यापन कोड का अनुरोध नहीं किया है, तो आप इस ईमेल को सुरक्षित रूप से अनदेखा कर सकते हैं।"
    : isKannada
    ? "ನೀವು ಈ ಪರಿಶೀಲನಾ ಕೋಡ್ ಅನ್ನು ವಿನಂತಿಸದಿದ್ದರೆ, ಈ ಇಮೇಲ್ ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ನಿರ್ಲಕ್ಷಿಸಬಹುದು."
    : "If you did not request this verification code, you can safely ignore this email.";

  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no" />
  <title>Your IntriHub Verification Code: ${otp}</title>
  <style type="text/css">
    /* Force mobile clients to respect viewport */
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 480px) {
      .otp-digit { width: 36px !important; height: 52px !important; line-height: 52px !important; font-size: 26px !important; border-radius: 10px !important; }
      .otp-cell { padding: 0 2px !important; }
      .card-body { padding: 24px 16px 20px 16px !important; }
      .badge-icon { width: 36px !important; height: 36px !important; border-radius: 18px !important; line-height: 36px !important; font-size: 16px !important; }
      .footer-cell { padding: 18px 16px 16px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F1F5F9; padding: 24px 8px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; width: 100%; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(5, 42, 81, 0.12); border: 1px solid #E2E8F0;">
          
          <!-- 1. Hero Navy Header with 3D Visual Graphic Banner -->
          <tr>
            <td align="center" style="background-color: #08294D; padding: 0; line-height: 0; border-top-left-radius: 20px; border-top-right-radius: 20px; overflow: hidden;">
              <img
                src="https://www.intrihub.com/images/email/otp-hero-banner.jpg"
                alt="IntriHub QuickCommerce - Your Login Verification Code: Use the 6-digit code below to securely sign into your Intrihub account."
                width="480"
                style="display: block; width: 100%; max-width: 480px; height: auto; border: 0; outline: none; text-decoration: none; border-top-left-radius: 20px; border-top-right-radius: 20px; background-color: #08294D; color: #FFFFFF; font-size: 15px; font-weight: bold; text-align: center; line-height: 1.4;"
              />
            </td>
          </tr>

          <!-- 2. White Card Content Section -->
          <tr>
            <td class="card-body" style="padding: 28px 20px 24px 20px; background-color: #FFFFFF;">
              
              <!-- 6 Discrete OTP Digit Boxes -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 26px auto; width: auto;">
                <tr>
                  ${digits
                    .map(
                      (d) => `
                    <td align="center" class="otp-cell" style="padding: 0 3px;">
                      <div class="otp-digit" style="background-color: #EBF4FC; border: 1.5px solid #D0E5F7; border-radius: 12px; width: 42px; height: 58px; line-height: 58px; text-align: center; font-size: 30px; font-weight: 800; color: #052A51; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 2px 5px rgba(5,42,81,0.06);">
                        ${d}
                      </div>
                    </td>
                  `
                    )
                    .join("")}
                </tr>
              </table>

              <!-- Alert Expiration Banner -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F0F7FF; border: 1px solid #BAE6FD; border-radius: 14px; margin-bottom: 26px;">
                <tr>
                  <td style="padding: 14px 0 14px 16px; vertical-align: middle; width: 42px;">
                    <div style="width: 36px; height: 36px; border-radius: 18px; background-color: #0284C7; text-align: center; line-height: 36px; color: #FFFFFF; font-size: 18px;">
                      ⏱
                    </div>
                  </td>
                  <td style="padding: 14px 16px 14px 12px; vertical-align: middle;">
                    <div style="font-size: 13px; font-weight: 600; color: #0369A1; line-height: 1.4;">
                      ${expireText}
                    </div>
                    <div style="font-size: 12px; color: #0C4A6E; line-height: 1.4; margin-top: 2px;">
                      ${securityWarn}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- 3 Security Badges Row -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
                <tr>
                  <!-- Badge 1: Keep safe -->
                  <td align="center" style="width: 33.33%; padding: 8px 4px; border-right: 1px solid #E2E8F0; vertical-align: top;">
                    <div class="badge-icon" style="width: 40px; height: 40px; border-radius: 20px; background-color: #E0F2FE; color: #0284C7; font-size: 18px; line-height: 40px; text-align: center; margin: 0 auto 8px auto;">
                      🔒
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: #1E293B; line-height: 1.35;">
                      ${badge1}
                    </div>
                  </td>

                  <!-- Badge 2: Do not share -->
                  <td align="center" style="width: 33.33%; padding: 8px 4px; border-right: 1px solid #E2E8F0; vertical-align: top;">
                    <div class="badge-icon" style="width: 40px; height: 40px; border-radius: 20px; background-color: #E0F2FE; color: #0284C7; font-size: 18px; line-height: 40px; text-align: center; margin: 0 auto 8px auto;">
                      👁️
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: #1E293B; line-height: 1.35;">
                      ${badge2}
                    </div>
                  </td>

                  <!-- Badge 3: For your use only -->
                  <td align="center" style="width: 33.33%; padding: 8px 4px; vertical-align: top;">
                    <div class="badge-icon" style="width: 40px; height: 40px; border-radius: 20px; background-color: #E0F2FE; color: #0284C7; font-size: 18px; line-height: 40px; text-align: center; margin: 0 auto 8px auto;">
                      🛡️
                    </div>
                    <div style="font-size: 11px; font-weight: 700; color: #1E293B; line-height: 1.35;">
                      ${badge3}
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- 3. Bottom Dark Navy Footer -->
          <tr>
            <td class="footer-cell" style="background-color: #05203C; padding: 22px 20px 18px 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; line-height: 1.5; color: #94A3B8;">
                ${footerOfficial}
              </p>
              <div style="border-top: 1px solid rgba(255, 255, 255, 0.12); margin: 12px auto; width: 85%;"></div>
              <p style="margin: 0; font-size: 11px; line-height: 1.4; color: #64748B;">
                ${footerIgnore}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
