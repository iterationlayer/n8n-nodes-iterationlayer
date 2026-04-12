import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class IterationLayerApi implements ICredentialType {
  name = "iterationLayerApi";
  displayName = "Iteration Layer API";
  documentationUrl = "https://iterationlayer.com/docs/n8n";

  properties: INodeProperties[] = [
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

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "=Bearer {{$credentials.apiKey}}",
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: "={{$credentials.baseUrl}}",
      url: "/v1/me",
      method: "GET",
    },
  };
}
