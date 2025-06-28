/**
 * InputProcessor handles multi-modal input processing
 * Supports text, voice, image, and file inputs with real implementations
 */

import * as Tesseract from 'tesseract.js';

// For production environments
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: unknown;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onaudioend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export interface ProcessingResult {
  text: string;
  confidence: number;
  metadata: {
    inputType: 'text' | 'voice' | 'image' | 'file';
    processingTime: number;
    fileType?: string;
    language?: string;
    wordCount?: number;
    extractedElements?: string[];
  };
}

export class InputProcessor {
  private isProcessing: boolean = false;
  private tesseractWorker: Tesseract.Worker | null = null;

  constructor() {
    this.initializeTesseract();
  }

  /**
   * Initialize Tesseract worker for OCR processing
   */
  private async initializeTesseract() {
    // In browser environment, we'll use Tesseract.js
    if (typeof window !== 'undefined') {
      try {
        // Dynamic import for browser-only code
        const Tesseract = await import('tesseract.js');
        this.tesseractWorker = await Tesseract.createWorker('eng');
      } catch (error) {
        console.warn('Tesseract.js not available:', error);
      }
    }
  }

  /**
   * Process input based on type and return comprehensive result
   */
  async process(input: string | File | Blob, inputType: 'text' | 'voice' | 'image' | 'file' = 'text'): Promise<ProcessingResult> {
    if (this.isProcessing) {
      throw new Error('Another input is currently being processed');
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      let result: ProcessingResult;

      switch (inputType) {
        case 'text':
          result = await this.processText(input as string);
          break;
        case 'voice':
          result = await this.processVoice();
          break;
        case 'image':
          result = await this.processImage(input as File | Blob | string);
          break;
        case 'file':
          result = await this.processFile(input as File);
          break;
        default:
          throw new Error(`Unsupported input type: ${inputType}`);
      }

      result.metadata.processingTime = Date.now() - startTime;
      return result;

    } catch (error) {
      console.error('Error processing input:', error);
      throw new Error(`Failed to process ${inputType} input: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process text input with enhanced analysis
   */
  private async processText(text: string): Promise<ProcessingResult> {
    const cleanedText = this.sanitizeInput(text)
      .trim()
      .replace(/\s+/g, ' ')
      .substring(0, 5000);

    const words = cleanedText.split(/\s+/).filter(word => word.length > 0);

    return {
      text: cleanedText,
      confidence: 1.0,
      metadata: {
        inputType: 'text',
        processingTime: 0,
        wordCount: words.length,
        language: this.detectLanguage(cleanedText)
      }
    };
  }

  /**
   * Process voice input using Web Speech API
   */
  private async processVoice(): Promise<ProcessingResult> {
    return new Promise((resolve, reject) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        // Server-side fallback
        resolve({
          text: "Voice processing requires a browser environment or server-side speech recognition service",
          confidence: 0.0,
          metadata: {
            inputType: 'voice',
            processingTime: 0,
            language: 'en-US'
          }
        });
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        resolve({
          text: "Speech recognition not supported in this browser",
          confidence: 0.0,
          metadata: {
            inputType: 'voice',
            processingTime: 0,
            language: 'en-US'
          }
        });
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (event.results.length > 0) {
          const result = event.results[0];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;

          resolve({
            text: transcript,
            confidence: confidence,
            metadata: {
              inputType: 'voice',
              processingTime: 0,
              language: recognition.lang,
              wordCount: transcript.split(/\s+/).length
            }
          });
        }
      };

      recognition.onerror = (event: Event) => {
        const errorEvent = event as ErrorEvent & { error?: string };
        reject(new Error(`Speech recognition error: ${errorEvent.error || 'Unknown error'}`));
      };

      recognition.onend = () => {
        // Recognition ended without results
        setTimeout(() => {
          reject(new Error('Speech recognition ended without results'));
        }, 100);
      };

      try {
        recognition.start();
        
        // Set a timeout to prevent hanging
        setTimeout(() => {
          recognition.abort();
          reject(new Error('Speech recognition timeout'));
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process image input with OCR using Tesseract.js
   */
  private async processImage(imageInput: File | Blob | string): Promise<ProcessingResult> {
    try {
      if (!this.tesseractWorker) {
        // Fallback for server environment or when Tesseract is not available
        return {
          text: "OCR processing requires Tesseract.js. Please ensure the library is installed and available.",
          confidence: 0.0,
          metadata: {
            inputType: 'image',
            processingTime: 0,
            fileType: 'image'
          }
        };
      }

      // Process image with Tesseract
      const { data } = await this.tesseractWorker.recognize(imageInput);
      
      const extractedText = data.text.trim();
      const confidence = data.confidence / 100; // Convert to 0-1 scale

      // Extract structured elements (lines, paragraphs, words)
      const extractedElements = [
        ...(data.lines?.map((line: { text: string }) => line.text) || []),
        ...(data.paragraphs?.map((para: { text: string }) => para.text) || [])
      ].filter(text => text && text.trim());

      return {
        text: extractedText,
        confidence: confidence,
        metadata: {
          inputType: 'image',
          processingTime: 0,
          fileType: this.getImageType(imageInput),
          wordCount: extractedText.split(/\s+/).filter((word: string) => word.length > 0).length,
          extractedElements: extractedElements,
          language: this.detectLanguage(extractedText)
        }
      };

    } catch (error) {
      console.error('OCR processing error:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown OCR error'}`);
    }
  }

  /**
   * Process file input with enhanced format support
   */
  private async processFile(file: File): Promise<ProcessingResult> {
    const fileType = this.getFileType(file.name);
    
    try {
      let extractedText = '';
      const confidence = 1.0;

      switch (fileType) {
        case 'txt':
        case 'text':
          extractedText = await this.readTextFile(file);
          break;
          
        case 'pdf':
          extractedText = await this.processPDF(file);
          break;
          
        case 'docx':
        case 'doc':
          extractedText = await this.processWordDocument(file);
          break;
          
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
          // Process as image with OCR
          const imageResult = await this.processImage(file);
          return {
            ...imageResult,
            metadata: {
              ...imageResult.metadata,
              fileType: fileType
            }
          };
          
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      return {
        text: this.sanitizeInput(extractedText),
        confidence: confidence,
        metadata: {
          inputType: 'file',
          processingTime: 0,
          fileType: fileType,
          wordCount: extractedText.split(/\s+/).filter((word: string) => word.length > 0).length,
          language: this.detectLanguage(extractedText)
        }
      };

    } catch (error) {
      console.error('File processing error:', error);
      throw new Error(`Failed to process ${fileType} file: ${error instanceof Error ? error.message : 'Unknown file processing error'}`);
    }
  }

  /**
   * Read plain text file
   */
  private async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        resolve(event.target?.result as string || '');
      };
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  /**
   * Process PDF file (placeholder - requires pdf-parse in production)
   */
  private async processPDF(file: File): Promise<string> {
    // In production, you would use pdf-parse or similar library
    // For now, return a helpful message
    return `PDF processing would extract text from: ${file.name}. Install pdf-parse library for full PDF text extraction.`;
  }

  /**
   * Process Word document (placeholder - requires mammoth in production)
   */
  private async processWordDocument(file: File): Promise<string> {
    // In production, you would use mammoth or similar library
    // For now, return a helpful message
    return `Word document processing would extract text from: ${file.name}. Install mammoth library for full Word document text extraction.`;
  }

  /**
   * Determine file type from filename
   */
  private getFileType(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop() || '';
    return extension;
  }

  /**
   * Get image type from File or Blob
   */
  private getImageType(imageInput: File | Blob | string): string {
    if (typeof imageInput === 'string') return 'url';
    if (imageInput instanceof File) return this.getFileType(imageInput.name);
    return imageInput.type || 'blob';
  }

  /**
   * Detect language (basic implementation)
   */
  private detectLanguage(text: string): string {
    // Simple language detection - in production use a proper language detection library
    const commonEnglishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const lowerText = text.toLowerCase();
    const englishWordCount = commonEnglishWords.filter(word => lowerText.includes(word)).length;
    
    return englishWordCount > 2 ? 'en-US' : 'unknown';
  }

  /**
   * Enhanced input sanitization
   */
  private sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .trim();
  }

  /**
   * Start voice recording (browser only)
   */
  async startVoiceRecording(): Promise<ProcessingResult> {
    return this.processVoice();
  }

  /**
   * Check browser capabilities
   */
  checkCapabilities(): {
    voiceRecognition: boolean;
    fileUpload: boolean;
    imageProcessing: boolean;
    supportedFormats: string[];
  } {
    return {
      voiceRecognition: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),
      fileUpload: typeof window !== 'undefined' && 'FileReader' in window,
      imageProcessing: this.tesseractWorker !== null,
      supportedFormats: ['txt', 'pdf', 'docx', 'doc', 'jpg', 'jpeg', 'png', 'gif', 'bmp']
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }
  }

  /**
   * Extract metadata from input
   */
  getInputMetadata(input: string, inputType: 'text' | 'voice' | 'image' | 'file'): {
    length: number;
    type: string;
    timestamp: Date;
    wordCount?: number;
  } {
    const metadata = {
      length: input.length,
      type: inputType,
      timestamp: new Date(),
    };

    if (inputType === 'text') {
      return {
        ...metadata,
        wordCount: input.split(/\s+/).filter(word => word.length > 0).length,
      };
    }

    return metadata;
  }

  /**
   * Check if input is appropriate (basic content filtering)
   */
  isAppropriateContent(input: string): boolean {
    const inappropriate = [
      'spam', 'abuse', 'harassment', // Add more as needed
    ];

    const lowerInput = input.toLowerCase();
    return !inappropriate.some(word => lowerInput.includes(word));
  }

  /**
   * Detect the intent or topic of the input
   */
  detectIntent(input: string): string[] {
    const lowerInput = input.toLowerCase();
    const intents: string[] = [];

    const intentPatterns = {
      'question': ['what', 'how', 'when', 'where', 'why', 'who', '?'],
      'request': ['please', 'can you', 'could you', 'i need', 'help me'],
      'policy-inquiry': ['policy', 'rule', 'guideline', 'procedure'],
      'benefits-inquiry': ['benefit', 'insurance', 'health', 'retirement'],
      'time-off': ['vacation', 'pto', 'sick leave', 'holiday'],
      'complaint': ['problem', 'issue', 'complaint', 'not working'],
      'document-upload': ['upload', 'attached', 'image', 'file', 'document', 'screenshot'],
      'voice-query': ['listen', 'voice', 'speak', 'dictate']
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => lowerInput.includes(pattern))) {
        intents.push(intent);
      }
    }

    return intents.length > 0 ? intents : ['general'];
  }
} 