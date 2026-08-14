const { CognitoJwtVerifier } = require("aws-jwt-verify");

// Instantiate the verifier which caches the AWS JWKS keys natively
const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID || "us-east-1_dummyPoolId",
    tokenUse: "id", // Amplify uses ID tokens for authorization typically
    clientId: process.env.CLIENT_ID || "dummyClientId",
});

module.exports.getUserIdFromEvent = async (event) => {
    try {
        const authHeader = event.headers?.authorization || event.headers?.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error("Missing Authorization Header");

        const token = authHeader.split(' ')[1];
        const payload = await verifier.verify(token);

        const id = payload.email || payload.sub;
        if (!id) throw new Error("Invalid Token Payload format");

        return id;
    } catch (err) {
        console.error("JWT Verification failed:", err);
        throw new Error("Unauthorized: " + err.message);
    }
};

module.exports.requireRole = async (event, allowedRoles) => {
    try {
        const authHeader = event.headers?.authorization || event.headers?.Authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error("Missing Authorization Header");

        const token = authHeader.split(' ')[1];
        const payload = await verifier.verify(token); // Mathematically verifies

        const id = payload.email || payload.sub;
        if (!id) throw new Error("Invalid Token Payload format");

        const groups = payload['cognito:groups'] || [];
        const role = groups.includes('ADMIN') ? 'ADMIN' : (groups.includes('EDITOR') ? 'EDITOR' : 'VIEWER');

        // Check if ANY of the user's groups are in the explicitly allowed list
        // VIEWER is the fallback if they have no explicit groups
        const hasPermission = groups.some(g => allowedRoles.includes(g)) || (groups.length === 0 && allowedRoles.includes('VIEWER'));

        if (!hasPermission) {
            throw new Error(`Forbidden: Role ${role} insufficient privileges`);
        }

        return { id, role, originalGroups: groups, sub: payload.sub };
    } catch (err) {
        if (err.message.startsWith('Forbidden')) throw err;
        throw new Error("Unauthorized: " + err.message);
    }
};
