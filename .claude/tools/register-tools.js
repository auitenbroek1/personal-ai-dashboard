#!/usr/bin/env node
/**
 * Tool Registration and Discovery System for Claude-Flow
 * Registers AI agent tools and makes them available for orchestrated use
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ToolRegistrar {
    constructor() {
        this.registryPath = path.join(__dirname, 'registry.json');
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.settingsPath = path.join(__dirname, '..', 'settings.json');
        this.toolsDir = __dirname;
        
        this.loadRegistry();
        this.loadClaudeFlowConfig();
    }

    loadRegistry() {
        try {
            this.registry = JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
        } catch (error) {
            console.error('Failed to load tool registry:', error.message);
            process.exit(1);
        }
    }

    loadClaudeFlowConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } else {
                this.config = {};
            }

            if (fs.existsSync(this.settingsPath)) {
                this.settings = JSON.parse(fs.readFileSync(this.settingsPath, 'utf8'));
            } else {
                this.settings = { permissions: { allow: [], deny: [] } };
            }
        } catch (error) {
            console.warn('Warning: Could not load claude-flow configuration:', error.message);
            this.config = {};
            this.settings = { permissions: { allow: [], deny: [] } };
        }
    }

    /**
     * Register all tools in the registry with claude-flow
     */
    async registerTools() {
        console.log('🔧 Registering AI Agent Tools with Claude-Flow...');
        
        const tools = this.registry.toolRegistry.tools;
        const registeredTools = [];

        for (const [toolName, toolDef] of Object.entries(tools)) {
            try {
                const registered = await this.registerTool(toolName, toolDef);
                if (registered) {
                    registeredTools.push(toolName);
                    console.log(`✅ Registered tool: ${toolName}`);
                } else {
                    console.log(`⚠️  Skipped tool: ${toolName} (already registered)`);
                }
            } catch (error) {
                console.error(`❌ Failed to register tool ${toolName}:`, error.message);
            }
        }

        // Update claude-flow settings to allow our tools
        await this.updateClaudeFlowPermissions(registeredTools);

        // Create tool discovery metadata
        await this.createToolDiscoveryMetadata(registeredTools);

        console.log(`\n🎉 Tool registration complete! Registered ${registeredTools.length} tools.`);
        return registeredTools;
    }

    /**
     * Register a single tool with claude-flow
     */
    async registerTool(toolName, toolDef) {
        const toolPath = path.join(this.toolsDir, path.basename(toolDef.implementation.path));
        
        // Ensure tool file exists and is executable
        if (!fs.existsSync(toolPath)) {
            throw new Error(`Tool implementation not found: ${toolPath}`);
        }

        // Make tool executable
        try {
            fs.chmodSync(toolPath, 0o755);
        } catch (error) {
            console.warn(`Warning: Could not make tool executable: ${error.message}`);
        }

        // Create tool wrapper for claude-flow integration
        const wrapperPath = await this.createToolWrapper(toolName, toolDef, toolPath);

        // Register with claude-flow (simplified - in practice this would use claude-flow's API)
        return true;
    }

    /**
     * Create a tool wrapper for claude-flow integration
     */
    async createToolWrapper(toolName, toolDef, toolPath) {
        const wrapperDir = path.join(this.toolsDir, 'wrappers');
        const wrapperPath = path.join(wrapperDir, `${toolName.toLowerCase()}-wrapper.js`);

        // Ensure wrapper directory exists
        if (!fs.existsSync(wrapperDir)) {
            fs.mkdirSync(wrapperDir, { recursive: true });
        }

        const wrapperContent = `#!/usr/bin/env node
/**
 * Claude-Flow Tool Wrapper for ${toolName}
 * Generated automatically by tool registration system
 */

const { spawn } = require('child_process');
const path = require('path');

class ${toolName}Wrapper {
    constructor() {
        this.toolPath = '${toolPath}';
        this.toolDef = ${JSON.stringify(toolDef, null, 2)};
    }

    async execute(input) {
        return new Promise((resolve, reject) => {
            const process = spawn('node', [this.toolPath], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let error = '';

            process.stdout.on('data', (data) => {
                output += data.toString();
            });

            process.stderr.on('data', (data) => {
                error += data.toString();
            });

            process.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (parseError) {
                        resolve({ success: false, error: 'Invalid JSON response', output });
                    }
                } else {
                    reject(new Error(\`Tool exited with code \${code}: \${error}\`));
                }
            });

            process.on('error', (err) => {
                reject(err);
            });

            // Send input to tool
            process.stdin.write(JSON.stringify(input));
            process.stdin.end();
        });
    }

    getSchema() {
        return {
            name: '${toolName}',
            description: this.toolDef.description,
            inputSchema: this.toolDef.inputSchema,
            outputSchema: this.toolDef.outputSchema
        };
    }
}

// CLI interface
if (require.main === module) {
    const wrapper = new ${toolName}Wrapper();
    
    const args = process.argv.slice(2);
    
    if (args[0] === '--schema') {
        console.log(JSON.stringify(wrapper.getSchema(), null, 2));
        process.exit(0);
    }
    
    let input;
    try {
        if (args.length > 0) {
            input = JSON.parse(args[0]);
        } else {
            // Read from stdin
            const stdin = process.stdin;
            let data = '';
            
            stdin.on('data', chunk => data += chunk);
            stdin.on('end', async () => {
                try {
                    input = JSON.parse(data);
                    const result = await wrapper.execute(input);
                    console.log(JSON.stringify(result, null, 2));
                    process.exit(0);
                } catch (error) {
                    console.error('Error:', error.message);
                    process.exit(1);
                }
            });
            
            return;
        }
        
        wrapper.execute(input).then(result => {
            console.log(JSON.stringify(result, null, 2));
            process.exit(0);
        }).catch(error => {
            console.error('Error:', error.message);
            process.exit(1);
        });
    } catch (error) {
        console.error('Invalid input:', error.message);
        process.exit(1);
    }
}

module.exports = ${toolName}Wrapper;
`;

        fs.writeFileSync(wrapperPath, wrapperContent);
        fs.chmodSync(wrapperPath, 0o755);

        return wrapperPath;
    }

    /**
     * Update claude-flow settings to allow our tools
     */
    async updateClaudeFlowPermissions(toolNames) {
        console.log('🔐 Updating Claude-Flow permissions...');

        // Add tool permissions to settings
        if (!this.settings.permissions) {
            this.settings.permissions = { allow: [], deny: [] };
        }

        for (const toolName of toolNames) {
            const permission = `${toolName}(*)`;
            if (!this.settings.permissions.allow.includes(permission)) {
                this.settings.permissions.allow.push(permission);
            }
        }

        // Add agent-related bash permissions
        const agentPermissions = [
            'Agent(*)',
            'AgentSpawner(*)',
            'AgentCoordinator(*)',
            'Task(*)',
            'Memory(*)',
            'TodoWrite(*)',
            'TodoRead(*)'
        ];

        for (const permission of agentPermissions) {
            if (!this.settings.permissions.allow.includes(permission)) {
                this.settings.permissions.allow.push(permission);
            }
        }

        try {
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
            console.log('✅ Updated Claude-Flow permissions');
        } catch (error) {
            console.warn('Warning: Could not update claude-flow settings:', error.message);
        }
    }

    /**
     * Create tool discovery metadata for claude-flow
     */
    async createToolDiscoveryMetadata(toolNames) {
        const metadata = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            tools: {},
            categories: this.registry.toolRegistry.categories,
            integrations: this.registry.toolRegistry.integrations
        };

        // Add tool metadata
        for (const toolName of toolNames) {
            const toolDef = this.registry.toolRegistry.tools[toolName];
            metadata.tools[toolName] = {
                name: toolName,
                version: toolDef.version,
                type: toolDef.type,
                category: toolDef.category,
                description: toolDef.description,
                capabilities: toolDef.capabilities,
                wrapper: path.join(this.toolsDir, 'wrappers', `${toolName.toLowerCase()}-wrapper.js`),
                registered: new Date().toISOString()
            };
        }

        const metadataPath = path.join(this.toolsDir, 'discovery.json');
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

        console.log(`✅ Created tool discovery metadata: ${metadataPath}`);
    }

    /**
     * Validate tool implementations
     */
    async validateTools() {
        console.log('🔍 Validating tool implementations...');

        const tools = this.registry.toolRegistry.tools;
        const validationResults = {};

        for (const [toolName, toolDef] of Object.entries(tools)) {
            try {
                const result = await this.validateTool(toolName, toolDef);
                validationResults[toolName] = result;
                
                if (result.valid) {
                    console.log(`✅ ${toolName}: Valid`);
                } else {
                    console.log(`❌ ${toolName}: ${result.errors.join(', ')}`);
                }
            } catch (error) {
                validationResults[toolName] = {
                    valid: false,
                    errors: [error.message]
                };
                console.log(`❌ ${toolName}: ${error.message}`);
            }
        }

        return validationResults;
    }

    /**
     * Validate a single tool
     */
    async validateTool(toolName, toolDef) {
        const errors = [];
        
        // Check if implementation file exists
        const toolPath = path.join(this.toolsDir, path.basename(toolDef.implementation.path));
        if (!fs.existsSync(toolPath)) {
            errors.push(`Implementation file not found: ${toolPath}`);
        }

        // Validate schema structure
        if (!toolDef.inputSchema || !toolDef.outputSchema) {
            errors.push('Missing input or output schema');
        }

        // Check dependencies
        if (toolDef.dependencies) {
            for (const dep of toolDef.dependencies) {
                // In practice, would check if dependency is available
                // For now, just validate format
                if (typeof dep !== 'string') {
                    errors.push(`Invalid dependency format: ${dep}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * List all registered tools
     */
    listTools() {
        console.log('📋 Registered AI Agent Tools:');
        console.log('================================');

        const tools = this.registry.toolRegistry.tools;
        
        for (const [toolName, toolDef] of Object.entries(tools)) {
            console.log(`\n🔧 ${toolName} (v${toolDef.version})`);
            console.log(`   Type: ${toolDef.type}`);
            console.log(`   Category: ${toolDef.category}`);
            console.log(`   Description: ${toolDef.description}`);
            console.log(`   Capabilities: ${toolDef.capabilities.join(', ')}`);
        }

        console.log('\n📊 Categories:');
        for (const [categoryName, categoryDef] of Object.entries(this.registry.toolRegistry.categories)) {
            console.log(`   ${categoryName}: ${categoryDef.tools.join(', ')}`);
        }
    }

    /**
     * Unregister tools
     */
    async unregisterTools(toolNames = null) {
        console.log('🗑️  Unregistering tools...');

        const toolsToUnregister = toolNames || Object.keys(this.registry.toolRegistry.tools);
        
        for (const toolName of toolsToUnregister) {
            try {
                // Remove wrapper
                const wrapperPath = path.join(this.toolsDir, 'wrappers', `${toolName.toLowerCase()}-wrapper.js`);
                if (fs.existsSync(wrapperPath)) {
                    fs.unlinkSync(wrapperPath);
                }

                // Remove from permissions
                const permission = `${toolName}(*)`;
                const index = this.settings.permissions.allow.indexOf(permission);
                if (index > -1) {
                    this.settings.permissions.allow.splice(index, 1);
                }

                console.log(`✅ Unregistered: ${toolName}`);
            } catch (error) {
                console.error(`❌ Failed to unregister ${toolName}:`, error.message);
            }
        }

        // Update settings
        try {
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
        } catch (error) {
            console.warn('Warning: Could not update settings:', error.message);
        }
    }
}

// CLI interface
if (require.main === module) {
    const registrar = new ToolRegistrar();
    const command = process.argv[2] || 'register';

    switch (command) {
        case 'register':
            registrar.registerTools().catch(console.error);
            break;
        case 'validate':
            registrar.validateTools().catch(console.error);
            break;
        case 'list':
            registrar.listTools();
            break;
        case 'unregister':
            const toolNames = process.argv.slice(3);
            registrar.unregisterTools(toolNames.length > 0 ? toolNames : null).catch(console.error);
            break;
        default:
            console.log('Usage: node register-tools.js [register|validate|list|unregister] [tool-names...]');
            break;
    }
}

module.exports = ToolRegistrar;