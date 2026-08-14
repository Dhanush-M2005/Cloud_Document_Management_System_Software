const { CognitoIdentityProviderClient, AdminDisableUserCommand, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION || 'us-east-1' });

module.exports.handler = async (event) => {
    // Expected event: Cognito Post Confirmation Trigger
    const userPoolId = event.userPoolId;
    const username = event.userName;

    try {
        console.log(`[QUARANTINE_LIFECYCLE] Executing lockdown for verified new user: ${username}`);

        // 1. Immediately disable the user mathematically preventing authentication
        const disableCommand = new AdminDisableUserCommand({
            UserPoolId: userPoolId,
            Username: username
        });
        await client.send(disableCommand);

        // 2. Safely place the user into the VIEWER group by default for future-proofing
        const addToGroupCommand = new AdminAddUserToGroupCommand({
            GroupName: 'VIEWER',
            UserPoolId: userPoolId,
            Username: username
        });
        await client.send(addToGroupCommand);

        console.log(`[QUARANTINE_LIFECYCLE] User ${username} successfully locked and transitioned to PENDING state.`);

        // Important: Return the event object intact so Cognito finishes the pipeline successfully
        return event;

    } catch (error) {
        console.error(`[QUARANTINE_ERROR] Failed to execute lockdown for ${username}:`, error);

        // Return event anyway so the user finishes verification, even if the group add failed.
        // The disable command is most critical.
        return event;
    }
};
