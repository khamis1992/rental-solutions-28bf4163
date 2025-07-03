/**
 * نظام شامل لضغط وتحسين الصور والملفات
 * Comprehensive image and file optimization system
 */

import { useState } from 'react';

// أنواع الصور المدعومة
export type SupportedImageFormats = 'jpeg' | 'jpg' | 'png' | 'webp' | 'gif' | 'bmp';

// إعدادات الضغط
export interface CompressionOptions {
  quality: number; // 0.1 - 1.0
  maxWidth?: number;
  maxHeight?: number;
  format?: SupportedImageFormats;
  enableWebP?: boolean;
  enableLazyLoading?: boolean;
  enableResponsive?: boolean;
}

// معلومات الصورة المحسنة
export interface OptimizedImageInfo {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  originalFormat: string;
  optimizedFormat: string;
  url: string;
  webpUrl?: string;
  responsiveSizes?: { [key: string]: string };
}

class ImageOptimizationService {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private webpSupport: boolean | null = null;

  constructor() {
    this.initializeCanvas();
    this.checkWebPSupport();
  }

  private initializeCanvas(): void {
    if (typeof window !== 'undefined') {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }
  }

  // فحص دعم WebP
  private async checkWebPSupport(): Promise<boolean> {
    if (this.webpSupport !== null) return this.webpSupport;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        this.webpSupport = img.height === 2;
        resolve(this.webpSupport);
      };
      img.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // ضغط صورة واحدة
  async compressImage(
    file: File, 
    options: CompressionOptions = { quality: 0.8 }
  ): Promise<OptimizedImageInfo> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'jpeg',
      enableWebP = true,
      enableResponsive = true
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        try {
          if (!this.canvas || !this.ctx) {
            throw new Error('Canvas not initialized');
          }

          // حساب الأبعاد الجديدة
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          );

          this.canvas.width = width;
          this.canvas.height = height;

          // رسم الصورة المحسنة
          this.ctx.drawImage(img, 0, 0, width, height);

          // إنشاء الصورة المضغوطة
          const mimeType = `image/${format}`;
          const compressedDataUrl = this.canvas.toDataURL(mimeType, quality);

          const optimizedInfo: OptimizedImageInfo = {
            originalSize: file.size,
            compressedSize: this.dataURLtoBlob(compressedDataUrl).size,
            compressionRatio: 0,
            originalFormat: file.type,
            optimizedFormat: mimeType,
            url: compressedDataUrl
          };

          optimizedInfo.compressionRatio = 
            ((optimizedInfo.originalSize - optimizedInfo.compressedSize) / optimizedInfo.originalSize) * 100;

          // إنشاء نسخة WebP إذا كان مدعوماً
          if (enableWebP && await this.checkWebPSupport()) {
            const webpDataUrl = this.canvas.toDataURL('image/webp', quality);
            optimizedInfo.webpUrl = webpDataUrl;
          }

          // إنشاء أحجام متجاوبة
          if (enableResponsive) {
            optimizedInfo.responsiveSizes = await this.generateResponsiveSizes(
              img, format, quality
            );
          }

          resolve(optimizedInfo);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // حساب الأبعاد المحسنة
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    let { width, height } = { width: originalWidth, height: originalHeight };

    // تقليل الحجم إذا كان أكبر من الحد الأقصى
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // إنشاء أحجام متجاوبة
  private async generateResponsiveSizes(
    img: HTMLImageElement,
    format: SupportedImageFormats,
    quality: number
  ): Promise<{ [key: string]: string }> {
    const sizes = {
      thumbnail: { width: 150, height: 150 },
      small: { width: 300, height: 300 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 }
    };

    const responsiveSizes: { [key: string]: string } = {};

    for (const [sizeName, dimensions] of Object.entries(sizes)) {
      if (!this.canvas || !this.ctx) continue;

      const { width, height } = this.calculateDimensions(
        img.width,
        img.height,
        dimensions.width,
        dimensions.height
      );

      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx.drawImage(img, 0, 0, width, height);

      responsiveSizes[sizeName] = this.canvas.toDataURL(`image/${format}`, quality);
    }

    return responsiveSizes;
  }

  // تحويل DataURL إلى Blob
  private dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  }

  // ضغط متعدد الصور مع شريط التقدم
  async compressBatch(
    files: File[],
    options: CompressionOptions,
    onProgress?: (progress: number, fileName: string) => void
  ): Promise<OptimizedImageInfo[]> {
    const results: OptimizedImageInfo[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (onProgress) {
        onProgress((i / files.length) * 100, file.name);
      }

      try {
        const result = await this.compressImage(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
      }
    }

    if (onProgress) {
      onProgress(100, 'Complete');
    }

    return results;
  }

  // تحسين الصور في الخلفية
  async optimizeInBackground(
    files: File[],
    options: CompressionOptions
  ): Promise<OptimizedImageInfo[]> {
    return new Promise((resolve, reject) => {
      if (!window.Worker) {
        // Fallback إذا لم تكن Web Workers مدعومة
        this.compressBatch(files, options).then(resolve).catch(reject);
        return;
      }

      // إنشاء Web Worker للمعالجة في الخلفية
      const workerCode = `
        self.onmessage = function(e) {
          const { files, options } = e.data;
          // معالجة الصور في الخلفية
          // (سيتم تطبيقه لاحقاً)
          self.postMessage({ type: 'complete', results: [] });
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));

      worker.postMessage({ files, options });

      worker.onmessage = (e) => {
        if (e.data.type === 'complete') {
          resolve(e.data.results);
          worker.terminate();
        }
      };

      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
    });
  }

  // إنشاء عنصر صورة محسن مع lazy loading
  createOptimizedImageElement(
    optimizedInfo: OptimizedImageInfo,
    alt: string,
    className?: string
  ): HTMLImageElement {
    const img = document.createElement('img');
    
    // استخدام WebP إذا كان متاحاً
    const useWebP = optimizedInfo.webpUrl && this.webpSupport;
    
    img.src = useWebP ? optimizedInfo.webpUrl! : optimizedInfo.url;
    img.alt = alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    
    if (className) {
      img.className = className;
    }

    // إضافة أحجام متجاوبة
    if (optimizedInfo.responsiveSizes) {
      img.sizes = '(max-width: 300px) 150px, (max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px';
    }

    return img;
  }

  // إحصائيات الضغط
  getCompressionStats(results: OptimizedImageInfo[]): {
    totalOriginalSize: number;
    totalCompressedSize: number;
    totalSavings: number;
    averageCompressionRatio: number;
  } {
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const totalSavings = totalOriginalSize - totalCompressedSize;
    const averageCompressionRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;

    return {
      totalOriginalSize,
      totalCompressedSize,
      totalSavings,
      averageCompressionRatio
    };
  }
}

// مثيل عام للخدمة
export const imageOptimizationService = new ImageOptimizationService();

// أدوات مساعدة لتحسين الصور
export const ImageOptimizationUtils = {
  // ضغط صورة بإعدادات افتراضية محسنة
  async quickCompress(file: File): Promise<OptimizedImageInfo> {
    return imageOptimizationService.compressImage(file, {
      quality: 0.85,
      maxWidth: 1920,
      maxHeight: 1080,
      format: 'jpeg',
      enableWebP: true,
      enableResponsive: true
    });
  },

  // ضغط للويب (جودة أقل، حجم أصغر)
  async compressForWeb(file: File): Promise<OptimizedImageInfo> {
    return imageOptimizationService.compressImage(file, {
      quality: 0.7,
      maxWidth: 1200,
      maxHeight: 800,
      format: 'jpeg',
      enableWebP: true,
      enableResponsive: true
    });
  },

  // ضغط للصور المصغرة
  async createThumbnail(file: File): Promise<OptimizedImageInfo> {
    return imageOptimizationService.compressImage(file, {
      quality: 0.8,
      maxWidth: 300,
      maxHeight: 300,
      format: 'jpeg',
      enableWebP: true,
      enableResponsive: false
    });
  },

  // فحص حجم الملف
  isLargeFile(file: File, maxSizeMB: number = 5): boolean {
    return file.size > maxSizeMB * 1024 * 1024;
  },

  // تنسيق حجم الملف للعرض
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// Hook لاستخدام تحسين الصور في React
export const useImageOptimization = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = async (
    file: File,
    options?: CompressionOptions
  ): Promise<OptimizedImageInfo> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const result = await imageOptimizationService.compressImage(file, options);
      setProgress(100);
      return result;
    } finally {
      setIsProcessing(false);
    }
  };

  const compressBatch = async (
    files: File[],
    options?: CompressionOptions
  ): Promise<OptimizedImageInfo[]> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const results = await imageOptimizationService.compressBatch(
        files,
        options || { quality: 0.8 },
        (progressValue) => setProgress(progressValue)
      );
      return results;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    compressImage,
    compressBatch,
    isProcessing,
    progress
  };
}; 