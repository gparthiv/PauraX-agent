const fs = require('fs');
const dbPath = './db.json';

async function saveIssueToDB(issueType, location) {
    try {
        const dbRaw = fs.readFileSync(dbPath, 'utf-8');
        const dbData = JSON.parse(dbRaw);
        const newIssue = { id: Date.now(), type: issueType, location: location, timestamp: new Date().toISOString() };
        dbData.issues.push(newIssue);
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
        console.log("Successfully saved new issue to db.json:", newIssue);
    } catch (error) {
        console.error("Error saving to db.json:", error);
    }
}

module.exports = {
    saveIssueToDB
};