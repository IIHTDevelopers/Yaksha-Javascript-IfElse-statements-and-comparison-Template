const esprima = require('esprima');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const xmlBuilder = require('xmlbuilder');

// Define TestCaseResultDto
class TestCaseResultDto {
    constructor(methodName, methodType, actualScore, earnedScore, status, isMandatory, errorMessage) {
        this.methodName = methodName;
        this.methodType = methodType;
        this.actualScore = actualScore;
        this.earnedScore = earnedScore;
        this.status = status;
        this.isMandatory = isMandatory;
        this.errorMessage = errorMessage;
    }
}

// Define TestResults
class TestResults {
    constructor() {
        this.testCaseResults = {};
        this.customData = '';  // Include custom data from the file
    }
}

// Function to read the custom.ih file
function readCustomFile() {
    let customData = '';
    try {
        customData = fs.readFileSync('../custom.ih', 'utf8');
    } catch (err) {
        console.error('Error reading custom.ih file:', err);
    }
    return customData;
}

// Function to send test case result to the server
async function sendResultToServer(testResults) {
    try {
        const response = await axios.post('https://compiler.techademy.com/v1/mfa-results/push', testResults, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('Server Response:', response.data);
    } catch (error) {
        console.error('Error sending data to server:', error);
    }
}

// Function to generate the XML report
function generateXmlReport(result) {
    const xml = xmlBuilder.create('test-cases')
        .ele('case')
        .ele('test-case-type', result.status)
        .up()
        .ele('name', result.methodName)
        .up()
        .ele('status', result.status)
        .up()
        .end({ pretty: true });
    return xml;
}

// Function to write to output files
function writeOutputFiles(result, fileType) {
    const outputFiles = {
        functional: "./output_revised.txt",
        boundary: "./output_boundary_revised.txt",
        exception: "./output_exception_revised.txt",
        xml: "./yaksha-test-cases.xml"
    };

    let resultStatus = result.status === 'Passed' ? 'PASS' : 'FAIL';
    let output = `${result.methodName}=${resultStatus}\n`;

    let outputFilePath = outputFiles[fileType];
    if (outputFilePath) {
        fs.appendFileSync(outputFilePath, output);
    }
}

// Function to check if if/else statements are used
function checkIfElseUsage(ast) {
    let result = 'Passed';
    let feedback = [];
    let ifElseUsed = false;

    ast.body.forEach((node) => {
        if (node.type === 'IfStatement') {
            ifElseUsed = true;
        }
    });

    if (!ifElseUsed) {
        result = 'Failed';
        feedback.push("You must use an if/else statement to control the flow.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking if/else statement usage\x1b[0m`);

    return new TestCaseResultDto(
        'IfElseUsage',
        'functional',
        1,
        result === 'Passed' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check if comparison operators are used
function checkComparisonOperators(ast) {
    let result = 'Passed';
    let feedback = [];
    let comparisonOperatorsUsed = { equal: false, greaterThan: false, lessThan: false, strictEqual: false };

    ast.body.forEach((node) => {
        if (node.type === 'IfStatement') {
            const testExpression = node.test;

            // Check for various comparison operators
            if (testExpression.type === 'BinaryExpression') {
                const operator = testExpression.operator;
                
                if (operator === '>') comparisonOperatorsUsed.greaterThan = true;
                if (operator === '===') comparisonOperatorsUsed.strictEqual = true;
                if (operator === '===') comparisonOperatorsUsed.equal = true;
                if (operator === '<=') comparisonOperatorsUsed.lessThan = true;
                if (operator === '<') comparisonOperatorsUsed.lessThan = true;
            }
        }
    });

    for (let operator in comparisonOperatorsUsed) {
        if (!comparisonOperatorsUsed[operator]) {
            result = 'Failed';
            feedback.push(`You must use the '${operator}' comparison operator.`);
        }
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking comparison operators usage\x1b[0m`);

    return new TestCaseResultDto(
        'ComparisonOperators',
        'functional',
        1,
        result === 'Passed' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to check if else if is used correctly
function checkElseIfUsage(ast) {
    let result = 'Passed';
    let feedback = [];
    let elseIfUsed = false;

    ast.body.forEach((node) => {
        if (node.type === 'IfStatement' && node.alternate && node.alternate.type === 'IfStatement') {
            elseIfUsed = true;
        }
    });

    if (!elseIfUsed) {
        result = 'Failed';
        feedback.push("You must use an else if statement for multiple conditions.");
    }

    // Detailed logging of the check
    console.log(`\x1b[33mChecking else if statement usage\x1b[0m`);

    return new TestCaseResultDto(
        'ElseIfUsage',
        'functional',
        1,
        result === 'Passed' ? 1 : 0,
        result,
        true,
        feedback.join(', ')
    );
}

// Function to grade the student's code
function gradeAssignment() {
    const studentFilePath = path.join(__dirname, '..', 'index.js');
    let studentCode;

    try {
        studentCode = fs.readFileSync(studentFilePath, 'utf-8');
    } catch (err) {
        console.error("Error reading student's file:", err);
        return;
    }

    const ast = esprima.parseScript(studentCode);

    // Execute checks and prepare testResults
    const testResults = new TestResults();
    const GUID = "d805050e-a0d8-49b0-afbd-46a486105170";  // Example GUID for each test case

    // Assign the results of each test case
    testResults.testCaseResults[GUID] = checkIfElseUsage(ast);
    testResults.testCaseResults[GUID + '-comparison-operators'] = checkComparisonOperators(ast);
    testResults.testCaseResults[GUID + '-elseif-usage'] = checkElseIfUsage(ast);

    // Read custom data from the custom.ih file
    testResults.customData = readCustomFile();

    // Send the results of each test case to the server
    Object.values(testResults.testCaseResults).forEach(testCaseResult => {
        const resultsToSend = {
            testCaseResults: {
                [GUID]: testCaseResult
            },
            customData: testResults.customData
        };

        console.log("Sending below data to server");
        console.log(resultsToSend);

        // Log the test result in yellow for pass and red for fail using ANSI codes
        if (testCaseResult.status === 'Passed') {
            console.log(`\x1b[33m${testCaseResult.methodName}: Pass\x1b[0m`); // Yellow for pass
        } else {
            console.log(`\x1b[31m${testCaseResult.methodName}: Fail\x1b[0m`); // Red for fail
        }

        // Send each result to the server
        sendResultToServer(resultsToSend);
    });

    // Generate XML report for each test case
    Object.values(testResults.testCaseResults).forEach(result => {
        const xml = generateXmlReport(result);
        fs.appendFileSync('./test-report.xml', xml);
    });

    // Write to output files for each test case
    Object.values(testResults.testCaseResults).forEach(result => {
        writeOutputFiles(result, 'functional');
    });
}

// Function to delete output files
function deleteOutputFiles() {
    const outputFiles = [
        "./output_revised.txt",
        "./output_boundary_revised.txt",
        "./output_exception_revised.txt",
        "./yaksha-test-cases.xml"
    ];

    outputFiles.forEach(file => {
        // Check if the file exists
        if (fs.existsSync(file)) {
            // Delete the file if it exists
            fs.unlinkSync(file);
            console.log(`Deleted: ${file}`);
        }
    });
}

// Function to delete output files and run the grading function
function executeGrader() {
    // Delete all output files first
    deleteOutputFiles();

    // Run the grading function
    gradeAssignment();
}

// Execute the custom grader function
executeGrader();
