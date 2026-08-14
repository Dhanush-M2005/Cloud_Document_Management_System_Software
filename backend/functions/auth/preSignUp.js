module.exports.handler = async (event, context, callback) => {
    // Automatically confirm the user to bypass email verification codes
    event.response.autoConfirmUser = true;

    // Automatically verify the email attribute
    event.response.autoVerifyEmail = true;

    // Return to Cognito so it continues the sign-up process smoothly
    return callback(null, event);
};
