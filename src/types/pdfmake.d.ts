
declare module 'pdfmake/build/pdfmake' {
  interface TDocumentDefinitions {
    content?: any;
    styles?: { [key: string]: any };
    defaultStyle?: any;
    pageSize?: string | { width: number; height: number };
    pageMargins?: number[] | { left: number; top: number; right: number; bottom: number };
    header?: any;
    footer?: any;
    background?: any;
    info?: {
      title?: string;
      author?: string;
      subject?: string;
      keywords?: string;
      creator?: string;
      producer?: string;
      creationDate?: Date;
      modDate?: Date;
    };
    userPassword?: string;
    ownerPassword?: string;
    permissions?: {
      printing?: string;
      modifying?: boolean;
      copying?: boolean;
      annotating?: boolean;
      fillingForms?: boolean;
      contentAccessibility?: boolean;
      documentAssembly?: boolean;
    };
  }

  interface TCreatedPdf {
    download(filename?: string): void;
    getBlob(callback: (blob: Blob) => void): void;
    getBase64(callback: (base64: string) => void): void;
    getBuffer(callback: (buffer: Buffer) => void): void;
    getDataUrl(callback: (dataUrl: string) => void): void;
    open(options?: { silent?: boolean }): void;
    print(options?: { silent?: boolean }): void;
  }

  interface PdfMake {
    vfs?: { [file: string]: string };
    fonts?: { 
      [fontName: string]: { 
        normal: string; 
        bold: string; 
        italics: string; 
        bolditalics: string; 
      } 
    };
    createPdf(documentDefinition: TDocumentDefinitions): TCreatedPdf;
  }

  const pdfMake: PdfMake;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  export const pdfMake: {
    vfs: { [file: string]: string };
  };
}
