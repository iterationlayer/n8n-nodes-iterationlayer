"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IterationLayerApi = void 0;
class IterationLayerApi {
    name = "iterationLayerApi";
    displayName = "Iteration Layer API";
    documentationUrl = "https://iterationlayer.com/docs/n8n";
    properties = [
        {
            displayName: "API Key",
            name: "apiKey",
            type: "string",
            typeOptions: { password: true },
            default: "",
            placeholder: "il_xxxx",
            description: "Your Iteration Layer API key. Get one at https://platform.iterationlayer.com.",
        },
        {
            displayName: "Base URL",
            name: "baseUrl",
            type: "string",
            default: "https://api.iterationlayer.com",
            description: "Override the API base URL for development or self-hosted instances.",
        },
    ];
    authenticate = {
        type: "generic",
        properties: {
            headers: {
                Authorization: "=Bearer {{$credentials.apiKey}}",
            },
        },
    };
    test = {
        request: {
            baseURL: "={{$credentials.baseUrl}}",
            url: "/image-transformation/v1/transform",
            method: "POST",
        },
    };
}
exports.IterationLayerApi = IterationLayerApi;
