import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
Bạn là một chuyên gia kiểm thử phần mềm tự động (QA/Tester). Nhiệm vụ của bạn là nhận vào một đoạn mã nguồn (hoặc thuật toán dạng văn bản), phân tích nó và trả về các dữ liệu có cấu trúc nghiêm ngặt để hệ thống vẽ Sơ đồ luồng (Control Flow Graph) và hiển thị bảng Test Case.

KHÔNG ĐƯỢC trả lời thêm bất kỳ văn bản giao tiếp nào khác.
TUYỆT ĐỐI KHÔNG ĐƯỢC SỬ DỤNG markdown block (\`\`\`mermaid hay \`\`\`json) bao bọc đáp án, chỉ trả về đúng 3 khối theo cấu trúc đánh dấu ngoặc vuông sau đây:

[BLOCK_MERMAID]
graph TD
(Ghi thẳng mã nguồn Mermaid dưới label này. Tuyệt đối không dùng ký tự \`\`\`mermaid.
QUAN TRỌNG VỀ MÃ MERMAID (Cú pháp siêu đơn giản để tránh lỗi):
1. Đặt ID cho nút Bắt đầu là "Start", nút Kết thúc là "End". Các khối code dùng chữ số (Ví dụ: 1, 2, 3).
2. TẠO CÁC LIÊN KẾT TRỰC TIẾP MÀ KHÔNG ĐỊNH NGHĨA HÌNH DÁNG NÚT.
3. TUYỆT ĐỐI KHÔNG DÙNG BẤT KỲ DẤU NGOẶC NÀO (KHÔNG [], KHÔNG (), KHÔNG {}).
4. KHÔNG VIẾT CODE HAY BIỂU THỨC VÀO MERMAID. CHỈ DÙNG SỐ ĐỂ LIÊN KẾT NHƯ VÍ DỤ DƯỚI ĐÂY:

Ví dụ ĐÚNG VÀ BẮT BUỘC:
Start --> 1
1 --> 2
2 -- True --> 3
2 -- False --> 4
3 --> End
4 --> End

Chỉ được cung cấp nội dung code trong khối [BLOCK_TOOLTIPS_JSON] bằng ID tương ứng, tuyệt đối không xuất hiện trong Markdown.
)

[BLOCK_TOOLTIPS_JSON]
{
  "nodeStart": "Bắt đầu thuật toán",
  "N1": "int soLanSaiPin = 0;\\nbool isLocked = false;"
}
(BẮT BUỘC TRẢ VỀ khối này chứa 1 Object JSON. Các key là ID của Node trong biểu đồ Mermaid ở trên. Value là toàn bộ mã nguồn gốc tương ứng với Node đó. CẤU TRÚC PHẢI CHUẨN JSON).

[BLOCK_COMPLEXITY]
(Trả về các công thức tính và kết quả của độ phức tạp Cyclomatic V(G)).

[BLOCK_TESTCASES_JSON]
[
  {"id": "TC1", "description": "...", "path": "...", "inputs": {}, "expected_outputs": {}}
]
(Trả về mảng JSON testcases. TUYỆT ĐỐI KHÔNG SỬ DỤNG BLOCK \`\`\`).
`;

export async function POST(req: NextRequest) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Body must contain "code" field' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY rests undefined' }, { status: 500 });
        }

        // Prepare the model
        // Using a fallback array for maximum compatibility
        const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'];
        let text = '';
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const prompt = `${SYSTEM_PROMPT} \n\nĐầu vào(Mã nguồn): \n${code} `;
                const result = await model.generateContent(prompt);
                text = result.response.text();
                console.log(`Successfully used model: ${modelName} `);
                break; // Success!
            } catch (err: any) {
                console.warn(`Model ${modelName} failed: `, err.message);
                lastError = err;
            }
        }

        if (!text) {
            throw lastError || new Error("All Gemini models failed to generate content.");
        }

        console.log("Raw LLM Output:", text);

        // Parse the 4 blocks using regex
        const mermaidMatch = text.match(/\[BLOCK_MERMAID\]\s*([\s\S]*?)\s*\[BLOCK_TOOLTIPS_JSON\]/);
        const tooltipsMatch = text.match(/\[BLOCK_TOOLTIPS_JSON\]\s*([\s\S]*?)\s*\[BLOCK_COMPLEXITY\]/);
        const complexityMatch = text.match(/\[BLOCK_COMPLEXITY\]\s*([\s\S]*?)\s*\[BLOCK_TESTCASES_JSON\]/);
        const jsonMatch = text.match(/\[BLOCK_TESTCASES_JSON\]\s*([\s\S]*)/);

        let mermaid = mermaidMatch ? mermaidMatch[1].trim() : '';
        let tooltipsText = tooltipsMatch ? tooltipsMatch[1].trim() : '{}';
        let complexity = complexityMatch ? complexityMatch[1].trim() : '';
        let testcasesText = jsonMatch ? jsonMatch[1].trim() : '';

        // Clean up mermaid code block wraps if ai provided them
        if (mermaid.includes('```mermaid')) {
            mermaid = mermaid.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        } else if (mermaid.includes('```')) {
            mermaid = mermaid.replace(/```/g, '').trim();
        }

        // Advanced Mermaid syntax sanitization to prevent "Lexical Error"
        // Remove quotes, single quotes, and backslashes which often break Mermaid parsers
        mermaid = mermaid.replace(/["']/g, '').replace(/\\/g, '');

        // Clean up json code block wraps if ai provided them
        if (testcasesText.includes('```json')) {
            testcasesText = testcasesText.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (testcasesText.includes('```')) {
            testcasesText = testcasesText.replace(/```/g, '').trim();
        }

        if (tooltipsText.includes('```json')) {
            tooltipsText = tooltipsText.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (tooltipsText.includes('```')) {
            tooltipsText = tooltipsText.replace(/```/g, '').trim();
        }

        let testcases = [];
        try {
            testcases = JSON.parse(testcasesText);
        } catch (e) {
            console.error("Failed to parse Testcases JSON:", testcasesText);
            testcases = []; // Fallback empty
        }

        let tooltips = {};
        try {
            tooltips = JSON.parse(tooltipsText);
        } catch (e) {
            console.error("Failed to parse Tooltips JSON:", tooltipsText);
            tooltips = {}; // Fallback empty
        }

        return NextResponse.json({
            mermaid,
            tooltips,
            complexity,
            testcases,
            rawOutput: text
        });

    } catch (error: any) {
        console.error('API Analyze Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
