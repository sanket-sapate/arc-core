// CMP Widget Type Declarations
declare global {
  interface Window {
    ArcCMP?: {
      id: string;
      cdn: string;
    };
    CC?: {
      init: (config: {
        apiKey: string;
        apiUrl: string;
        uiUrl: string;
        cssUrl: string;
        containerId: string;
        autoMount: boolean;
        formSelector: string;
      }) => void;
    };
    CMP_INITIALIZED?: boolean;
  }
}

export {};
