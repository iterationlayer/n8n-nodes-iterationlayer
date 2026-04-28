import type { IDataObject, IExecuteFunctions } from "n8n-workflow";
interface FileInputBase64 {
    type: "base64";
    name: string;
    base64: string;
}
interface FileInputUrl {
    type: "url";
    name?: string;
    url: string;
    fetch_options?: {
        auth?: IDataObject;
        headers?: IDataObject;
        locale?: string;
        user_agent?: string;
        timeout_ms?: number;
        should_render_javascript?: boolean;
    };
}
type FileInput = FileInputBase64 | FileInputUrl;
export declare function getFileInput(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<FileInput>;
export declare function getMultipleFileInputs(executeFunctions: IExecuteFunctions, itemIndex: number): Promise<FileInput[]>;
export {};
