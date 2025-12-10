import React, { useState } from 'react';
import { analyzeResume } from '../services/gemini';
import { FileText, Send, Loader2, CheckCircle, AlertCircle, UploadCloud, FileType, X, Copy, Check } from 'lucide-react';

const ResumeOptimizer: React.FC = () => {
  const [resumeText, setResumeText] = useState('');
  const [fileData, setFileData] = useState<{ name: string; type: string; data: string } | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const processFile = async (file: File) => {
    setError(null);
    setAnalysis(null);
    setResumeText('');
    setFileData(null);

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    try {
      if (file.type === 'application/pdf') {
        const base64Full = await fileToBase64(file);
        const base64Data = base64Full.split(',')[1];
        setFileData({
          name: file.name,
          type: file.type,
          data: base64Data
        });
      } 
      else if (validImageTypes.includes(file.type)) {
         const base64Full = await fileToBase64(file);
         const base64Data = base64Full.split(',')[1];
         setFileData({
           name: file.name,
           type: file.type,
           data: base64Data
         });
      }
      else if (file.name.endsWith('.docx')) {
        if ((window as any).mammoth) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
            setResumeText(result.value);
            setFileData({ name: file.name, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data: '' });
        } else {
            setError("Librería de documentos no cargada. Recarga la página.");
        }
      }
      else if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setResumeText(text);
        setFileData({ name: file.name, type: 'text/plain', data: '' });
      } 
      else {
        setError("Formato no soportado. Usa PDF, DOCX, Imágenes o TXT.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al leer el archivo. Intenta de nuevo.");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFileData(null);
    setResumeText('');
    setAnalysis(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!resumeText && (!fileData || (fileData.type !== 'application/pdf' && !fileData.type.startsWith('image/')))) {
        setError("Por favor sube un archivo o pega el texto de tu CV.");
        return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const input = {
        text: resumeText || undefined,
        file: (fileData && (fileData.type === 'application/pdf' || fileData.type.startsWith('image/'))) 
              ? { data: fileData.data, mimeType: fileData.type } 
              : undefined
      };

      const result = await analyzeResume(input, jobDesc);
      setAnalysis(result);
    } catch (err) {
      setError("Ocurrió un error en el análisis. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (analysis) {
        navigator.clipboard.writeText(analysis);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 p-4 max-w-6xl mx-auto w-full">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" />
          Auditoría de CV con IA Experta
        </h2>
        <p className="text-slate-600 mb-6">
          Sube tu hoja de vida para recibir un diagnóstico ATS, reescritura de bullets con método STAR y análisis de palabras clave para el mercado actual.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            
            {/* Upload Area */}
            {!fileData && !resumeText ? (
                <div 
                    className={`relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer
                        ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                    onDragEnter={handleDrag} 
                    onDragLeave={handleDrag} 
                    onDragOver={handleDrag} 
                    onDrop={handleDrop}
                >
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileInput}
                        accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp" 
                    />
                    <UploadCloud className={`w-8 h-8 mb-3 ${dragActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <p className="text-sm font-medium text-slate-700">Arrastra tu CV o haz clic</p>
                    <p className="text-xs text-slate-400 mt-1">Soporta: PDF, DOCX, Imagen, TXT</p>
                </div>
            ) : (
                <div className="relative w-full p-4 border border-indigo-200 bg-indigo-50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <FileType className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-slate-800 truncate max-w-[200px]">{fileData?.name || 'CV Manual'}</p>
                            <p className="text-xs text-indigo-600 font-medium uppercase">
                                {fileData?.type.includes('word') ? 'DOCX' : fileData?.type.split('/')[1] || 'TXT'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={clearFile}
                        className="p-2 hover:bg-indigo-100 rounded-full text-slate-500 hover:text-red-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Text Fallback / Editor */}
            <div>
               <div className="flex justify-between items-center mb-1">
                   <label className="block text-sm font-medium text-slate-700">
                    Contenido Manual / Notas Adicionales
                   </label>
               </div>
              <textarea
                className="w-full h-24 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm font-mono text-slate-700 bg-slate-50"
                placeholder="Pega texto aquí si no tienes archivo..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descripción del Puesto (Opcional pero Recomendado)
              </label>
              <textarea
                className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm text-slate-700"
                placeholder="Pega la descripción del trabajo aquí. La IA comparará tus palabras clave contra esto para asegurar que pases los filtros."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || (!resumeText && !fileData)}
              className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white transition-all transform active:scale-95
                ${loading || (!resumeText && !fileData)
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30'}`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              {loading ? 'El Reclutador está Analizando...' : 'Analizar y Optimizar'}
            </button>
          </div>

          {/* Results Section */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 h-full min-h-[500px] overflow-y-auto max-h-[800px] relative scroll-smooth">
             {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 mb-4 animate-fadeIn">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            
            {!analysis && !loading && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-center p-8">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <CheckCircle className="w-12 h-12 text-indigo-100" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600">Diagnóstico Pendiente</h3>
                <p className="text-sm max-w-xs mt-2">Sube tu CV y la descripción del puesto para ver tu Score ATS y sugerencias de mejora.</p>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-600 bg-white/90 backdrop-blur-sm z-10 p-6 text-center">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Auditando Perfil Profesional...</h3>
                <div className="space-y-2 text-sm text-slate-500">
                    <p>🔍 Verificando compatibilidad ATS...</p>
                    <p>📊 Calculando impacto de logros (Método STAR)...</p>
                    <p>🧬 Analizando brechas de palabras clave...</p>
                    <p>💼 Redactando sugerencias de LinkedIn...</p>
                </div>
              </div>
            )}

            {analysis && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 text-green-700 p-2 rounded-lg">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 m-0">
                            Reporte Ejecutivo
                        </h3>
                    </div>
                    <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
                        title="Copiar reporte"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'Copiado' : 'Copiar'}
                    </button>
                </div>
                <div className="prose prose-indigo prose-sm max-w-none text-slate-700">
                  <div dangerouslySetInnerHTML={{ __html: analysis
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-indigo-800 mt-6 mb-3 border-l-4 border-indigo-500 pl-3">$1</h2>')
                    .replace(/^### (.*$)/gim, '<h3 class="font-bold text-slate-800 mt-4 mb-2">$1</h3>')
                    .replace(/\*\*(.*)\*\*/gim, '<strong class="text-slate-900">$1</strong>')
                    .replace(/\n/gim, '<br />')
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeOptimizer;
