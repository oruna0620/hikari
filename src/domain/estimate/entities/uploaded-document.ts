export type DocumentStatus = "pending" | "processed" | "failed";
export type FileType = "image" | "pdf";

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: FileType;
  aiRawResponse: unknown;
  aiExtractedData: unknown;
  status: DocumentStatus;
  uploadedBy: string | null;
  createdAt: Date;
}
