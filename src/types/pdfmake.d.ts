
declare module 'pdfmake/build/pdfmake' {
  interface TDocumentDefinitions {
    content?: any;
    styles?: { [key: string]: any };
    defaultStyle?: any;
    pageSize?: string;
    pageMargins?: number[];
    header?: any;
    footer?: any;
  }

  interface TCreatedPdf {
    download(filename?: string): void;
    getBlob(callback: (blob: Blob) => void): void;
    getBase64(callback: (base64: string) => void): void;
    open(): void;
    print(): void;
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
