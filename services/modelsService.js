const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config/config');

class ModelsService {
    constructor() {
        this.modelsPath = path.join(__dirname, '../templates/models.json');
        this.models = this.loadModels();
    }

    loadModels() {
        try {
            const data = fs.readFileSync(this.modelsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading models:', error);
            return [];
        }
    }

    saveModels(models) {
        try {
            fs.writeFileSync(this.modelsPath, JSON.stringify(models, null, 2));
            this.models = models;
            console.log(`Updated models.json with ${models.length} models`);
        } catch (error) {
            console.error('Error saving models:', error);
            throw error;
        }
    }

    async fetchAndUpdateModels() {
        try {
            const response = await axios.get(`${config.openRouterConfig.baseURL}/models`, {
                headers: config.openRouterConfig.headers
            });

            const models = response.data.data.map(model => ({
                id: model.id,
                name: model.name,
                description: model.description,
                context_length: model.context_length,
                pricing: model.pricing
            })).sort((a, b) => {
                if (a.id.includes(':free') && !b.id.includes(':free')) return -1;
                if (!a.id.includes(':free') && b.id.includes(':free')) return 1;
                return a.id.localeCompare(b.id);
            });

            this.saveModels(models);
            return models;
        } catch (error) {
            console.error('Error fetching models:', error.response?.data || error.message);
            throw error;
        }
    }

    validateModel(modelId) {
        return this.models.some(model => model.id === modelId);
    }

    getFallbackModel() {
        return this.models.find(model => model.id.includes(':free'))?.id || config.defaultModel;
    }

    getAllModels() {
        return this.models;
    }
}

module.exports = new ModelsService(); 