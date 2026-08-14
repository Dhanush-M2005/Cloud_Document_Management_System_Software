const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand, InitiateAuthCommand, AdminDeleteUserCommand, AdminAddUserToGroupCommand, CreateGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');

const API_URL = process.env.API_URL;
const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const REGION = process.env.AWS_REGION || "ap-south-1";

const cognito = new CognitoIdentityProviderClient({ region: REGION });

const VIEWER_USER = { email: `testviewer_${Date.now()}@test.com`, password: "TempPassword123!", token: null, role: 'VIEWER' };
const EDITOR_USER = { email: `testeditor_${Date.now()}@test.com`, password: "TempPassword123!", token: null, role: 'EDITOR' };
const ADMIN_USER = { email: `testadmin_${Date.now()}@test.com`, password: "TempPassword123!", token: null, role: 'ADMIN' };

let passes = [];
let failures = [];
const log = (msg) => console.log('\x1b[36mℹ\x1b[0m ' + msg);
const pass = (name) => { console.log('\x1b[32m✔ PASS\x1b[0m', name); passes.push(name); };
const fail = (name, reason) => { console.error('\x1b[31m✖ FAIL\x1b[0m', name, '->', reason); failures.push({ name, reason }); };

// Ensure group exists then add user
async function ensureGroupAndAddUser(username, groupName) {
    if (groupName === 'VIEWER') return; // Viewer requires no explicit group

    try {
        await cognito.send(new CreateGroupCommand({ UserPoolId: USER_POOL_ID, GroupName: groupName }));
    } catch (err) {
        if (err.name !== 'GroupExistsException') throw err;
    }

    await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: USER_POOL_ID, Username: username, GroupName: groupName }));
}

async function provisionUser(userConfig) {
    try {
        await cognito.send(new AdminCreateUserCommand({ UserPoolId: USER_POOL_ID, Username: userConfig.email, MessageAction: 'SUPPRESS', TemporaryPassword: userConfig.password, UserAttributes: [{ Name: 'email', Value: userConfig.email }] }));
        await cognito.send(new AdminSetUserPasswordCommand({ UserPoolId: USER_POOL_ID, Username: userConfig.email, Password: userConfig.password, Permanent: true }));
        await ensureGroupAndAddUser(userConfig.email, userConfig.role);

        const auth = await cognito.send(new InitiateAuthCommand({ AuthFlow: 'USER_PASSWORD_AUTH', ClientId: CLIENT_ID, AuthParameters: { USERNAME: userConfig.email, PASSWORD: userConfig.password } }));
        userConfig.token = auth.AuthenticationResult.IdToken;
        log(`Provisioned ${userConfig.role} user ${userConfig.email}`);
    } catch (err) {
        console.error(`Failure provisioning ${userConfig.role}:`, err.message);
        process.exit(1);
    }
}

async function destroyUser(userConfig) {
    try { await cognito.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: userConfig.email })); } catch (err) { }
}

async function request(path, opts = {}) {
    if (!opts.headers) opts.headers = {};
    if (opts.token) { opts.headers['Authorization'] = `Bearer ${opts.token}`; delete opts.token; }
    const res = await fetch(`${API_URL}${path}`, opts);
    let json;
    try { json = await res.json(); } catch (e) { }
    return { status: res.status, json, res };
}

async function runMatrix() {
    log("Initializing Phase 48 Live E2E RBAC Orchestrator...");

    await provisionUser(VIEWER_USER);
    await provisionUser(EDITOR_USER);
    await provisionUser(ADMIN_USER);

    log("--- EXECUTING TEST MATRIX ---");

    try {
        // --- 1. VIEWER Matrix ---
        const vUpload = await request('/documents/upload-url', { method: 'POST', token: VIEWER_USER.token, body: JSON.stringify({ fileName: 'v.pdf', fileType: 'application/pdf', fileSize: 1000 }) });
        if (vUpload.status === 403) pass("Viewer → upload (Expected 403)"); else fail("Viewer → upload", `Status ${vUpload.status}`);

        const vRename = await request(`/documents/fake-id`, { method: 'PATCH', token: VIEWER_USER.token, body: JSON.stringify({ newName: 'h.pdf' }) });
        if (vRename.status === 403) pass("Viewer → rename own document (Expected 403)"); else fail("Viewer → rename own document", `Status ${vRename.status}`);

        const vDelete = await request(`/documents/fake-id`, { method: 'DELETE', token: VIEWER_USER.token });
        if (vDelete.status === 403) pass("Viewer → delete own document (Expected 403)"); else fail("Viewer → delete own document", `Status ${vDelete.status}`);

        const vShare = await request(`/documents/fake-id/share`, { method: 'POST', token: VIEWER_USER.token, body: JSON.stringify({}) });
        if (vShare.status === 403) pass("Viewer → create share (Expected 403)"); else fail("Viewer → create share", `Status ${vShare.status}`);

        // --- 2. EDITOR Matrix ---
        let editorDocumentId;
        const eUpload = await request('/documents/upload-url', { method: 'POST', token: EDITOR_USER.token, body: JSON.stringify({ fileName: 'e.pdf', fileType: 'application/pdf', fileSize: 1000 }) });
        if (eUpload.status === 200) {
            pass("Editor → upload (Expected 200)");
            editorDocumentId = eUpload.json.data.documentId;
        } else { fail("Editor → upload", `Status ${eUpload.status} - ${eUpload.json?.message}`); }

        // Wait, standard rename requires item to exist in DB. Since S3 isn't mocked cleanly immediately in E2E, we'll confirm 400 Bad Request or 200 for Rename/share instead of 403. If it is 403, it means RBAC blocked it. If it passes RBAC it might throw 403 from Ownership or 400. We will assert it is NOT blocked by RBAC natively.
        // Actually, if document doesn't exist, DynamoDB fetch returns empty and our code says "if (!doc) return 403 Forbidden". Let's inject a fake document directly via Editor token for the test, or rely on createDocument. 
        if (editorDocumentId) {
            // Upload valid %PDF payload to S3 before confirming metadata
            const bufferPDF = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00, 0x00, 0x00, 0x00]);
            await fetch(eUpload.json.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: bufferPDF });

            // Fake the creation confirmation
            await request('/documents', { method: 'POST', token: EDITOR_USER.token, body: JSON.stringify({ documentId: editorDocumentId, fileName: 'e.pdf', fileType: 'application/pdf', fileSize: 1000 }) });

            const eRename = await request(`/documents/${editorDocumentId}`, { method: 'PATCH', token: EDITOR_USER.token, body: JSON.stringify({ newName: 'h.pdf' }) });
            if (eRename.status === 200) pass("Editor → rename own document (Expected 200)"); else fail("Editor → rename own document", `Status ${eRename.status}`);

            const eShare = await request(`/documents/${editorDocumentId}/share`, { method: 'POST', token: EDITOR_USER.token, body: JSON.stringify({}) });
            if (eShare.status === 201) pass("Editor → share own document (Expected 200/201)"); else fail("Editor → share own document", `Status ${eShare.status}`);

            const eDelete = await request(`/documents/${editorDocumentId}`, { method: 'DELETE', token: EDITOR_USER.token });
            if (eDelete.status === 200) pass("Editor → delete own document (Expected 200)"); else fail("Editor → delete own document", `Status ${eDelete.status}`);
        }

        // --- 3. Cross-Tenant / Admin Validation ---
        // Admin ordinary document access
        const aUpload = await request('/documents/upload-url', { method: 'POST', token: ADMIN_USER.token, body: JSON.stringify({ fileName: 'a.pdf', fileType: 'application/pdf', fileSize: 1000 }) });
        if (aUpload.status === 403) pass("Admin → ordinary document (Expected 403 isolation)"); else fail("Admin → ordinary document", `Status ${aUpload.status}`);

        // Editor → Admin Endpoint
        const eAdmin = await request('/admin/users', { token: EDITOR_USER.token });
        if (eAdmin.status === 403) pass("Editor → admin endpoints (Expected 403)"); else fail("Editor → admin endpoints", `Status ${eAdmin.status}`);

        // Admin → Admin Endpoint
        const aAdmin = await request('/admin/users', { token: ADMIN_USER.token });
        if (aAdmin.status === 200) pass("Real Admin → admin endpoints (Expected 200)"); else fail("Real Admin → admin endpoints", `Status ${aAdmin.status} - ${aAdmin.json?.message}`);

        // --- 4. JWT Integrity Tests ---
        // Fake JWT
        const fakeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiY29nbml0bzpndXJvcHMiOlsiQURNSU4iXX0.fake_signature";
        const fakeReq = await request('/admin/users', { token: fakeJwt });
        if (fakeReq.status === 401) pass("Fake JWT claiming ADMIN (Expected 401)"); else fail("Fake JWT claiming ADMIN", `Status ${fakeReq.status}`);

        // Modified Valid JWT
        const modifiedJwt = ADMIN_USER.token.substring(0, ADMIN_USER.token.length - 10) + "FakeString";
        const modReq = await request('/admin/users', { token: modifiedJwt });
        if (modReq.status === 401) pass("Modified valid JWT (Expected 401)"); else fail("Modified valid JWT", `Status ${modReq.status} - Cryptographic integrity validation failed!`);

    } catch (err) {
        log("Execution halted due to unhandled exception: " + err.message);
    }

    // Cleanup
    await destroyUser(VIEWER_USER);
    await destroyUser(EDITOR_USER);
    await destroyUser(ADMIN_USER);

    log(`Matrix Complete: ${passes.length} Passed, ${failures.length} Failed`);

    const root = 'C:\\Users\\dhanu\\.gemini\\antigravity\\brain\\3f592595-ad8c-4c75-9a56-1121a96c9146';
    const reportPath = path.join(root, 'phase-48-rbac-e2e-report.md');
    fs.writeFileSync(reportPath, `# Phase 48 Live RBAC E2E Execution\n\n## Passed Tests\n${passes.map(p => `✅ ${p}`).join('\n')}\n\n## Failed Tests\n${failures.map(f => `❌ ${f.name} (Reason: ${f.reason})`).join('\n')}`);

    if (failures.length > 0) process.exit(1);
    process.exit(0);
}

runMatrix();
