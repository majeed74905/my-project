import { architectureDetector, generateGraphvizDOT, ArchitectureMap } from './architectureDetector';

export type DiagramType = 'workflow' | 'algorithm' | 'architecture' | 'github_repo';

export interface DiagramRequest {
    type: DiagramType;
    prompt: string;
    context?: any;
}

export const diagramEngine = {
    detectDiagramType: (prompt: string): DiagramType => {
        const p = prompt.toLowerCase();
        if (p.includes('github') || p.includes('repository')) return 'github_repo';
        if (p.includes('architecture') || p.includes('system')) return 'architecture';
        if (p.includes('algorithm') || p.includes('flowchart') || p.includes('binary search')) return 'algorithm';
        return 'workflow';
    },

    generateSystemPrompt: (type: DiagramType): string => {
        const baseRule = "Mermaid diagrams are deprecated. Zara must only generate Graphviz DOT diagrams. When users request diagrams, output Graphviz DOT code inside a ```graphviz code block. Do not provide a text representation, simply provide the code block.";

        switch (type) {
            case 'workflow':
                return `${baseRule}\nYou are an expert in defining precise and clean Workflow diagrams. Use simple box nodes and rankdir=LR or TD. Ensure valid DOT syntax.`;
            case 'algorithm':
                return `${baseRule}\nYou are an expert in defining clear Algorithm Flowcharts. Use standard flowchart shapes (diamond for conditions, box for processes). Ensure valid DOT syntax.`;
            case 'architecture':
                return `${baseRule}\nYou are an expert in System Architecture diagrams. Map out frontends, APIs, backends, databases and services clearly using Graphviz DOT language.`;
            case 'github_repo':
                return `${baseRule}\nGenerate a structural diagram representing a GitHub repository's main components.`;
            default:
                return baseRule;
        }
    },

    generateGithubRepoDiagram: (filePaths: string[]): string => {
        const map: ArchitectureMap = architectureDetector(filePaths);
        return generateGraphvizDOT(map);
    }
};
