import { n } from 'utils';
import apiClient from './axios';

// Rules
export async function getRules(params) {
    return await apiClient.get('/rules', { params });
}

export async function getRule(id) {
    return await apiClient.get(`/rules/${id}`);
}

export async function postRule(data) {
    return await apiClient.post('/rules', data);
}

export async function updateRule(id, data) {
    return await apiClient.put(`/rules/${id}`, data);
}

export async function updateRuleState(id, data) {
    return await apiClient.put(`/rules/${id}/active`, data);
}

export async function deleteRule(id) {
    return await apiClient.delete(`/rules/${id}`);
}

export async function runRule(id) {
    return await apiClient.post(`/rules/${id}/run`);
}

export async function getExternalRules(params) {
    return await apiClient.get('/rules/external', { params });
}

export async function postImportRule(ids) {
    return await apiClient.post('/rules/external/import', { ids: ids });
}

export async function postSigmaConvertion(form) {
    return await apiClient.post('/rules/to-sigma', form, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

export async function postPreviewRule(data) {
    return await apiClient.post('/rules/preview', data);
}

export async function postLookupRule(data) {
    return await apiClient.post('/rules/eql-lookup', data);
}

// Asset
export async function getAssets(params) {
    return await apiClient.get('/assets', { params });
}

// TODO - move data to original call function
export async function updateAsset(asset) {
    const data = {
        name: asset.name,
        description: asset.description,
        vendor: asset.vendor,
        os: asset.os,
        hidden: asset.hidden,
        network: asset.network
    };
    return await apiClient.put(`/assets/${asset.uuid}`, data);
}

export async function getAssetAlerts(id, page) {
    const params = {
        page: page
    };
    return await apiClient.get(`/assets/${id}/alerts`, { params });
}

export async function getAssetEvents(id, params) {
    return await apiClient.get(`/assets/${id}/events`, { params });
}

// Alerts
export async function getAlerts(params) {
    return await apiClient.get('/alerts', { params });
}

export async function getAlert(id) {
    return await apiClient.get(`/alerts/${id}`);
}

export async function getAlertEvents(id) {
    return await apiClient.get(`/alerts/${id}/events`);
}

export async function updateAlertStatus(id, state) {
    return await apiClient.put(`/alerts/${id}/state`, { status: state });
}

// Fields
export async function getFields(datasource) {
    const params = { datasource: n(datasource) };
    return await apiClient.get('/fields', { params });
}

export async function getFieldSuggestions(field) {
    const params = { field: n(field) };
    return await apiClient.get('/fields/suggestion', { params });
}

export async function postFieldProfiler(data) {
    return await apiClient.post('/fields/profiler', data);
}

// Baseline
export async function getBaselineSettings() {
    return await apiClient.get('/baseline');
}

export async function postBaselineSettings(data) {
    return await apiClient.post('/baseline', data);
}

export async function getBaselineAlerts() {
    return await apiClient.get('/baseline/alerts');
}

// Analytics
export async function getBaselineAnalytics() {
    return await apiClient.get('/baseline/analytics');
}

export async function postBaselineAnalytic(analytic) {
    return await apiClient.post('/baseline/analytics', analytic);
}

export async function updateBaselineAnalytic(id, analytic) {
    return await apiClient.put(`/baseline/analytics/${id}`, analytic);
}

export async function postProfileAnalytic(analytic) {
    return await apiClient.post('/baseline/analytics/profile', analytic);
}

export async function deleteBaselineAnalytics(id) {
    return await apiClient.delete(`/baseline/analytics/${id}`);
}

export async function runBaselineAnalytic(id) {
    return await apiClient.post(`/baseline/analytics/${id}/run`);
}

// Datasources
export async function getDatasources() {
    return await apiClient.get('/management/datasources');
}

export async function postDatasource(datasource) {
    return await apiClient.post('/management/datasources', datasource);
}

export async function updateDatasource(name, datasource) {
    return await apiClient.put(`/management/datasources/${name}`, datasource);
}

export async function deleteDatasource(name) {
    return await apiClient.delete(`/management/datasources/${name}`);
}

export async function postDatasourceScan() {
    return await apiClient.post('/management/datasources/scan');
}

// Statistics
export async function getStats() {
    return await apiClient.get('/stats');
}

export async function getStatsAlert() {
    return await apiClient.get('/stats/alerts');
}

// Asset Settings
export async function getAssetSettings() {
    return await apiClient.get('/assets/settings');
}

export async function updateAssetSettings(subnets) {
    return await apiClient.post('/assets/settings', { subnets: subnets });
}

// Ingest Pipelines
export async function getIngestPipelines(page) {
    const params = { page: page };
    return await apiClient.get('/management/pipelines', { params });
}

export async function postIngestPipelines(pipeline) {
    return await apiClient.post('/management/pipelines', pipeline);
}

export async function deleteIngestPipeline(id) {
    return await apiClient.delete(`/management/pipelines/${id}`);
}

export async function uploadIngestPipeline(formFile) {
    const headers = {
        'Content-Type': 'multipart/form-data'
    };
    return await apiClient.get('/management/pipelines/upload', formFile, { headers });
}

// Sigma Repos
export async function getSigmaRepositories(page) {
    const params = { page: page };
    return await apiClient.get('/management/sigma', { params });
}

export async function postSigmaRepository(sigmaRepo) {
    return await apiClient.post('/management/sigma', sigmaRepo);
}

export async function updateSigmaRepository(id, sigmaRepo) {
    return await apiClient.put(`/management/sigma/${id}`, sigmaRepo);
}

export async function deleteSigmaRepository(id) {
    return await apiClient.delete(`/management/sigma/${id}`);
}

export async function postSigmaRepositorySync(id) {
    return await apiClient.post(`/management/sigma/${id}/sync`);
}

export async function postSigmaRepositoryClear(id) {
    return await apiClient.post(`/management/sigma/${id}/clear`);
}

// ATT&CK
export async function getATTACKTactics(matrix, complete, includeRules) {
    const params = { matrix: matrix, complete: complete, includeRules: includeRules };
    return await apiClient.get('/attack/tactics', { params });
}

export async function getATTACKTechniques(matrix, complete) {
    const params = { matrix: matrix, includeRules: true, complete: complete };
    return await apiClient.get('/attack/techniques', { params });
}

export async function getATTACKDatasources(matrix, complete) {
    const params = { matrix: matrix, complete: complete };
    return await apiClient.get('/attack/datasources', { params });
}

export async function getATTACKGroups(matrix, complete) {
    const params = { matrix: matrix, complete: complete };
    return await apiClient.get('/attack/groups', { params });
}

export async function getATTACKSoftware(matrix, complete) {
    const params = { matrix: matrix, complete: complete };
    return await apiClient.get('/attack/software', { params });
}

// Auth
export async function getUserData() {
    return await apiClient.get('/me');
}

export async function updateUserPassword(passwordData) {
    return await apiClient.post('/me/password', passwordData);
}

async function getLoginToken() {
    return await apiClient.get('/auth/login');
}

export async function postLogin(email, password) {
    await getLoginToken();
    const loginData = { email: email, password: password };
    return await apiClient.post('/auth/login', loginData);
}

export async function postLogout() {
    return await apiClient.post('/auth/logout');
}

// Health
export async function getHealth() {
    return await apiClient.get('/setup/health');
}
