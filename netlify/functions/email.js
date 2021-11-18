const client = require("@sendgrid/mail");

exports.handler = async function (event) {
  const { emails, messageType } = JSON.parse(event.body);
  client.setApiKey(process.env.SENDGRID_API_KEY);
  let message = "";
  let subject = "";
  if (messageType === "accepted") {
    subject = `Welcome to ${process.env.HACKATHON_NAME}!`;
    message = `<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8"/> <meta name="viewport" content="width=device-width, initial-scale=1"/> </head> <body> <p>Dear applicant,</p><p> Congratulations! You’ve been accepted to take part in GreatUniHack 2021! </p><p> In the meantime, please join our Discord server: https://discord.gg/s2mv6Wuymn. Here, you can form your team and chat with fellow participants before the event officially starts. If you don’t have a team yet, browse the #find-a-team channel for potential teammates! </p><p> Your place at GreatUniHack is automatically confirmed. More details about the event will be sent to you soon by email. </p><p> For many of you, this will be your first hackathon. We welcome participants from all skill levels! These resources will get you up to speed with what to expect: </p><p> <a href="https://ginnyfahs.medium.com/first-hackathon-here-are-6-things-you-need-to-know-46640c3ef72e" >6 tips for your first hackathon</a > </p><p> <a href="https://news.mlh.io/7-expert-tips-to-get-the-most-from-your-first-hackathons-06-15-2020" >MLH hackathon tips</a > </p><p> <a href="https://www.freecodecamp.org/news/cracking-the-hackathon-complete-guide-to-winning-a-hackathon-8d196646cc9a/" >How to win a hackathon</a > </p><p>We hope to see you there and wish you the very best of luck!</p><p>Kind regards,</p><p>The UniCS Team</p></body></html>`;
  } else {
    subject = `Update on ${process.env.HACKATHON_NAME} application`;
    message = `<!DOCTYPE html><html lang="en"> <head> <meta charset="UTF-8"/> <meta name="viewport" content="width=device-width, initial-scale=1"/> </head> <body> <p>Dear applicant,</p><p> Thank you for your application to GreatUniHack 2021. We regret to inform you your application was unsuccessful. </p><p> We receive many fantastic applications, and can only accept a limited number of participants each year. Keep on coding, and make sure to apply next year! </p><p>Kind regards,</p><p>The UniCS Team</p></body></html>`;

  }
  try {
    await client.sendMultiple({
      from: {
        email: process.env.FROM_EMAIL,
        name: `${process.env.HACKATHON_NAME_SHORT} Team`,
      },
      to: JSON.parse(emails),
      subject: subject,
      html: message,
    });
    return {
      statusCode: 200,
      body: "Success",
    };
  } catch (err) {
    return {
      statusCode: err.code,
      body: JSON.stringify({ msg: err.message }),
    };
  }
};
