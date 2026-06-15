const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

const USE_MOCK_MODE = false // Set to true to skip API calls entirely
const DISABLE_PUPPETEER = true // Disable PDF generation for Vercel compatibility

if (!process.env.GOOGLE_GENAI_API_KEY && !USE_MOCK_MODE) {
    console.error("ERROR: GOOGLE_GENAI_API_KEY is not set in .env file!")
}

let ai
if (!USE_MOCK_MODE) {
    ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_GENAI_API_KEY
    })
}


const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

// Mock data for testing
function getMockInterviewReport(jobDescription) {
    return {
        matchScore: 78,
        title: "Software Engineer Interview Plan",
        technicalQuestions: [
            {
                question: "Explain the concept of closures in JavaScript",
                intention: "To assess understanding of function scoping and lexical environment",
                answer: "A closure is a function that remembers its lexical scope even when executed outside of it. It allows access to variables from an outer function scope even after the outer function has returned."
            },
            {
                question: "What's the difference between let, const, and var?",
                intention: "To check understanding of ES6 variable declarations",
                answer: "var is function-scoped, let and const are block-scoped. const cannot be reassigned, but objects/arrays declared with const can still be modified."
            }
        ],
        behavioralQuestions: [
            {
                question: "Tell me about a time you had to work with a difficult team member",
                intention: "To assess conflict resolution and teamwork skills",
                answer: "Focus on the situation, your actions, and the positive outcome. Emphasize communication and problem-solving skills."
            }
        ],
        skillGaps: [
            { skill: "Cloud infrastructure (AWS/GCP)", severity: "medium" },
            { skill: "TypeScript advanced patterns", severity: "low" }
        ],
        preparationPlan: [
            { day: 1, focus: "Data Structures Review", tasks: ["Review arrays, linked lists, and hash tables", "Practice 5 easy LeetCode problems"] },
            { day: 2, focus: "System Design Basics", tasks: ["Study scalability concepts", "Practice designing a URL shortener"] }
        ]
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    if (USE_MOCK_MODE) {
        console.log("Using mock mode - returning sample interview report")
        return getMockInterviewReport(jobDescription)
    }

    try {
        const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume || "Not provided"}
                        Self Description: ${selfDescription || "Not provided"}
                        Job Description: ${jobDescription}
`

        console.log("Calling Google GenAI API...")
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash", // Stable model with better free quotas
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(interviewReportSchema),
            }
        })

        console.log("Google GenAI API response received successfully!")
        return JSON.parse(response.text)
    } catch (error) {
        console.error("ERROR in generateInterviewReport:", error.message)
        console.log("Falling back to mock data due to API failure")
        return getMockInterviewReport(jobDescription)
    }
}

function getMockResumeHtml() {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 25px; }
        .section { margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>Candidate Name</h1>
    <p><strong>Email:</strong> candidate@email.com</p>
    
    <div class="section">
        <h2>Experience</h2>
        <p><strong>Senior Developer</strong> - Tech Company Inc. (2022-Present)</p>
        <ul>
            <li>Developed and maintained web applications using React and Node.js</li>
            <li>Led a team of 3 junior developers</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>Skills</h2>
        <p>JavaScript, React, Node.js, Python, PostgreSQL</p>
    </div>
</body>
</html>`
}

async function generatePdfFromHtml(htmlContent) {
    if (DISABLE_PUPPETEER) {
        // Return a simple buffer that says PDF generation is disabled
        return Buffer.from("PDF generation is temporarily disabled for Vercel deployment.")
    }
    
    try {
        const puppeteer = require("puppeteer")
        const browser = await puppeteer.launch()
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4", margin: {
                top: "20mm",
                bottom: "20mm",
                left: "15mm",
                right: "15mm"
            }
        })

        await browser.close()
        return pdfBuffer
    } catch (error) {
        console.error("Error with Puppeteer PDF generation:", error)
        return Buffer.from("PDF generation failed. Please try again later.")
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    if (USE_MOCK_MODE || DISABLE_PUPPETEER) {
        console.log("Using mock mode or Puppeteer disabled - returning sample resume PDF")
        return await generatePdfFromHtml(getMockResumeHtml())
    }

    try {
        const resumePdfSchema = z.object({
            html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
        })

        const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: zodToJsonSchema(resumePdfSchema),
            }
        })

        const jsonContent = JSON.parse(response.text)
        const pdfBuffer = await generatePdfFromHtml(jsonContent.html)
        return pdfBuffer
    } catch (error) {
        console.error("ERROR in generateResumePdf:", error.message)
        console.log("Falling back to mock resume PDF")
        return await generatePdfFromHtml(getMockResumeHtml())
    }
}

module.exports = { generateInterviewReport, generateResumePdf }
