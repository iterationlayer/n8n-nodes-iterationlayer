import type { IExecuteFunctions } from "n8n-workflow";
interface FileInputBase64 {
    type: "base64";
    name: string;
    base64: string;
}
interface FileInputUrl {
    type: "url";
    name: string;
    url: string;
}
type FileInput = FileInputBase64 | FileInputUrl;
export declare function getFileInput(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<FileInput>;
export declare function getMultipleFileInputs(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<FileInput[]>;
export {};
