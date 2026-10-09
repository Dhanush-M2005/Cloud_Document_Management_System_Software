const { CognitoIdentityProviderClient, AdminDeleteUserCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { email } = body;
        const userPoolId = process.env.USER_POOL_ID;

        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Email is required' }) };
        }

        const getUserCommand = new AdminGetUserCommand({
            UserPoolId: userPoolId,
            Username: email
        });

        const existingUser = await client.send(getUserCommand);

        if (existingUser.UserStatus === 'UNCONFIRMED') {
            const deleteCommand = new AdminDeleteUserCommand({
                UserPoolId: userPoolId,
                Username: email
            });
            await client.send(deleteCommand);
            return {
                statusCode: 200,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: true, message: 'Unconfirmed identity purged.' })
            };
        } else {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ success: false, message: 'Identity is already confirmed and cannot be cancelled.' })
            };
        }
    } catch (error) {
        console.error('Cancel Registration Error:', error);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: false, message: 'Failed to purge identity.' })
        };
    }
};
