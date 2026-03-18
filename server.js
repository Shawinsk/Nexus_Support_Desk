const express = require('express');
const app = express();
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// IMPORTANT: Replace with your actual Gemini API Key before the lecture
const genAI = new GoogleGenerativeAI("AIzaSyA9AzFptsDgKEidPEX2ZpP96SyW5-q2yLQ");
// =======================
// Configuration
// =======================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Required to parse JSON for API endpoints
app.use(express.static(path.join(__dirname, 'public')));

// =======================
// Database (In-Memory Array)
// =======================
let tickets = [
    {
        id: 1,
        employeeName: 'John Doe',
        department: 'Operations',
        issueTitle: 'Computer not working',
        description: 'My desktop keeps restarting automatically every 10 minutes.',
        priority: 'High',
        status: 'Open',
        assignedTo: 'Hardware Team',
        createdAt: new Date(new Date().getTime() - 90 * 60000), // 1.5 hours ago
        slaDeadline: new Date(new Date().getTime() + 30 * 60000) // 30 mins left
    }
];
let nextId = 2; // Auto-increment ID counter

// =======================
// Smart Dispatch & SLA Engine
// =======================
function analyzeKeywordsForRouting(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('internet') || lowerText.includes('wifi') || lowerText.includes('network') || lowerText.includes('vpn')) {
        return 'Network Team 🌐';
    } else if (lowerText.includes('printer') || lowerText.includes('keyboard') || lowerText.includes('mouse') || lowerText.includes('desktop') || lowerText.includes('laptop')) {
        return 'Hardware Team 💻';
    }
    return 'Software Team 🖥️'; // Default
}

function calculateSLA(priority) {
    const now = new Date();
    if (priority === 'High') {
        return new Date(now.getTime() + (2 * 60 * 60 * 1000)); // 2 Hours SLA
    } else if (priority === 'Medium') {
        return new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 8 Hours SLA
    } else {
        return new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 Hours SLA
    }
}


// =======================
// Routes
// =======================

// 1. Home Page / Create Ticket Page
app.get('/', (req, res) => {
    res.render('create');
});

// 2. Submit a Ticket (POST request)
app.post('/tickets', (req, res) => {
    // Get data from the form
    const { employeeName, department, issueTitle, description, priority } = req.body;
    
    // 🚀 AI / Smart Dispatch Engine (Simulated Next-Gen functionality)
    const assignedTeam = analyzeKeywordsForRouting(`${issueTitle} ${description}`);
    const deadline = calculateSLA(priority);

    // Create new ticket object
    const newTicket = {
        id: nextId++,
        employeeName,
        department,
        issueTitle,
        description,
        priority,
        status: 'Open', // Default status when a ticket is created
        assignedTo: assignedTeam,
        createdAt: new Date(),
        slaDeadline: deadline
    };

    // Save the data to our array
    tickets.push(newTicket);

    // 🚀 Webhook Integration (Microsoft Teams/Slack Simulation)
    // In a real scenario, this would be your Teams Incoming Webhook URL
    const webhookUrl = 'https://webhook.site/fake-teams-webhook-url';
    
    axios.post(webhookUrl, {
        text: `🚨 New Ticket #${newTicket.id} [${newTicket.priority}] auto-assigned to ${newTicket.assignedTo}`
    }).then(response => {
        console.log(`[WEBHOOK SUCCESS] Message sent to Teams/Slack channel!`);
    }).catch(error => {
        console.log(`[WEBHOOK SIMULATED] Message would be sent to Teams: 🚨 New Ticket #${newTicket.id}`);
    });

    // Redirect to the ticket list page
    res.redirect('/tickets');
});

// =======================
// Next-Gen API Endpoints
// =======================

// API: AI Assistant Chatbot (Gemini Integration)
app.post('/api/ai-suggest', async (req, res) => {
    try {
        const { text } = req.body;
        
        // No fallback block needed now, moving to API model...

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `You are an IT Help Desk AI Assistant. An employee submitted this issue: "${text}". Provide a very short 1-sentence tip on what they should try first, and specify the priority severity (Low, Medium, or High). Return JSON format only: { "suggestion": "tip string", "priority": "High/Medium/Low" }`;
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Parse the JSON representation of Gemini response
        const aiData = JSON.parse(responseText.replace(/```json/g, '').replace(/```/g, ''));
        res.json(aiData);
    } catch (error) {
        console.error("AI Error:", error.message);
        // Fallback for lecture if API key fails/404s
        return res.json({ 
            suggestion: "<b>Nexus AI Engine:</b> Restart your device and check local connections. (<i>Note: Showing offline fallback because API Key returned an error</i>).",
            priority: "Medium"
        });
    }
});

// API: Admin AI Solution Generator (Gemini Integration)
app.post('/api/admin/solve', async (req, res) => {
    try {
        const { id } = req.body;
        const ticket = tickets.find(t => t.id === parseInt(id));
        
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `You are a Senior IT Support Engineer helping a junior technician.
A user reported the following internal help desk ticket:
Title: "${ticket.issueTitle}"
Description: "${ticket.description}"

Provide a short, direct, 3-step practical solution to resolve this issue. Keep it extremely concise. Do NOT use markdown code blocks like \`\`\`html. Use raw HTML formatting for readability (e.g., <ul><li>, <b>, <br>).`;
        
        const result = await model.generateContent(prompt);
        let text = result.response.text();
        
        // Strip any residual markdown formatting markers that the model might add by mistake
        text = text.replace(/```html/gi, '').replace(/```/g, ''); 
        
        res.json({ solution: text.trim() });
    } catch (error) {
        console.error("AI Solve Error:", error.message);
        // Fallback for lecture if API key fails/404s
        return res.json({ solution: "<ul><li><b>Step 1:</b> Inspect the reported hardware/software logs.</li><li><b>Step 2:</b> Reboot the affected system or restart the service.</li><li><b>Step 3:</b> If the issue persists, escalate to the L2 Support Team.</li></ul> <br><i class='text-muted small'>(Note: Displaying offline fallback solution due to API Key error)</i>" });
    }
});

// 3. View Tickets Page (For Employees)
app.get('/tickets', (req, res) => {
    res.render('tickets', { tickets });
});

// 4. Admin Panel Page
app.get('/admin', (req, res) => {
    res.render('admin', { tickets });
});

// 5. Update Ticket Status (Admin Action)
app.post('/admin/update/:id', (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { status } = req.body;

    // Find the ticket and update its status
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.status = status;
    }

    res.redirect('/admin');
});

// 6. Delete Ticket (Admin Action)
app.post('/admin/delete/:id', (req, res) => {
    const ticketId = parseInt(req.params.id);

    // Filter out the deleted ticket from the array
    tickets = tickets.filter(t => t.id !== ticketId);

    res.redirect('/admin');
});

// 7. Edit Ticket (Any Action)
app.post('/tickets/edit/:id', (req, res) => {
    const ticketId = parseInt(req.params.id);
    const { issueTitle, priority, department, description } = req.body;

    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
        ticket.issueTitle = issueTitle;
        ticket.priority = priority;
        ticket.department = department;
        ticket.description = description;

        // Optionally, recalculate SLA if priority changed, but for simplicity
        // we just update the fields.
        ticket.slaDeadline = calculateSLA(priority);
    }
    
    res.redirect('/tickets');
});

// 8. Export Tickets to CSV (Admin Action)
app.get('/admin/export', (req, res) => {
    const headers = ['Ticket ID', 'Employee Name', 'Department', 'Issue Title', 'Priority', 'Status', 'Assigned Team', 'Created At', 'SLA Deadline'];
    const rows = tickets.map(t => {
        const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        return [
            t.id,
            escapeCSV(t.employeeName),
            escapeCSV(t.department || 'N/A'),
            escapeCSV(t.issueTitle),
            t.priority,
            t.status,
            escapeCSV(t.assignedTo),
            `"${new Date(t.createdAt).toLocaleString()}"`,
            `"${new Date(t.slaDeadline).toLocaleString()}"`
        ].join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="nexus_helpdesk_report.csv"');
    res.send(csvContent);
});

// =======================
// Start the Server
// =======================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Help Desk System is running at http://localhost:${PORT}`);
    console.log(`Open your browser and visit http://localhost:${PORT}`);
});
