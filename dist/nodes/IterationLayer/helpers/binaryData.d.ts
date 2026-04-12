import type { IBinaryKeyData, IExecuteFunctions } from "n8n-workflow";
export declare function toBinaryOutput(executeFunctions: IExecuteFunctions, base64Buffer: string, mimeType: string, fileBaseName: string): Promise<IBinaryKeyData>;
