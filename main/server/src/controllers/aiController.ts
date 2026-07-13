import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

type GeminiMessage = {
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
};

const generateGeminiContent = async (
    systemInstruction: string,
    contents: GeminiMessage[],
    temperature: number,
    maxOutputTokens: number
) => {
    if (!GOOGLE_API_KEY) {
        throw new Error('GOOGLE_API_KEY is not configured');
    }

    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
        {
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { temperature, maxOutputTokens }
        },
        { params: { key: GOOGLE_API_KEY } }
    );

    return response.data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('')
        .trim() || '';
};

const SYSTEM_PROMPT = `You are StoreAI, an intelligent store management assistant integrated with a live retail database.

You have access to store data via the system (inventory/products, sales/orders, customers, suppliers, HR).
When the user asks about specific data, the system will query the database and provide you with results to summarize.

Guidelines:
- Be concise, helpful, and professional
- Use bullet points or tables for structured data
- If you don't know something, say so
- For inventory queries, mention stock levels and prices
- For sales queries, mention amounts and dates
- Keep responses under 150 words unless the user asks for detail`;

export const chat = async (req: Request, res: Response) => {
    const { query, history } = req.body;
    const lowerQuery = query?.toLowerCase() || '';

    try {
        let responseText = '';
        let contextData: any = null;
        let source = 'CONVERSATION';
        let intent = 'GENERAL';

        const intentResponse = await generateGeminiContent(
            `Classify the user's store query into exactly one category. Respond with ONLY the category word, nothing else.

Categories:
- INVENTORY: questions about products, stock, inventory, items, SKUs, pricing, stock levels, low stock
- SALES: questions about sales, revenue, orders, invoices, transactions, purchase history
- CUSTOMERS: questions about customers, clients, buyers, customer details
- HR: questions about employees, staff, payroll, attendance, HR
- SUPPLIERS: questions about suppliers, vendors, purchase orders
- GENERAL: greetings, help requests, chit-chat, or anything else`,
            [{ role: 'user', parts: [{ text: query }] }],
            0.1,
            20
        );

        intent = intentResponse.toUpperCase() || 'GENERAL';

        if (intent === 'INVENTORY') {
            const products = await prisma.product.findMany({
                take: 15,
                orderBy: { stockQuantity: 'asc' },
                select: { name: true, sku: true, stockQuantity: true, price: true, category: true }
            });

            if (lowerQuery.includes('low') || lowerQuery.includes('shortage') || lowerQuery.includes('short')) {
                const lowStock = products.filter(p => p.stockQuantity < 10);
                contextData = lowStock;
                source = 'SQL';
            } else if (products.length > 0) {
                contextData = products;
                source = 'SQL';
            }
        }
        else if (intent === 'SALES') {
            const sales = await prisma.sale.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { customer: { select: { name: true } } }
            });
            if (sales.length > 0) {
                contextData = sales.map(s => ({
                    Invoice: s.invoiceNo,
                    Customer: s.customer?.name || 'Walk-in',
                    Amount: s.totalAmount,
                    Date: new Date(s.createdAt).toLocaleDateString()
                }));
                source = 'SQL';
            }
        }
        else if (intent === 'CUSTOMERS') {
            const customers = await prisma.customer.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { name: true, email: true, city: true, phone: true }
            });
            if (customers.length > 0) {
                contextData = customers;
                source = 'SQL';
            }
        }
        else if (intent === 'HR') {
            const employees = await prisma.employee.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { firstName: true, lastName: true, designation: true, employeeId: true, departmentId: true }
            });
            if (employees.length > 0) {
                contextData = employees;
                source = 'SQL';
            }
        }
        else if (intent === 'SUPPLIERS') {
            const suppliers = await prisma.supplier.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { name: true, email: true, contact: true }
            });
            if (suppliers.length > 0) {
                contextData = suppliers;
                source = 'SQL';
            }
        }

        const messages: GeminiMessage[] = [];

        if (history && history.length > 0) {
            const recentHistory = history.slice(-6);
            for (const msg of recentHistory) {
                if (msg.role && msg.content) {
                    messages.push({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    });
                }
            }
        }

        // Gemini conversations must start with a user message. The UI's welcome
        // message is assistant-authored, so omit it when it leads the history.
        while (messages[0]?.role === 'model') {
            messages.shift();
        }

        let userContent = query;
        if (contextData) {
            userContent = `The user asked: "${query}"\n\nHere is the relevant data from the database:\n${JSON.stringify(contextData, null, 2)}\n\nPlease summarize this data for the user in a friendly, conversational way.`;
        }

        messages.push({ role: 'user', parts: [{ text: userContent }] });

        responseText = await generateGeminiContent(SYSTEM_PROMPT, messages, 0.7, 500);

        if (!responseText) {
            responseText = "I'm having trouble processing that request. Could you try rephrasing?";
        }

        res.json({ response: responseText, context: contextData, source });
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            response: 'StoreAI Assistant is temporarily unavailable. Please try again in a moment.',
            source: 'ERROR',
            detail: 'The assistant service could not complete the request.'
        });
    }
};

export const healthCheck = async (req: Request, res: Response) => {
    const googleConfigured = !!GOOGLE_API_KEY;
    res.json({
        status: 'online',
        service: 'StoreAI Assistant',
        version: '1.0.0',
        provider: 'google-gemini',
        model: GEMINI_MODEL,
        google: googleConfigured ? 'configured' : 'not configured'
    });
};
