import React, { useState } from 'react';
import { parseExcel } from './excelService.js';
import { parseImage } from './imageService.js';
import { generateReceipts } from './pdfService.js';

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState(null);
  const [mapping, setMapping] = useState(null);
  const [startReceiptNumber, setStartReceiptNumber] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      let result;
      const fileType = file.type;

      // Check if it's an image file
      if (fileType.startsWith('image/')) {
        console.log('🖼️ Processing image file with OCR...');
        result = await parseImage(file);
      } else {
        // Assume it's an Excel file
        console.log('📊 Processing Excel file...');
        result = await parseExcel(file);
      }

      setData(result.data);
      setMapping(result.mapping);
    } catch (err) {
      console.error(err);
      setError('Failed to upload and parse file. ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!data) return;

    setGenerating(true);
    setError(null);

    try {
      const zipBlob = await generateReceipts(data, startReceiptNumber);

      // Trigger download
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recibos.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('Failed to generate receipts. Error: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Gerador de Recibos
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Upload your Excel file or image (JPG/PNG) to generate PDF receipts automatically.
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Step 1: Upload */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">1. Upload Planilha</h2>
              {file && <span className="text-sm text-green-600 font-medium">Arquivo selecionado</span>}
            </div>

            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".xlsx, .xls, .jpg, .jpeg, .png"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2.5 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer transition-colors"
              />
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-sm
                  ${!file || uploading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
              >
                {uploading ? 'Processando...' : 'Processar Arquivo'}
              </button>
            </div>
          </div>

          {/* Step 2: Preview & Settings */}
          {data && (
            <div className="p-8 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">2. Configuração</h2>
                <span className="text-sm text-gray-500">{data.length} funcionários encontrados</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Primeiro Recibo
                  </label>
                  <input
                    type="number"
                    value={startReceiptNumber}
                    onChange={(e) => setStartReceiptNumber(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Colunas Detectadas</h3>
                  <div className="space-y-2 text-sm">
                    {mapping && Object.entries(mapping).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{key}:</span>
                        <span className={`font-medium ${value ? 'text-green-600' : 'text-red-500'}`}>
                          {value || 'Não encontrado'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Generate */}
          <div className="p-8 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">3. Gerar Recibos</h2>
              <button
                onClick={handleGenerate}
                disabled={!data || generating}
                className={`px-8 py-3 rounded-xl font-bold text-white text-lg transition-all shadow-lg transform hover:-translate-y-0.5
                  ${!data || generating
                    ? 'bg-gray-300 cursor-not-allowed shadow-none'
                    : 'bg-green-600 hover:bg-green-700 hover:shadow-green-200'}`}
              >
                {generating ? 'Gerando PDFs...' : 'Gerar e Baixar Recibos'}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          &copy; 2025 Receipt Generator System
        </div>
      </div>
    </div>
  );
}

export default App;
