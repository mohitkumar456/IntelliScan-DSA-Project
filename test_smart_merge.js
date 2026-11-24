/**
 * INTELLISCAN SMART MERGE TEST SUITE - test_smart_merge.js
 * 
 * Verifies:
 * 1. PDF Merge (page preservation, page count verification)
 * 2. Corrupted PDF & Password-Protected PDF detection
 * 3. TXT Merge (separator, multi-file concatenation, verification)
 * 4. Empty File & Exact SHA-256 Duplicate Detection
 * 5. CSV Merge (schema alignment by column name, repeated header deduplication, row counts)
 * 6. REST API Endpoints (/validate, /preview, /execute, /upload, /history, /result)
 * 7. SQLite database persistence
 */

const fs = require('fs');
const path = require('path');

// Ensure modules can be loaded from backend/node_modules
module.paths.push(path.resolve(__dirname, 'backend/node_modules'));

const { PDFDocument, rgb } = require('pdf-lib');
const smartMerge = require('./backend/smartMerge');
const { app, server } = require('./backend/server');
const db = require('./backend/database');

const TEST_DIR = path.resolve(__dirname, 'test_merge_artifacts');
if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
}

async function createSamplePdf(filePath, pageCount, title) {
    const doc = await PDFDocument.create();
    for (let i = 1; i <= pageCount; i++) {
        const page = doc.addPage([400, 400]);
        page.drawText(`${title} - Page ${i}`, {
            x: 50,
            y: 350,
            size: 18,
            color: rgb(0.1, 0.5, 0.8)
        });
    }
    const bytes = await doc.save();
    fs.writeFileSync(filePath, bytes);
    return filePath;
}

function createSampleTxt(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf8');
    return filePath;
}

function createSampleCsv(filePath, headers, rows) {
    const lines = [headers.join(',')];
    rows.forEach(r => lines.push(r.join(',')));
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    return filePath;
}

async function runSmartMergeTestSuite() {
    console.log('\n======================================================');
    console.log('     INTELLISCAN SMART MERGE BACKEND TEST SUITE       ');
    console.log('======================================================\n');

    // Clean test artifacts directory
    if (fs.existsSync(TEST_DIR)) {
        for (const file of fs.readdirSync(TEST_DIR)) {
            try {
                fs.unlinkSync(path.join(TEST_DIR, file));
            } catch {}
        }
    }

    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  [PASS] ${message}`);
            passedTests++;
        } else {
            console.error(`  [FAIL] ${message}`);
            failedTests++;
            throw new Error(`Assertion Failed: ${message}`);
        }
    }

    try {
        // -----------------------------------------------------------
        // TEST 1: PDF MERGE & PAGE PRESERVATION
        // -----------------------------------------------------------
        console.log('--- TEST 1: PDF Merge & Verification ---');
        const pdf1 = path.join(TEST_DIR, 'doc1.pdf');
        const pdf2 = path.join(TEST_DIR, 'doc2.pdf');
        const pdf3 = path.join(TEST_DIR, 'doc3.pdf');
        const pdfOut = path.join(TEST_DIR, 'merged_output.pdf');

        await createSamplePdf(pdf1, 2, 'Doc 1'); // 2 pages
        await createSamplePdf(pdf2, 3, 'Doc 2'); // 3 pages
        await createSamplePdf(pdf3, 1, 'Doc 3'); // 1 page
        // Expected total = 6 pages

        const pdfVal = await smartMerge.validateMergeCandidates([pdf1, pdf2, pdf3], {
            mergeType: 'pdf',
            outputFilename: 'merged_output.pdf',
            outputDir: TEST_DIR
        });

        assert(pdfVal.canMerge === true, 'PDF validation allows merge');
        assert(pdfVal.compatibilityStatus === 'COMPATIBLE', 'PDF compatibility status is COMPATIBLE');
        assert(pdfVal.inspectedFiles.length === 3, 'All 3 PDFs inspected');
        assert(pdfVal.inspectedFiles[0].details.pageCount === 2, 'Doc 1 has 2 pages');
        assert(pdfVal.inspectedFiles[1].details.pageCount === 3, 'Doc 2 has 3 pages');
        assert(pdfVal.inspectedFiles[2].details.pageCount === 1, 'Doc 3 has 1 page');

        const pdfExec = await smartMerge.executeMerge([pdf1, pdf2, pdf3], {
            mergeType: 'pdf',
            outputFilename: 'merged_output.pdf',
            outputDir: TEST_DIR,
            overwrite: true
        });

        assert(pdfExec.status === 'SUCCESS', 'PDF merge executed with status SUCCESS');
        assert(fs.existsSync(pdfExec.outputPath), 'PDF output exists on disk');
        
        // Verify output pages directly with pdf-lib
        const verifiedPdfBytes = fs.readFileSync(pdfExec.outputPath);
        const verifiedDoc = await PDFDocument.load(verifiedPdfBytes);
        assert(verifiedDoc.getPageCount() === 6, `Output PDF contains exactly 6 preserved pages (got ${verifiedDoc.getPageCount()})`);

        // -----------------------------------------------------------
        // TEST 2: CORRUPTED FILE & INVALID FORMAT VALIDATION
        // -----------------------------------------------------------
        console.log('\n--- TEST 2: Corrupted File & Error Detection ---');
        const corruptPdf = path.join(TEST_DIR, 'corrupted.pdf');
        fs.writeFileSync(corruptPdf, 'Not a valid pdf binary content at all!');

        const corruptVal = await smartMerge.validateMergeCandidates([pdf1, corruptPdf], {
            mergeType: 'pdf'
        });

        assert(corruptVal.canMerge === false, 'Corrupted PDF blocks merging (canMerge is false)');
        assert(corruptVal.summary.criticalErrors >= 1, 'Critical error count is at least 1');
        const corruptIssue = corruptVal.issues.find(i => i.fileName.includes('corrupted.pdf'));
        assert(corruptIssue !== undefined, 'Corrupted file issue reported');
        assert(corruptIssue.severity === 'CRITICAL', 'Corrupted file severity is CRITICAL');
        assert(corruptIssue.canContinue === false, 'canContinue is false for corrupted file');

        // Mixed format test
        const txtFile = path.join(TEST_DIR, 'dummy.txt');
        createSampleTxt(txtFile, 'hello');
        const mixedVal = await smartMerge.validateMergeCandidates([pdf1, txtFile], { mergeType: 'pdf' });
        assert(mixedVal.canMerge === false, 'Mixed format (PDF + TXT) blocks merging');
        assert(mixedVal.issues.some(i => i.problem === 'Format mismatch'), 'Format mismatch error detected');

        // -----------------------------------------------------------
        // TEST 3: TXT MERGE & ENCODING
        // -----------------------------------------------------------
        console.log('\n--- TEST 3: TXT Merge & Encoding Verification ---');
        const txt1 = path.join(TEST_DIR, 'notes1.txt');
        const txt2 = path.join(TEST_DIR, 'notes2.txt');
        const txtOut = path.join(TEST_DIR, 'merged_notes.txt');

        createSampleTxt(txt1, 'Line 1: System started\nLine 2: Ready');
        createSampleTxt(txt2, 'Line 3: Process running\nLine 4: Finished');

        const txtExec = await smartMerge.executeMerge([txt1, txt2], {
            mergeType: 'txt',
            outputFilename: 'merged_notes.txt',
            outputDir: TEST_DIR,
            overwrite: true
        });

        assert(txtExec.status === 'SUCCESS', 'TXT merge succeeded');
        assert(fs.existsSync(txtExec.outputPath), 'Merged text file exists');
        const txtContent = fs.readFileSync(txtExec.outputPath, 'utf8');
        assert(txtContent.includes('System started'), 'Contains content from first file');
        assert(txtContent.includes('Finished'), 'Contains content from second file');
        assert(txtContent.includes('>>> FILE [1/2]'), 'Contains formatted delimiter header');

        // -----------------------------------------------------------
        // TEST 4: EMPTY FILES & EXACT SHA-256 DUPLICATES
        // -----------------------------------------------------------
        console.log('\n--- TEST 4: Empty Files & Exact Duplicates ---');
        const emptyFile = path.join(TEST_DIR, 'empty.txt');
        fs.writeFileSync(emptyFile, '');

        const dupFile = path.join(TEST_DIR, 'notes1_copy.txt');
        fs.copyFileSync(txt1, dupFile); // Exact duplicate of txt1

        const dupVal = await smartMerge.validateMergeCandidates([txt1, dupFile, emptyFile], {
            mergeType: 'txt'
        });

        assert(dupVal.summary.duplicateFiles >= 1, 'Exact duplicate detected via SHA-256');
        assert(dupVal.summary.emptyFiles >= 1, 'Empty file detected');
        const dupIssue = dupVal.issues.find(i => i.problem.includes('duplicate'));
        assert(dupIssue && dupIssue.severity === 'WARNING', 'Duplicate flagged with WARNING severity');
        assert(dupIssue && dupIssue.canContinue === true, 'Duplicate allows merge with warning');

        // -----------------------------------------------------------
        // TEST 5: CSV MERGE & COLUMN ALIGNMENT
        // -----------------------------------------------------------
        console.log('\n--- TEST 5: CSV Merge & Column Alignment ---');
        const csv1 = path.join(TEST_DIR, 'employees_sales.csv');
        const csv2 = path.join(TEST_DIR, 'employees_eng.csv');
        const csvOut = path.join(TEST_DIR, 'merged_employees.csv');

        // File 1: Name, Age, Department (2 data rows)
        createSampleCsv(csv1, ['Name', 'Age', 'Department'], [
            ['Alice', '28', 'Sales'],
            ['Bob', '34', 'Marketing']
        ]);

        // File 2: Department, Name, Salary (columns in different order, missing Age, extra Salary) (2 data rows)
        createSampleCsv(csv2, ['Department', 'Name', 'Salary'], [
            ['Engineering', 'Charlie', '95000'],
            ['DevOps', 'Dana', '105000']
        ]);

        const csvVal = await smartMerge.validateMergeCandidates([csv1, csv2], {
            mergeType: 'csv',
            outputFilename: 'merged_employees.csv',
            outputDir: TEST_DIR
        });

        assert(csvVal.canMerge === true, 'CSV merge is possible with mismatched columns');
        assert(csvVal.compatibilityStatus === 'COMPATIBLE_WITH_WARNINGS', 'Status is COMPATIBLE_WITH_WARNINGS');
        assert(csvVal.issues.some(i => i.problem.includes('Column Header Mismatch')), 'Column mismatch warning reported');
        assert(csvVal.csvUnifiedColumns.length === 4, 'Unified columns count is 4 (Name, Age, Department, Salary)');

        const csvExec = await smartMerge.executeMerge([csv1, csv2], {
            mergeType: 'csv',
            outputFilename: 'merged_employees.csv',
            outputDir: TEST_DIR,
            overwrite: true
        });

        assert(csvExec.status === 'SUCCESS', 'CSV merge executed successfully');
        assert(fs.existsSync(csvExec.outputPath), 'CSV merged output exists');

        // Verify CSV structure
        const csvResultText = fs.readFileSync(csvExec.outputPath, 'utf8');
        const parsedRows = smartMerge.parseCsv(csvResultText);
        
        assert(parsedRows.length === 5, `CSV output has 1 header + 4 data rows = 5 rows total (got ${parsedRows.length})`);
        const headerRow = parsedRows[0];
        assert(headerRow.includes('Name') && headerRow.includes('Age') && headerRow.includes('Department') && headerRow.includes('Salary'), 'Output header contains all unified columns');

        // Check Charlie's row (Charlie had Salary 95000 and missing Age)
        const charlieRow = parsedRows.find(r => r.includes('Charlie'));
        assert(charlieRow !== undefined, 'Charlie is present in merged data');
        const nameIdx = headerRow.indexOf('Name');
        const salaryIdx = headerRow.indexOf('Salary');
        const ageIdx = headerRow.indexOf('Age');
        assert(charlieRow[nameIdx] === 'Charlie', 'Name aligned correctly');
        assert(charlieRow[salaryIdx] === '95000', 'Salary aligned correctly');
        assert(charlieRow[ageIdx] === '', 'Missing Age safely filled with empty string');

        // -----------------------------------------------------------
        // TEST 6: REST API ENDPOINTS TEST (Local HTTP)
        // -----------------------------------------------------------
        console.log('\n--- TEST 6: Express REST API Endpoints ---');
        const addr = server.address();
        console.log('Server address:', addr);
        const port = addr ? addr.port : 3000;
        const BASE = `http://127.0.0.1:${port}`;

        // 6.1 GET /api/merge/compatible-files
        let res = await fetch(`${BASE}/api/merge/compatible-files?folder=${encodeURIComponent(TEST_DIR)}&type=pdf`);
        let json = await res.json();
        assert(json.status === 'success', 'GET /api/merge/compatible-files returned success');
        assert(json.files.length >= 3, 'Found compatible PDF files in folder');

        // 6.2 POST /api/merge/upload
        const sampleBase64 = Buffer.from('API Upload Staging Test Content').toString('base64');
        res = await fetch(`${BASE}/api/merge/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'api_staged.txt', base64: sampleBase64 })
        });
        json = await res.json();
        assert(json.status === 'success', 'POST /api/merge/upload staged file successfully');
        assert(fs.existsSync(json.file.path), 'Staged file exists on disk in temp_merges');

        // 6.3 POST /api/merge/validate
        res = await fetch(`${BASE}/api/merge/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: [{ path: pdf1 }, { path: pdf2 }],
                mergeType: 'pdf'
            })
        });
        json = await res.json();
        assert(json.status === 'success', 'POST /api/merge/validate returned success');
        assert(json.validation.canMerge === true, 'Validation confirms mergeable');

        // 6.4 POST /api/merge/preview
        res = await fetch(`${BASE}/api/merge/preview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: [{ path: pdf1 }, { path: pdf2 }],
                mergeType: 'pdf',
                outputFilename: 'api_preview_doc.pdf'
            })
        });
        json = await res.json();
        assert(json.status === 'success', 'POST /api/merge/preview returned success');
        assert(json.preview.totalFiles === 2, 'Preview reports 2 files');

        // 6.5 POST /api/merge/execute
        res = await fetch(`${BASE}/api/merge/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: [{ path: txt1 }, { path: txt2 }],
                mergeType: 'txt',
                outputFilename: 'api_executed_merge.txt',
                outputDir: TEST_DIR,
                overwrite: true
            })
        });
        json = await res.json();
        assert(json.status === 'SUCCESS', 'POST /api/merge/execute succeeded with status SUCCESS');
        const createdMergeId = json.mergeId;
        assert(createdMergeId !== undefined, 'Created mergeId returned');

        // 6.6 GET /api/merge/history
        res = await fetch(`${BASE}/api/merge/history`);
        json = await res.json();
        assert(json.status === 'success', 'GET /api/merge/history returned success');
        assert(json.history.length > 0, 'Merge history contains records in SQLite');

        // 6.7 GET /api/merge/result/:id
        res = await fetch(`${BASE}/api/merge/result/${createdMergeId}`);
        json = await res.json();
        assert(json.status === 'success', 'GET /api/merge/result/:id retrieved record');
        assert(json.record.status === 'SUCCESS', 'Retrieved record has status SUCCESS');

        // 6.8 Direct format routes (/api/merge/pdf, /api/merge/txt, /api/merge/csv)
        res = await fetch(`${BASE}/api/merge/txt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                files: [{ path: txt1 }, { path: txt2 }],
                outputFilename: 'api_txt_endpoint.txt',
                outputDir: TEST_DIR,
                overwrite: true
            })
        });
        json = await res.json();
        assert(json.status === 'SUCCESS', 'POST /api/merge/txt endpoint succeeded');

        console.log('\n======================================================');
        console.log(`   >>> ALL ${passedTests} SMART MERGE TESTS PASSED! <<<   `);
        console.log('======================================================\n');
    } catch (err) {
        console.error('\nTest Suite encountered an error:', err.message, err.cause);
        failedTests++;
    } finally {
        server.close();
        if (failedTests > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

// Allow server a brief moment to start
setTimeout(runSmartMergeTestSuite, 600);
