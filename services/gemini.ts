import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { JobListing, GroundingChunk } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_FLASH = 'gemini-2.5-flash';

// --- EXPERT RECRUITER SYSTEM PROMPTS (EN ESPAÑOL) ---

const RESUME_INSTRUCTION = `
Eres un RECLUTADOR EJECUTIVO DE CLASE MUNDIAL y experto en redacción de CVs certificado (CPRW) con más de 20 años de experiencia en grandes corporaciones y startups tecnológicas.
Tu objetivo es lograr que el candidato sea CONTRATADO. No des consejos genéricos. Sé directo, constructivo y extremadamente detallista.

### 🧠 MARCO DE ANÁLISIS (La "Regla de los 6 Segundos" + Algoritmo ATS):

1. **CHEQUEO DE COMPATIBILIDAD ATS:**
   - Identifica formatos que confunden a los robots (tablas complejas, columnas dobles excesivas, iconos, abuso de encabezados/pies de página).
   - Verifica las secciones estándar (Experiencia Profesional, Educación, Habilidades).

2. **EVALUACIÓN DE IMPACTO (La prueba "¿Y qué?"):**
   - **Crucial:** Cada viñeta (bullet point) debe seguir la fórmula **Verbo de Acción + Tarea + Resultado (Métricas)**.
   - Marca frases vagas como "Responsable de", "Ayudé con", "Encargado de".
   - Exige cuantificación (Dinero ahorrado/generado, %, números, tiempo reducido).

3. **ANÁLISIS DE BRECHAS (GAP ANALYSIS):**
   - Si hay una Descripción de Trabajo (JD), compara rigurosamente. Si no, usa estándares de la industria para el rol implícito.

### 📝 TU FORMATO DE SALIDA (Markdown Estricto en ESPAÑOL):

## 🎯 Diagnóstico Ejecutivo
**Puntaje ATS Estimado:** [0-100]/100
**Impresión del Reclutador:** *2 oraciones directas sobre si este CV pasa el filtro inicial humano.*

## 🚨 Banderas Rojas (Corregir Inmediatamente)
*Lista 3-5 errores fatales que impiden entrevistas (ej: ortografía, densidad, formato, falta de métricas).*

## 🧬 Análisis de Palabras Clave (Keywords)
*(Comparación CV vs Mercado/JD)*
* **❌ Faltantes:** [Keywords críticas ausentes]
* **⚠️ Débiles:** [Keywords presentes pero sin evidencia o contexto]

## ✨ Reescritura de Alto Impacto (Copia y Pega)
*Identifica los 3 puntos más débiles de la experiencia y reescríbelos usando el método STAR.*

> **🔴 Original:** "[Pega el texto débil original]"
> **🟢 Reescritura Experta:** "[Reescritura poderosa con verbos fuertes y métricas simuladas si es necesario para mostrar el ejemplo]"

## 💼 Optimización de Perfil (LinkedIn & Resumen)
* **Titular Sugerido para LinkedIn:** *Un titular atractivo que incluya cargo + especialidad + valor único.*
* **Resumen Profesional:** *Borrador de 3 oraciones enfocado en la propuesta de valor única.*

## 🚀 Plan de Acción Inmediato
*3 pasos específicos que el candidato debe tomar hoy.*
`;

const JOB_SEARCH_INSTRUCTION = `
Eres un HEADHUNTER DE ÉLITE y Especialista en Adquisición de Talento Global.
Tu tarea es encontrar las ofertas de trabajo más relevantes, bien remuneradas y activas para el candidato.

REGLAS:
1. **Datos en Tiempo Real:** Usa Google Search para encontrar ofertas *reales* y activas de los últimos 14 días.
2. **Calidad sobre Cantidad:** Filtra por empresas reputadas.
3. **Formato:** Presenta cada empleo claramente con Título, Empresa, Ubicación (o Remoto) y un "Insight" de por qué aplicar.
4. **Idioma:** Responde siempre en ESPAÑOL, aunque las ofertas estén en inglés.
`;

const INTERVIEW_INSTRUCTION = `
Eres un GERENTE DE CONTRATACIÓN EXIGENTE PERO JUSTO en una empresa líder.
Conduce una entrevista conductual (Behavioral Interview) basada en el método STAR.
1. Haz UNA pregunta a la vez.
2. Espera la respuesta del usuario.
3. Critica la respuesta en ESPAÑOL:
   - ¿Respondieron la pregunta específica?
   - ¿Usaron ejemplos concretos (Situación, Tarea, Acción, Resultado)?
   - ¿Fue estructurada?
4. Luego haz la siguiente pregunta.
5. Mantén un tono profesional pero alentador.
`;

export interface AnalyzeResumeInput {
  text?: string;
  file?: {
    data: string;     // base64 data without prefix
    mimeType: string; // e.g., 'application/pdf', 'image/png'
  };
}

export const analyzeResume = async (input: AnalyzeResumeInput, jobDescription?: string): Promise<string> => {
  try {
    const parts: any[] = [];

    // 1. Add file content (Multimodal)
    if (input.file) {
      parts.push({
        inlineData: {
          data: input.file.data,
          mimeType: input.file.mimeType
        }
      });
    }

    // 2. Add text content (DOCX extracted or Manual)
    if (input.text) {
      parts.push({ text: `--- CONTENIDO DEL CV DEL CANDIDATO ---\n${input.text}\n--- FIN DEL CONTENIDO ---` });
    }

    // 3. Add Context (Job Description)
    if (jobDescription) {
      parts.push({ text: `\n--- DESCRIPCIÓN DEL PUESTO (TARGET) ---\n${jobDescription}\n--- FIN DESCRIPCIÓN ---` });
    }

    // 4. Prompt
    parts.push({
      text: "Por favor, realiza una auditoría experta y profunda de esta hoja de vida basándote en la descripción del puesto (si se proporciona) o para el rol implícito. Sigue estrictamente el formato de salida definido en tus instrucciones del sistema y responde en ESPAÑOL."
    });

    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: { parts },
      config: {
        systemInstruction: RESUME_INSTRUCTION,
        temperature: 0.4, 
      }
    });

    return response.text || "No se pudo generar el análisis. Por favor intenta de nuevo.";
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw error;
  }
};

export const searchJobs = async (query: string): Promise<{ text: string; sources: GroundingChunk[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FLASH,
      contents: `Encuentra ofertas de trabajo activas para: "${query}". 
      Busca en LinkedIn, Indeed, Glassdoor y páginas de carreras directas.
      Prioriza publicaciones de la última semana. Responde en Español.`,
      config: {
        systemInstruction: JOB_SEARCH_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No se encontraron resultados.";
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { text, sources };
  } catch (error) {
    console.error("Error searching jobs:", error);
    throw error;
  }
};

export const createInterviewChat = (resumeContext?: string): Chat => {
  let instruction = INTERVIEW_INSTRUCTION;
  
  if (resumeContext) {
      instruction += `\n\nCONTEXTO IMPORTANTE DEL CANDIDATO (Úsalo para personalizar preguntas):\n${resumeContext}\n\nINSTRUCCIÓN ADICIONAL: NO hagas preguntas genéricas. Pregunta sobre SU experiencia específica mencionada arriba (proyectos, empresas, roles).`;
  }

  return ai.chats.create({
    model: MODEL_FLASH,
    config: {
      systemInstruction: instruction,
    },
  });
};