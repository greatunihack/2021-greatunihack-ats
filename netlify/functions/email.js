const client = require("@sendgrid/mail");

exports.handler = async function (event) {
  const { emails, messageType } = JSON.parse(event.body);
  client.setApiKey(process.env.SENDGRID_API_KEY);
  let message = "";
  let subject = "";
  if (messageType === "accepted") {
    subject = `Welcome to ${process.env.HACKATHON_NAME}!`;
    message = `Hey! You've been accepted to ${process.env.HACKATHON_NAME}. Get started my joining the ${process.env.HACKATHON_NAME_SHORT} Discord server here: ${process.env.DISCORD_INVITE_LINK}.`;
  } else {
    subject = `Update on ${process.env.HACKATHON_NAME} status`;
    message = `Unfortunately, you've been rejected from ${process.env.HACKATHON_NAME} :( Don't be discouraged and keep on coding!`;
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
