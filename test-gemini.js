const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI("AIzaSyA9AzFptsDgKEidPEX2ZpP96SyW5-q2yLQ");

async function test(modelName) {
    try {
        console.log("Testing model:", modelName);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hi");
        console.log("Success with", modelName, ":", result.response.text());
    } catch (e) {
        console.error("Error with", modelName, ":", e.message);
    }
}

(async () => {
    await test("gemini-2.5-flash");
})();
