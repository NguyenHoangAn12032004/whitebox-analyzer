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
QUAN TRỌNG VỀ LOGIC & HÌNH KHỐI (Theo chuẩn sơ đồ khối giáo trình):
1. BẮT BUỘC TÁCH RIÊNG NÚT BẮT ĐẦU VÀ KẾT THÚC. Sử dụng hình oval tròn hai đầu bằng cú pháp ngoặc đơn. Ví dụ: nodeStart([Start]) và nodeEnd([End]). KHÔNG gộp Start vào chung với các khai báo biến.
2. ÉP KIỂU GỘP KHỐI XỬ LÝ VÀO ĐIỀU KIỆN (Giảm node): Gộp các khai báo biến và lệnh gán lên trên điều kiện nhánh rẽ gần nhất thành CHUNG 1 khối hình thoi ngoặc nhọn.
3. HIỂN THỊ GỌN GÀNG GIAO DIỆN (Tránh hiển thị code dài trên hình):
- Ở phần định nghĩa vẽ hình (graph TD), BẠN CHỈ ĐƯỢC PHÉP IN RA CÁC CHỮ SỐ HOẶC Định danh Nút (Ví dụ: N1{"1"}, hoặc N2{"2"}). CẤM TUYỆT ĐỐI KHÔNG IN BẤT CỨ ĐOẠN MÃ NÀO HOẶC CÔNG THỨC DÀI vào trong ngoặc vẽ hình. Chỉ để chừa lại 1 chữ số nhỏ, việc giải nghĩa đoạn code sẽ được thực hiện bằng Tooltips ở BLOCK_TOOLTIPS_JSON.
- KHÔNG sử dụng cú pháp \`click\` của Mermaid nữa. Xin nhắc lại, KHÔNG DÙNG TỪ KHÓA CLICK.
4. MÀU SẮC DỄ NHÌN: Bạn có thể thêm màu trực tiếp bằng lệnh \`style\` đơn giản. Ví dụ: \`style nodeStart fill:#f9f,stroke:#333\` và \`style N1 fill:#bbf,stroke:#f66\`
)

[BLOCK_TOOLTIPS_JSON]
{
  "nodeStart": "Bắt đầu thuật toán",
  "N1": "int soLanSaiPin = 0;\\nbool isLocked = false;"
}
(BẮT BUỘC TRẢ VỀ khối này chứa 1 Object JSON. Các key là ID của Node trong biểu đồ Mermaid ở trên. Value là toàn bộ mã nguồn gốc/công thức đầy đủ tương ứng với Node đó. CẤU TRÚC PHẢI CHUẨN JSON, các ký tự xuống dòng dùng \\n).

[BLOCK_COMPLEXITY]
(Trả về các công thức tính và kết quả của độ phức tạp Cyclomatic V(G) dựa trên đồ thị trên).

[BLOCK_TESTCASES_JSON]
[
  {"id": "TC1", "description": "...", "path": "...", "inputs": {}, "expected_outputs": {}}
]
(Trả về cấu trúc mảng JSON trên bắt đầu bằng [, kết thúc bằng ], tuyệt đối không sử dụng block \`\`\`)
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
                const prompt = `${SYSTEM_PROMPT}\n\nĐầu vào (Mã nguồn):\n${code}`;
                const result = await model.generateContent(prompt);
                text = result.response.text();
                console.log(`Successfully used model: ${modelName}`);
                break; // Success!
            } catch (err: any) {
                console.warn(`Model ${modelName} failed:`, err.message);
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
