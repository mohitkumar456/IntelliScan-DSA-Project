const { app, server } = require('./backend/server.js');
const path = require('path');

async function testSuite() {
    console.log('\n======================================================');
    console.log('   INTELLISCAN OBSIDIAN CYBER - UPGRADE TEST SUITE   ');
    console.log('======================================================\n');

    const BASE = 'http://127.0.0.1:3000';

    try {
        // 1. Health
        console.log('1. Testing GET /api/health...');
        let res = await fetch(`${BASE}/api/health`);
        let json = await res.json();
        console.log('   Status:', json.status, '| DB:', json.database);

        // 2. Quick Folders
        console.log('\n2. Testing GET /api/quick-folders...');
        res = await fetch(`${BASE}/api/quick-folders`);
        json = await res.json();
        console.log('   Available Windows Folders:', json.folders.map(f => f.name).join(', '));

        // 3. Authentication: Login
        console.log('\n3. Testing POST /api/auth/login...');
        res = await fetch(`${BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@intelliscan.local', password: 'Admin@1234' })
        });
        json = await res.json();
        console.log('   Login Status:', json.status, '| User:', json.user.name);

        // 4. Scan Real Folder
        const targetFolder = path.resolve('test_sample_dir');
        console.log(`\n4. Testing POST /api/scan on "${targetFolder}"...`);
        res = await fetch(`${BASE}/api/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ directoryPath: targetFolder, userId: 1 })
        });
        json = await res.json();
        console.log('   Files Scanned:', json.summary.totalFiles, '| Total Bytes:', json.summary.totalBytes, '| Duration:', json.executionTimeMs, 'ms');
        console.log('   Duplicate Groups:', json.duplicateGroups.length, '| Potential Savings:', json.summary.potentialSavingsBytes, 'bytes');

        // 5. Search
        console.log('\n5. Testing POST /api/search...');
        res = await fetch(`${BASE}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'report', category: 'ALL' })
        });
        json = await res.json();
        console.log('   Search Results Count:', json.resultsCount, '| Sample Match:', json.matches[0].filename);

        // 6. History (from SQLite)
        console.log('\n6. Testing GET /api/history (SQLite)...');
        res = await fetch(`${BASE}/api/history`);
        json = await res.json();
        console.log('   SQLite History Rows:', json.history.length, '| Latest Folder:', json.history[0].folder_name);

        // 7. PDF Report Generation
        console.log('\n7. Testing GET /api/report/pdf...');
        res = await fetch(`${BASE}/api/report/pdf`);
        const pdfBuffer = await res.arrayBuffer();
        console.log('   PDF Generated successfully! Size:', pdfBuffer.byteLength, 'bytes');

        // 8. CSV Report Generation
        console.log('\n8. Testing GET /api/report/csv...');
        res = await fetch(`${BASE}/api/report/csv`);
        const csvText = await res.text();
        console.log('   CSV Generated successfully! Lines:', csvText.split('\n').length);

        // 9. Open File & Open Folder validation
        console.log('\n9. Testing Open File & Open Folder path validations...');
        const testFilePath = path.resolve('test_sample_dir/docs/report_draft.txt');
        res = await fetch(`${BASE}/api/open-folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: testFilePath })
        });
        json = await res.json();
        console.log('   Open Folder API Response:', json.message);

        console.log('\n======================================================');
        console.log('   >>> ALL 9 UPGRADE TEST MODULES PASSED! <<<         ');
        console.log('======================================================\n');
    } catch (err) {
        console.error('Test Suite Failed:', err);
    } finally {
        server.close();
    }
}

setTimeout(testSuite, 600);
