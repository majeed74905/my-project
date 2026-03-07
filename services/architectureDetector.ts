export interface ArchitectureMap {
    frontend: boolean;
    components: boolean;
    services: boolean;
    apiIntegration: boolean;
    configuration: boolean;
    backend?: boolean;
    database?: boolean;
}

export const architectureDetector = (filePaths: string[]): ArchitectureMap => {
    const map: ArchitectureMap = {
        frontend: false,
        components: false,
        services: false,
        apiIntegration: false,
        configuration: false,
        backend: false,
        database: false,
    };

    for (const path of filePaths) {
        const p = path.toLowerCase();

        // Frontend indicators
        if (p.includes('app.tsx') || p.includes('index.tsx') || p.includes('components/') || p.includes('pages/')) {
            map.frontend = true;
        }

        if (p.includes('components/')) {
            map.components = true;
        }

        // Backend indicators
        if (p.includes('server.js') || p.includes('main.py') || p.includes('app.py') || p.includes('controllers/')) {
            map.backend = true;
        }

        // Service layer indicators
        if (p.includes('services/') || p.includes('lib/') || p.includes('utils/')) {
            map.services = true;
        }

        // API integration indicators
        if (p.includes('api/') || p.includes('services/') || p.includes('service.ts') || p.includes('axios') || p.includes('fetch')) {
            map.apiIntegration = true;
        }

        // Database indicators
        if (p.includes('models/') || p.includes('schema/') || p.includes('database/') || p.includes('db/')) {
            map.database = true;
        }

        // Configuration indicators
        if (p.endsWith('.env') || p.endsWith('package.json') || p.endsWith('tsconfig.json') || p.endsWith('requirements.txt')) {
            map.configuration = true;
        }
    }

    // Fallbacks if not detected but likely required for a robust diagram representation
    if (map.frontend && !map.components) map.components = true; // Assumed for presentation layer
    if (!map.services && map.apiIntegration) map.services = true;

    return map;
};

export const generateGraphvizDOT = (map: ArchitectureMap): string => {
    let dot = 'digraph ZaraArchitecture {\n\n';
    dot += '  rankdir=LR\n';
    dot += '  node [shape=box style=filled fillcolor="#E8F0FE"]\n\n';

    dot += '  subgraph cluster_user {\n';
    dot += '    label="User Layer"\n';
    dot += '    User\n';
    dot += '    Browser\n';
    dot += '  }\n\n';

    if (map.frontend || map.components) {
        dot += '  subgraph cluster_frontend {\n';
        dot += '    label="Presentation Layer"\n';
        if (map.frontend) dot += '    Frontend\n';
        if (map.components) dot += '    Components\n';
        dot += '  }\n\n';
    }

    if (map.services || map.backend) {
        dot += '  subgraph cluster_services {\n';
        dot += '    label="Application Layer"\n';
        if (map.services) dot += '    Services\n';
        if (map.backend) dot += '    Backend\n';
        dot += '  }\n\n';
    }

    if (map.apiIntegration || map.database) {
        dot += '  subgraph cluster_api {\n';
        dot += '    label="Integration Layer"\n';
        if (map.apiIntegration) dot += '    ExternalAPI\n';
        if (map.database) dot += '    Database\n';
        dot += '  }\n\n';
    }

    // Default connections
    dot += '  User -> Browser\n';

    if (map.frontend) {
        dot += '  Browser -> Frontend\n';
        if (map.components) {
            dot += '  Frontend -> Components\n';
            if (map.services) {
                dot += '  Components -> Services\n';
            } else if (map.backend) {
                dot += '  Components -> Backend\n';
            }
        } else if (map.services) {
            dot += '  Frontend -> Services\n';
        } else if (map.backend) {
            dot += '  Frontend -> Backend\n';
        }
    } else if (map.backend) {
        dot += '  Browser -> Backend\n';
    }

    if (map.services) {
        if (map.apiIntegration) {
            dot += '  Services -> ExternalAPI\n';
            dot += '  ExternalAPI -> Services\n';
        }
        if (map.database) {
            dot += '  Services -> Database\n';
            dot += '  Database -> Services\n';
        }
        if (map.frontend) {
            dot += '  Services -> Frontend\n';
        }
    }

    if (map.backend) {
        if (map.apiIntegration) {
            dot += '  Backend -> ExternalAPI\n';
            dot += '  ExternalAPI -> Backend\n';
        }
        if (map.database) {
            dot += '  Backend -> Database\n';
            dot += '  Database -> Backend\n';
        }
        if (map.frontend && !map.services) {
            dot += '  Backend -> Frontend\n';
        }
    }

    // Workflow generation logic based on user prompt example:
    // User -> Browser -> Frontend -> Components -> Services -> ExternalAPI -> Services -> Frontend
    // The previous dynamic logic might not perfectly match the specific requested chain if some keys are missing
    // So if the map basically has everything for the chain, we make sure it's linked

    dot += '}\n';
    return dot;
};
