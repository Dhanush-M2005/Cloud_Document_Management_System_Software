const { CognitoIdentityProviderClient, AdminDeleteUserCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports.handler = async (event) => {
    const userPoolId = event.userPoolId;
    const email = event.request.userAttributes.email;

    try {
        // Check if the user already exists
        const getUserCommand = new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: email
        });

        const existingUser = await client.send(getUserCommand);

        // If user exists and is UNCONFIRMED, delete them so this new sign-up succeeds
        if (existingUser.UserStatus === 'UNCONFIRMED') {
            console.log(`Deleting existing UNCONFIRMED user ${email} to allow fresh sign-up.`);
            const deleteCommand = new AdminDeleteUserCommand({
                UserPoolId: userPoolId,
                Username: email
            });
            await client.send(deleteCommand);
        }
    } catch (error) {
        // If the error is UserNotFoundException, that's perfectly fine (first time sign-up).
        if (error.name !== 'UserNotFoundException') {
            console.error(`Error checking/deleting unconfirmed user ${email}:`, error);
        }
    }

    // Return the event to let Cognito proceed with the native sign-up and email OTP
    return event;
};
