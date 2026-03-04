'use client';

import { useState } from 'react';
import Mermaid from '@/components/Mermaid';
import ReactMarkdown from 'react-markdown';
import { Loader2, Code2, GitBranch, TableProperties, Sparkles } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/themes/prism-tomorrow.css';

export default function Home() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    mermaid: string;
    tooltips: Record<string, string>;
    complexity: string;
    testcases: any[];
    rawOutput?: string;
  } | null>(null);
  const [error, setError] = useState('');

  const analyzeCode = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập mã nguồn để phân tích!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi gọi API');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-md">
            <Code2 size={26} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">WhiteBox Analyzer</h1>
            <p className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
              <Sparkles size={14} className="text-amber-500" />
              Tự động vẽ sơ đồ luồng & tạo Test Case (AI-powered)
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Left Column: Input */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[82vh]">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2 text-slate-800">
              Mã nguồn đầu vào
            </h2>
            <p className="text-sm text-slate-500 mb-4">Dán mã nguồn (C++, Java, JS, Python...) để phân tích nhánh.</p>

            <div className="flex-1 w-full bg-[#2d2d2d] rounded-xl overflow-hidden border border-slate-700 shadow-inner flex flex-col relative group">
              <div className="absolute top-0 right-0 bg-slate-700/50 text-slate-300 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-bl-lg backdrop-blur-sm z-10">
                Code Editor
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <Editor
                  value={code}
                  onValueChange={code => setCode(code)}
                  highlight={code => Prism.highlight(code, Prism.languages.cpp, 'cpp')}
                  padding={20}
                  style={{
                    fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                    fontSize: 14,
                    minHeight: '100%',
                    color: '#f8f8f2'
                  }}
                  className="focus:outline-none"
                  placeholder="// Nhập mã nguồn vào đây..."
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-3 font-medium bg-red-50 p-2 rounded">{error}</p>}
            <button
              onClick={analyzeCode}
              disabled={loading}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:bg-blue-400"
            >
              {loading ? <><Loader2 className="animate-spin" size={20} /> Đang phân tích (AI)...</> : 'Phân Tích Mã Nguồn'}
            </button>
          </div>

          {/* Right Column: Output */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[80vh] overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 bg-slate-50/50">
                <Loader2 className="animate-spin text-blue-500" size={48} />
                <div className="text-center font-medium animate-pulse">
                  <p>Khởi tạo luồng điều khiển...</p>
                  <p className="text-xs font-normal mt-1 opacity-70">Đang quét độ bao phủ nhánh bằng Gemini</p>
                </div>
              </div>
            ) : result ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Chart Section */}
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b pb-2">
                    <GitBranch className="text-purple-600" /> Sơ đồ Dòng Đặc Khiển (CFG)
                  </h2>
                  <div className="bg-slate-50 border rounded-lg p-4 overflow-x-auto relative">
                    {result.mermaid ? <Mermaid chart={result.mermaid} tooltips={result.tooltips} /> : <p className="text-sm text-slate-500 italic">Không thể render đồ thị.</p>}
                  </div>
                </section>

                {/* Complexity Section */}
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b pb-2">
                    Tối ưu độ phức tạp
                  </h2>
                  <div className="bg-amber-50 text-amber-900 border border-amber-200 rounded-lg p-4 text-sm prose">
                    <ReactMarkdown>{result.complexity}</ReactMarkdown>
                  </div>
                </section>

                {/* Test Cases Table */}
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b pb-2">
                    <TableProperties className="text-green-600" /> Tự động Test Cases (Branch Coverage)
                  </h2>
                  <div className="overflow-x-auto ring-1 ring-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">ID</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Mục đích (Description)</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Đường dẫn (Path)</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Đầu vào (Inputs)</th>
                          <th className="px-4 py-3 text-left font-medium text-slate-600">Kết quả (Outputs)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {result.testcases && result.testcases.length > 0 ? (
                          result.testcases.map((tc: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-medium whitespace-nowrap">{tc.id}</td>
                              <td className="px-4 py-3 text-slate-700">{tc.description}</td>
                              <td className="px-4 py-3 font-mono text-xs text-blue-600">{tc.path}</td>
                              <td className="px-4 py-3 text-slate-600 font-mono text-xs break-all">
                                {JSON.stringify(tc.inputs)}
                              </td>
                              <td className="px-4 py-3 text-slate-600 font-mono text-xs break-all">
                                {JSON.stringify(tc.expected_outputs)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500 bg-slate-50 italic">
                              Không có test case nào được tạo. Bạn hãy kiểm tra lại code đầu vào nhé.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <p>Nhập mã nguồn và bấm phân tích để xem kết quả.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
