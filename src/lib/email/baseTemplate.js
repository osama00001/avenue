// emailTemplate.js

export const baseTemplate = ({
  title = "Notification",
  content = "",
  footer = "© Your Company",
}) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${title}</title>
</head>

<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">

        <!-- Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
          style="background:#ffffff;margin:20px auto;border-radius:8px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="
              background:#ff6a00;
              padding:20px;
              text-align:center;
              font-size:22px;
              font-weight:bold;
              color:#fff;">
              ${title}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px;color:#333;font-size:16px;line-height:1.6;">
              ${content}
            </td>
          </tr>

          <!-- Button example -->

          <!-- Footer -->
          <tr>
            <td style="
              background:#fafafa;
              padding:15px;
              text-align:center;
              font-size:12px;
              color:#777;">
              ${footer}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;


