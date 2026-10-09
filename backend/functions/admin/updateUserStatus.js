const { CognitoIdentityProviderClient, AdminDeleteUserCommand, AdminEnableUserCommand, AdminDisableUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { requireRole } = require('../../utils/auth');
const { logAction } = require('../../utils/audit');

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports.handler = async (event) => {
    try {
        const { id: adminId } = await requireRole(event, ['ADMIN']);
        const username = event.pathParameters.id;
        const { action } = JSON.parse(event.body || "{}"); // e.g 'ENABLE', 'DISABLE', 'DELETE'

        if (process.env.USER_POOL_ID && !process.env.USER_POOL_ID.includes('undefined')) {
            let Command;
            if (action === 'ENABLE') Command = AdminEnableUserCommand;
            else if (action === 'DISABLE') Command = AdminDisableUserCommand;
            else if (action === 'DELETE') Command = AdminDeleteUserCommand;
            else throw new Error("Invalid action");

            await cognito.send(new Command({
                UserPoolId: process.env.USER_POOL_ID,
                Username: username
            }));

            // Audit Log
            await logAction(adminId, `USER_${action}`, username);
        }

        let message = '';
        if (action === 'ENABLE') message = 'User successfully authenticated and activated.';
        else if (action === 'DISABLE') message = 'User moved to quarantine state.';
        else if (action === 'DELETE') message = 'User identity permanently terminated and wiped.';

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, code: "STATUS_UPDATED", data: null, message }) };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Admin access required" }) };
        console.error(error);
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Failed to update user status" }) };
    }
};
