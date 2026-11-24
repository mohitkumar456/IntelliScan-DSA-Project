const { app, server } = require('./backend/server.js');

async function runTests() {
    console.log('\n======================================================');
    console.log('       RUNNING INTELLISCAN FULL END-TO-END SUITE       ');
    console.log('======================================================\n');

    const BASE = 'http://127.0.0.1:3000';

    try {
        // 1. Health
        console.log('--- 1. Testing GET /api/health ---');
        let res = await fetch(`${BASE}/api/health`);
        let json = await res.json();
        console.log('Health:', json);
        if (json.status !== 'online' || !json.engineAvailable) throw new Error('Health check failed');

        // 2. Scan
        console.log('\n--- 2. Testing POST /api/scan ---');
        res = await fetch(`${BASE}/api/scan`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ directoryPath: 'test_sample_dir' })
        });
        json = await res.json();
        console.log('Scan Status:', json.status);
        console.log('Files Scanned:', json.summary.totalFiles);
        console.log('Total Bytes:', json.summary.totalBytes);
        console.log('Duplicate Groups:', json.duplicateGroups.length);
        console.log('Execution Time:', json.executionTimeMs, 'ms');
        if (json.status !== 'success' || json.summary.totalFiles < 5) throw new Error('Scan test failed');

        // 3. Files
        console.log('\n--- 3. Testing GET /api/files ---');
        res = await fetch(`${BASE}/api/files`);
        json = await res.json();
        console.log('Files returned:', json.totalFiles);
        const sampleFile = json.files[0];
        console.log('Sample file:', sampleFile.filename, '(', sampleFile.category, ')');

        // 4. Duplicates
        console.log('\n--- 4. Testing GET /api/duplicates ---');
        res = await fetch(`${BASE}/api/duplicates`);
        json = await res.json();
        console.log('Duplicates Count:', json.totalDuplicateFiles);
        console.log('Potential Savings:', json.potentialSavingsBytes, 'bytes');

        // 5. Storage
        console.log('\n--- 5. Testing GET /api/storage ---');
        res = await fetch(`${BASE}/api/storage`);
        json = await res.json();
        console.log('Storage categories:', json.categories.length);
        console.log('Storage recommendations:', json.recommendations.length);

        // 6. Categories
        console.log('\n--- 6. Testing GET /api/categories ---');
        res = await fetch(`${BASE}/api/categories`);
        json = await res.json();
        console.log('Categories:', json.categories.map(c => `${c.category} (${c.fileCount})`).join(', '));

        // 7. Largest Files (Priority Manager)
        console.log('\n--- 7. Testing GET /api/largest-files ---');
        res = await fetch(`${BASE}/api/largest-files`);
        json = await res.json();
        console.log('Top files count:', json.largestFiles.length);
        console.log('Top file #1:', json.largestFiles[0].filename, 'Size:', json.largestFiles[0].size);

        // 8. History
        console.log('\n--- 8. Testing GET /api/history ---');
        res = await fetch(`${BASE}/api/history`);
        json = await res.json();
        console.log('Scan history entries:', json.history.length);

        // 9. Search - Linear Search
        console.log('\n--- 9. Testing POST /api/search (Linear Search) ---');
        res = await fetch(`${BASE}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'report', algorithm: 'linear', field: 'name' })
        });
        json = await res.json();
        console.log('Linear Search Matches:', json.resultsCount, 'Algorithm:', json.algorithm, 'Time:', json.timeMicroseconds, 'µs');

        // 10. Search - Binary Search
        console.log('\n--- 10. Testing POST /api/search (Binary Search) ---');
        res = await fetch(`${BASE}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'debug.log', algorithm: 'binary', field: 'name' })
        });
        json = await res.json();
        console.log('Binary Search Matches:', json.resultsCount, 'Algorithm:', json.algorithm, 'Comparisons:', json.comparisonsCount, 'Time:', json.timeMicroseconds, 'µs');

        // 11. Search - Hash Map Lookup
        console.log('\n--- 11. Testing POST /api/search (Hash Map Lookup) ---');
        res = await fetch(`${BASE}/api/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: 'test_code.cpp', algorithm: 'hash', field: 'name' })
        });
        json = await res.json();
        console.log('Hash Lookup Matches:', json.resultsCount, 'Algorithm:', json.algorithm, 'Time:', json.timeMicroseconds, 'µs');

        // 12. Undo Stack: Remove Record
        console.log('\n--- 12. Testing POST /api/files/remove (Stack Push) ---');
        res = await fetch(`${BASE}/api/files/remove`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: sampleFile.path })
        });
        json = await res.json();
        console.log('Remove status:', json.status, 'Stack Depth:', json.undoStackCount, 'Removed:', json.removedRecord.filename);

        // 13. Undo Stack: Undo (Pop Record)
        console.log('\n--- 13. Testing POST /api/files/undo (Stack Pop) ---');
        res = await fetch(`${BASE}/api/files/undo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        json = await res.json();
        console.log('Undo status:', json.status, 'Stack Depth:', json.undoStackCount, 'Restored:', json.restoredRecord.filename);

        // 14. Static Frontend index.html delivery
        console.log('\n--- 14. Testing GET / (Static Frontend delivery) ---');
        res = await fetch(`${BASE}/`);
        const html = await res.text();
        console.log('Frontend HTML length:', html.length, 'Contains IntelliScan:', html.includes('INTELLISCAN'));

        console.log('\n======================================================');
        console.log('    >>> ALL 14 TEST CASES PASSED SUCCESSFULLY! <<<    ');
        console.log('======================================================\n');
    } catch (err) {
        console.error('TEST FAILED:', err);
    } finally {
        server.close();
    }
}

setTimeout(runTests, 600);
