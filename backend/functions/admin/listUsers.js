const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { requireRole } = require('../../utils/auth');

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports.handler = async (event) => {
    try {
        await requireRole(event, ['ADMIN']); // Hard enforcement

        if (!process.env.USER_POOL_ID || process.env.USER_POOL_ID.includes('undefined')) {
            return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, code: "USERS_LISTED", data: [], message: "No pool configured" }) };
        }

        const response = await cognito.send(new ListUsersCommand({ UserPoolId: process.env.USER_POOL_ID }));

        const safeUsers = response.Users.map(u => ({
            Username: u.Username,
            UserStatus: u.UserStatus,
            Enabled: u.Enabled,
            email: u.Attributes.find(a => a.Name === 'email')?.Value || '',
            group: 'VIEWER'
        }));

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, code: "USERS_LISTED", data: safeUsers, message: "Users retrieved" }) };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Admin access required" }) };
        console.error(error);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Failed to list users" }) };
    }
};
