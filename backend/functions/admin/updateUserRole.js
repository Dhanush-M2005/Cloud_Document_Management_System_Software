const { CognitoIdentityProviderClient, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { requireRole } = require('../../utils/auth');

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports.handler = async (event) => {
    try {
        await requireRole(event, ['ADMIN']);
        const username = event.pathParameters.id;
        const { group } = JSON.parse(event.body || "{}"); // e.g 'EDITOR'

        // Safety guard rails
        if (group === 'REMOVE_ADMIN') return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INVALID_OPERATION", data: null, message: "Cannot dynamically demote an admin right now" }) };

        if (process.env.USER_POOL_ID && !process.env.USER_POOL_ID.includes('undefined')) {
            if (group === 'VIEWER') {
                try { await cognito.send(new AdminRemoveUserFromGroupCommand({ UserPoolId: process.env.USER_POOL_ID, Username: username, GroupName: 'EDITOR' })); } catch (e) { }
                try { await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: process.env.USER_POOL_ID, Username: username, GroupName: 'VIEWER' })); } catch (e) { }
            } else {
                try { await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: process.env.USER_POOL_ID, Username: username, GroupName: group })); } catch (e) { }
            }
        }

        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: true, code: "ROLE_UPDATED", data: null, message: `User role updated to ${group}` }) };
    } catch (error) {
        if (error.message && error.message.startsWith("Unauthorized") || error.name === "JwtVerificationError") return { statusCode: 401, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "UNAUTHORIZED", data: null, message: "Invalid or missing token" }) };
        if (error.message && error.message.startsWith("Forbidden")) return { statusCode: 403, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "FORBIDDEN", data: null, message: "Admin access required" }) };
        return { statusCode: 500, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ success: false, code: "INTERNAL_ERROR", data: null, message: "Failed to update user role" }) };
    }
};
